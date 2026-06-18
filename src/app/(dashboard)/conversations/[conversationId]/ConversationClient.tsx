"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import dynamic from "next/dynamic"
import ConversationHeader from "@/components/conversations/ConversationHeader"
import MessageList from "@/components/conversations/MessageList"
import MessageInput from "@/components/conversations/MessageInput"

const ProfileDrawer = dynamic(() => import("@/components/conversations/ProfileDrawer"))
const GroupDrawer = dynamic(() => import("@/components/conversations/GroupDrawer"))
const SummaryBanner = dynamic(() => import("@/components/conversations/SummaryBanner"))
import useConversation from "@/hooks/useConversation"
import { getPusherClient } from "@/lib/pusherClient"
import { hapticLight } from "@/lib/haptic"
import { FullConversationType, FullMessageType } from "@/types"

interface ConversationClientProps {
  initialConversation: FullConversationType
  conversationId: string
}

export default function ConversationClient({
  initialConversation,
  conversationId,
}: ConversationClientProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { setConversationId } = useConversation()
  const [conversation, setConversation] = useState(initialConversation)
  const [messages, setMessages] = useState<FullMessageType[]>(initialConversation.messages)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryMessageCount, setSummaryMessageCount] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    setConversationId(conversationId)
    return () => {
      setConversationId(null)
      setSummary(null)
      setSummaryMessageCount(0)
    }
  }, [conversationId, setConversationId])

  useEffect(() => {
    setMessages(initialConversation.messages)
    setNextCursor(null)
  }, [initialConversation])

  const loadMore = useCallback(async () => {
    if (loadingMore || !nextCursor) return
    setLoadingMore(true)
    try {
      const res = await fetch(
        `/api/messages/${conversationId}?cursor=${nextCursor}&take=50`
      )
      if (!res.ok) throw new Error("Failed to load more")
      const data = await res.json()
      setMessages((prev) => [...data.messages, ...prev])
      setNextCursor(data.nextCursor)
    } catch {
      toast.error("Failed to load older messages")
    } finally {
      setLoadingMore(false)
    }
  }, [conversationId, nextCursor, loadingMore])

  useEffect(() => {
    if (!conversationId) return

    const pusherClient = getPusherClient()
    const channelName = `private-conversation-${conversationId}`
    const channel = pusherClient.subscribe(channelName)
    channelRef.current = channel

    channel.bind("conversation:update", (conv: FullConversationType) => {
      setConversation(conv)
    })

    channel.bind("messages:new", (message: FullMessageType) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
    })

    channel.bind("message:seen", ({ messageId, userId, user }: { messageId: string; userId: string; user: any }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, seenBy: [...m.seenBy.filter((s) => s.user.id !== userId), { userId, user }] }
            : m
        )
      )
    })

    channel.bind("conversation:delete", () => {
      router.push("/conversations")
    })

    return () => {
      channel.unbind_all()
      if (typeof window !== "undefined") {
        const pusherClient = getPusherClient()
        pusherClient.unsubscribe(channelName)
      }
      channelRef.current = null
    }
  }, [conversationId, router])

  const handleSummarize = useCallback(async () => {
    setSummaryLoading(true)
    setSummary(null)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/summarize`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        setSummary(data.summary)
        setSummaryMessageCount(data.messageCount)
      }
    } catch {
      toast.error("Couldn't generate summary. Try again.")
    } finally {
      setSummaryLoading(false)
    }
  }, [conversationId])

  const handleSendMessage = useCallback(async (body: string, image?: string) => {
    const tempId = `temp-${Date.now()}`
    const currentUserId = session?.user?.id || ""
    const tempMessage: FullMessageType & { _status?: string } = {
      id: tempId,
      body: body || null,
      image: image || null,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUserId,
        name: session?.user?.name || "You",
        image: session?.user?.image || null,
        email: session?.user?.email || "",
        emailVerified: null,
        createdAt: "",
        updatedAt: "",
      },
      seenBy: [],
      _status: "sending",
    }
    setMessages((prev) => [...prev, tempMessage as FullMessageType])

    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body, image: image || undefined }),
      })
      if (!res.ok) throw new Error("Failed to send")
      const realMessage = await res.json()
      setMessages((prev) => prev.map((m) => (m.id === tempId ? realMessage : m)))
      hapticLight()
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      toast.error("Failed to send message")
    }
  }, [conversationId, session?.user?.id, session?.user?.name, session?.user?.image, session?.user?.email])

  const handleEngage = useCallback(async () => {
    if (!conversationId) return
    try {
      await fetch(`/api/conversations/${conversationId}/seen`, { method: "POST" })
    } catch {}
  }, [conversationId])

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Conversation not found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            This conversation may have been deleted or you may not have access.
          </p>
          <Link
            href="/conversations"
            className="mt-4 inline-block text-sm text-sky-600 hover:text-sky-500 font-medium"
          >
            Back to conversations
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ProfileDrawer />
      <GroupDrawer />
      <ConversationHeader
        conversation={conversation}
        onSummarize={handleSummarize}
      />
      <SummaryBanner
        summary={summary}
        messageCount={summaryMessageCount}
        loading={summaryLoading}
        onClose={() => {
          setSummary(null)
          setSummaryMessageCount(0)
        }}
      />
      <MessageList messages={messages} isGroup={conversation.isGroup} loadMore={loadMore} hasMore={!!nextCursor} loadingMore={loadingMore} />
      <MessageInput onSend={handleSendMessage} onEngage={handleEngage} />
    </div>
  )
}
