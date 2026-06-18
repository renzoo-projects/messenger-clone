"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { FullConversationType } from "@/types"
import { getPusherClient } from "@/lib/pusherClient"

export function useConversations() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<FullConversationType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const channelRef = useRef<any>(null)
  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) {
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
  }, [userId])

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
    })

    channel.bind("conversation:update", (conversation: FullConversationType) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? conversation : c))
      )
    })

    channel.bind("conversation:delete", (deleted: { id: string }) => {
      setConversations((prev) => prev.filter((c) => c.id !== deleted.id))
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
      channelRef.current = null
    }
  }, [userId])

  return { conversations, isLoading }
}
