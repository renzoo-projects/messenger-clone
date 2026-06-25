"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { FullConversationType } from "@/types"
import { api } from "@/lib/axios"
import { getPusherClient } from "@/lib/pusherClient"
import usePusherConnection from "@/lib/pusherConnectionStore"
import useConversationCache from "@/hooks/useConversationCache"

export function useConversations(initialData?: FullConversationType[]) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<FullConversationType[]>(initialData || [])
  const [isLoading, setIsLoading] = useState(!initialData && !!session?.user?.id)
  const userId = session?.user?.id
  const setCached = useConversationCache((s) => s.setCached)
  const getCached = useConversationCache((s) => s.getCached)
  const clearCached = useConversationCache((s) => s.clearCached)

  useEffect(() => {
    if (initialData || !userId) return

    const fetchConversations = async () => {
      setIsLoading(true)
      try {
        const { data } = await api.get("/api/conversations")
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

    channel.bind("conversation:update", (data: FullConversationType | { id: string; unreadCount?: number }) => {
      setConversations((prev) => {
        if ("users" in data) {
          setCached(data.id, { conversation: data as FullConversationType })
          return [data as FullConversationType, ...prev.filter((c) => c.id !== data.id)]
        }
        return prev.map((c) => {
          if (c.id !== data.id) return c
          const existing = getCached(data.id)
          if (existing) {
            setCached(data.id, {
              conversation: { ...existing.conversation, unreadCount: data.unreadCount ?? 0 },
            })
          }
          return { ...c, unreadCount: data.unreadCount ?? 0 }
        })
      })
    })

    channel.bind("conversation:delete", (deleted: { id: string }) => {
      setConversations((prev) => prev.filter((c) => c.id !== deleted.id))
      clearCached(deleted.id)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
    }
  }, [userId, setCached, getCached, clearCached])

  const reconnectCount = usePusherConnection((s) => s.reconnectCount)

  useEffect(() => {
    const refetch = async () => {
      try {
        const { data } = await api.get("/api/conversations")
        if (Array.isArray(data)) setConversations(data)
      } catch {}
    }
    refetch()
  }, [reconnectCount])

  return { conversations, isLoading }
}
