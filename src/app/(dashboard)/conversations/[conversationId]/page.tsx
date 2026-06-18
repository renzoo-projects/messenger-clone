"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"
import ConversationHeader from "@/components/conversations/ConversationHeader"
import SummaryBanner from "@/components/conversations/SummaryBanner"
import MessageList from "@/components/conversations/MessageList"
import MessageInput from "@/components/conversations/MessageInput"
import ProfileDrawer from "@/components/conversations/ProfileDrawer"
import GroupDrawer from "@/components/conversations/GroupDrawer"
import Skeleton from "@/components/ui/Skeleton"
import useConversation from "@/hooks/useConversation"
import { getPusherClient } from "@/lib/pusherClient"
import { hapticLight } from "@/lib/haptic"
import { FullConversationType, FullMessageType } from "@/types"

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const { setConversationId } = useConversation()
  const [conversation, setConversation] = useState<FullConversationType | null>(null)
  const [messages, setMessages] = useState<FullMessageType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryMessageCount, setSummaryMessageCount] = useState(0)
  const channelRef = useRef<any>(null)

  const conversationId = params.conversationId as string

  useEffect(() => {
    setConversationId(conversationId)
    return () => {
      setConversationId(null)
      setSummary(null)
      setSummaryMessageCount(0)
    }
  }, [conversationId, setConversationId])

  useEffect(() => {
    if (!conversationId) return

    const loadConversation = async () => {
      try {
        const convRes = await fetch(`/api/conversations/${conversationId}`)
        if (!convRes.ok) throw new Error("Failed to load conversation")
        const convData = await convRes.json()
        setConversation(convData)
        if (Array.isArray(convData.messages)) setMessages(convData.messages)
      } catch (err) {
        console.error("Failed to load conversation", err)
        toast.error("Failed to load conversation")
      } finally {
        setIsLoading(false)
      }
    }

    loadConversation()
  }, [conversationId])

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
      setMessages((prev) => [...prev, message])
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

  const handleSendMessage = async (body: string, image?: string) => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body, image: image || undefined }),
      })

      if (!res.ok) throw new Error("Failed to send")
      hapticLight()
    } catch {
      toast.error("Failed to send message")
    }
  }

  const handleEngage = useCallback(async () => {
    if (!conversationId) return
    try {
      await fetch(`/api/conversations/${conversationId}/seen`, { method: "POST" })
    } catch {}
  }, [conversationId])

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 lg:px-8 py-3 border-b flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex-1 px-4 py-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "justify-end" : ""}`}>
              <div className={`space-y-2 ${i % 2 === 0 ? "items-end" : ""}`}>
                <Skeleton className={`h-12 ${i % 2 === 0 ? "ml-auto" : ""} ${i % 2 === 0 ? "w-48" : "w-56"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

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
      <MessageList messages={messages} isGroup={conversation?.isGroup} />
      <MessageInput onSend={handleSendMessage} onEngage={handleEngage} />
    </div>
  )
}
