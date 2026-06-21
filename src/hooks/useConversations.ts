"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { FullConversationType } from "@/types"
import { getPusherClient } from "@/lib/pusherClient"
import usePusherConnection from "@/lib/pusherConnectionStore"
import useConversationCache from "@/hooks/useConversationCache"

export function useConversations(initialData?: FullConversationType[]) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<FullConversationType[]>(initialData || [])
  const [isLoading, setIsLoading] = useState(!initialData)
  const channelRef = useRef<any>(null)
  const userId = session?.user?.id
  const setCached = useConversationCache((s) => s.setCached)
  const getCached = useConversationCache((s) => s.getCached)
  const clearCached = useConversationCache((s) => s.clearCached)

  useEffect(() => {
    if (initialData || !userId) {
      setIsLoading(false)
      return
    }

    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/conversations")
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        if (Array.isArray(data)) setConversations(data)
      } catch (error) {
        console.error("Failed to fetch conversations", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [userId, initialData])

  useEffect(() => {
    if (!userId) return

    const pusherClient = getPusherClient()
    const channelName = `private-${userId}`
    const channel = pusherClient.subscribe(channelName)
    channelRef.current = channel

    channel.bind("conversation:new", (conversation: FullConversationType) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conversation.id)
        if (exists) return prev
        return [conversation, ...prev]
      })
      setCached(conversation.id, {
        conversation,
        messages: conversation.messages ?? [],
        nextCursor: null,
      })
    })

    channel.bind("conversation:update", (data: any) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== data.id) return c
          if ("users" in data) {
            setCached(data.id, { conversation: data as FullConversationType })
            return data as FullConversationType
          }
          const existing = getCached(data.id)
          if (existing) {
            setCached(data.id, {
              conversation: { ...existing.conversation, unreadCount: data.unreadCount ?? 0 },
            })
          }
          return { ...c, unreadCount: data.unreadCount ?? 0 }
        })
      )
    })

    channel.bind("conversation:delete", (deleted: { id: string }) => {
      setConversations((prev) => prev.filter((c) => c.id !== deleted.id))
      clearCached(deleted.id)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
      channelRef.current = null
    }
  }, [userId, setCached, getCached, clearCached])

  const { status, previousStatus } = usePusherConnection()
  const isReconnectedRef = useRef(false)
  const initialConnectRef = useRef(true)

  useEffect(() => {
    if (initialConnectRef.current) {
      initialConnectRef.current = false
      return
    }
    if (previousStatus && previousStatus !== "connected" && status === "connected") {
      isReconnectedRef.current = true
    }
  }, [status, previousStatus])

  const refetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setConversations(data)
      }
    } catch {
      // Silent — will retry on next reconnect
    }
  }, [])

  useEffect(() => {
    if (!isReconnectedRef.current) return
    isReconnectedRef.current = false
    refetchConversations()
  }, [status, refetchConversations])

  return { conversations, isLoading }
}
