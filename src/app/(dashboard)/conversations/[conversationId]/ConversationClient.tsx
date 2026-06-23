"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import dynamic from "next/dynamic"
import { api } from "@/lib/axios"
import ConversationHeader from "@/components/conversations/ConversationHeader"
import MessageList from "@/components/conversations/MessageList"
import MessageInput from "@/components/conversations/MessageInput"

const ProfileDrawer = dynamic(() => import("@/components/conversations/ProfileDrawer"))
const GroupDrawer = dynamic(() => import("@/components/conversations/GroupDrawer"))
const SummaryBanner = dynamic(() => import("@/components/conversations/SummaryBanner"))
import useConversation from "@/hooks/useConversation"
import useConversationCache from "@/hooks/useConversationCache"
import { getPusherClient } from "@/lib/pusherClient"
import usePusherConnection from "@/lib/pusherConnectionStore"
import { hapticLight } from "@/lib/haptic"
import { FullConversationType, FullMessageType, OptimisticMessageType, SafeUser } from "@/types"

interface ConversationClientProps {
  conversationId: string
}

export default function ConversationClient({
  conversationId,
}: ConversationClientProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { setConversationId } = useConversation()
  const getCached = useConversationCache((s) => s.getCached)
  const setCached = useConversationCache((s) => s.setCached)
  const clearCached = useConversationCache((s) => s.clearCached)
  const cached = getCached(conversationId)
  const [conversation, setConversation] = useState<FullConversationType | null>(
    cached?.conversation ?? null
  )
  const [messages, setMessages] = useState<FullMessageType[]>(
    cached?.messages ?? []
  )
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryMessageCount, setSummaryMessageCount] = useState(0)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(
    cached?.nextCursor ?? null
  )
  const [loading, setLoading] = useState(!cached)
  const [loadingMore, setLoadingMore] = useState(false)
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set())
  const currentUserIdRef = useRef(session?.user?.id)
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    currentUserIdRef.current = session?.user?.id
  }, [session?.user?.id])

  useEffect(() => {
    setConversationId(conversationId)
    setSummary(null)
    setSummaryMessageCount(0)
    setSummaryError(null)
    return () => {
      setConversationId(null)
    }
  }, [conversationId, setConversationId])

  useEffect(() => {
    if (!conversationId) return
    const controller = new AbortController()
    api.post(`/api/conversations/${conversationId}/seen`, { signal: controller.signal }).catch(() => {})
    return () => controller.abort()
  }, [conversationId])

  useEffect(() => {
    if (!conversationId) return
    const abortController = new AbortController()

    const currentlyCached = getCached(conversationId)
    if (currentlyCached) {
      setConversation(currentlyCached.conversation)
      setMessages(currentlyCached.messages)
      setNextCursor(currentlyCached.nextCursor)
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        let convRes, msgRes
        try {
          [convRes, msgRes] = await Promise.all([
            api.get(`/api/conversations/${conversationId}`, { signal: abortController.signal }),
            api.get(`/api/messages/${conversationId}?take=25`, { signal: abortController.signal }),
          ])
        } catch {
          setLoading(false)
          return
        }
        const conv = convRes.data
        const msgData = msgRes.data

        setConversation(conv)
        setMessages((prev) => {
          const incoming = msgData.messages ?? []
          const incomingIds = new Set(incoming.map((m: FullMessageType) => m.id))
          const prevNonTemp = prev.filter(m => !incomingIds.has(m.id))
          return [...incoming, ...prevNonTemp]
        })
        setNextCursor(msgData.nextCursor ?? null)
        setLoading(false)

        setCached(conversationId, {
          conversation: conv,
          messages: msgData.messages ?? [],
          nextCursor: msgData.nextCursor ?? null,
        })
      } catch (err) {
        if (axios.isCancel(err)) return
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          clearCached(conversationId)
          router.push("/conversations")
          return
        }
        setLoading(false)
      }
    }

    fetchData()

    return () => abortController.abort()
  }, [conversationId, getCached, setCached])

  const loadMore = useCallback(async () => {
    if (loadingMore || !nextCursor) return
    setLoadingMore(true)
    try {
      const { data } = await api.get(
        `/api/messages/${conversationId}?cursor=${nextCursor}&take=50`
      )
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

    channel.bind("conversation:update", (conv: FullConversationType) => {
      setConversation(conv)
    })

    channel.bind("messages:new", (message: FullMessageType) => {
      if (message.sender?.id === currentUserIdRef.current) return
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
    })

    channel.bind("messages:seen", ({ messageIds, userId, user }: { messageIds: string[]; userId: string; user: SafeUser }) => {
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m.id)
            ? { ...m, seenBy: [...m.seenBy.filter((s) => s.user.id !== userId), { userId, user }] }
            : m
        )
      )
    })

    channel.bind("conversation:delete", () => {
      router.push("/conversations")
    })

    channel.bind("typing:start", ({ userId }: { userId: string }) => {
      if (userId === currentUserIdRef.current) return
      setTypingUserIds((prev) => {
        const next = new Set(prev)
        next.add(userId)
        return next
      })
      const existing = typingTimersRef.current.get(userId)
      if (existing) clearTimeout(existing)
      typingTimersRef.current.set(
        userId,
        setTimeout(() => {
          setTypingUserIds((prev) => {
            const next = new Set(prev)
            next.delete(userId)
            return next
          })
          typingTimersRef.current.delete(userId)
        }, 4000)
      )
    })

    channel.bind("typing:stop", ({ userId }: { userId: string }) => {
      const timer = typingTimersRef.current.get(userId)
      if (timer) clearTimeout(timer)
      typingTimersRef.current.delete(userId)
      setTypingUserIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    })

    return () => {
      channel.unbind_all()
      const timers = typingTimersRef.current
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
      if (typeof window !== "undefined") {
        const pusherClient = getPusherClient()
        pusherClient.unsubscribe(channelName)
      }
    }
  }, [conversationId, router])

  const reconnectCount = usePusherConnection((s) => s.reconnectCount)

  useEffect(() => {
    if (!conversationId) return
    const abortController = new AbortController()

    const refetch = async () => {
      try {
        const [convRes, msgRes] = await Promise.all([
          api.get(`/api/conversations/${conversationId}`, { signal: abortController.signal }),
          api.get(`/api/messages/${conversationId}?take=50`, { signal: abortController.signal }),
        ])
        const conv = convRes.data
        setConversation(conv)
        setCached(conversationId, { conversation: conv })
        const data = msgRes.data
        if (data.messages?.length) {
          setMessages((prev) => {
            const incoming = data.messages
            const incomingIds = new Set(incoming.map((m: any) => m.id))
            const prevNonTemp = prev.filter((m) => !incomingIds.has(m.id))
            return [...incoming, ...prevNonTemp]
          })
          setNextCursor(data.nextCursor ?? null)
          setCached(conversationId, {
            messages: data.messages,
            nextCursor: data.nextCursor ?? null,
          })
        }
      } catch (err) {
        if (axios.isCancel(err)) return
      }
    }
    refetch()
    return () => abortController.abort()
  }, [conversationId, reconnectCount, setCached])

  const handleTypingAction = useCallback((action: "start" | "stop") => {
    api.post(`/api/conversations/${conversationId}/typing`, { action }).catch(() => {})
  }, [conversationId])

  const handleSummarize = useCallback(async () => {
    setSummaryLoading(true)
    setSummary(null)
    setSummaryError(null)
    try {
      const { data } = await api.post(`/api/conversations/${conversationId}/summarize`)
      if (data.error) {
        setSummaryError(data.error)
      } else {
        setSummary(data.summary)
        setSummaryMessageCount(data.messageCount)
      }
    } catch {
      setSummaryError("Couldn't generate summary. Try again.")
    } finally {
      setSummaryLoading(false)
    }
  }, [conversationId])

  const handleSendMessage = useCallback(async (body: string, files?: File[]) => {
    const tempId = `temp-${crypto.randomUUID()}`
    const currentUserId = session?.user?.id || ""
    const localUrls = files?.map((f) => URL.createObjectURL(f)) || []
    const tempMessage: OptimisticMessageType = {
      id: tempId,
      body: body || null,
      image: null,
      images: localUrls,
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
    setMessages((prev) => [...prev, tempMessage])

    try {
      let imageUrls: string[] = []
      if (files && files.length > 0) {
        const uploads = files.map(async (file) => {
          const fd = new FormData()
          fd.append("file", file)
          const { data } = await api.post("/api/upload", fd)
          if (!data.url) throw new Error("No URL returned")
          return data.url
        })
        imageUrls = await Promise.all(uploads)
      }

      const { data } = await api.post(`/api/messages/${conversationId}`, {
        message: body,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      })
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)))
      hapticLight()
      requestAnimationFrame(() => localUrls.forEach((u) => URL.revokeObjectURL(u)))
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      localUrls.forEach((u) => URL.revokeObjectURL(u))
      toast.error("Failed to send message")
    }
  }, [conversationId, session?.user])

  if (!conversation && loading) {
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800 motion-safe:animate-pulse">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
        <div className="flex-1 px-4 py-6 space-y-4">
          <div className="flex justify-start">
            <div className="h-10 w-48 rounded-[22px] rounded-bl-sm bg-white dark:bg-gray-900 shadow-sm" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-36 rounded-[22px] rounded-br-sm bg-blue-100 dark:bg-blue-900/30 shadow-sm" />
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="h-11 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800" />
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
            className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-500 font-medium"
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
        summarizing={summaryLoading}
        typingUserIds={typingUserIds}
      />
      <div className="relative flex-1 min-h-0 flex flex-col">
        <SummaryBanner
          summary={summary}
          messageCount={summaryMessageCount}
          loading={summaryLoading}
          error={summaryError}
          onClose={() => {
            setSummary(null)
            setSummaryMessageCount(0)
            setSummaryError(null)
          }}
          onRetry={handleSummarize}
        />
        <MessageList messages={messages} isGroup={conversation.isGroup} loadMore={loadMore} hasMore={!!nextCursor} loadingMore={loadingMore} typingUserIds={typingUserIds} conversation={conversation} />
      </div>
      <MessageInput key={conversationId} onSend={handleSendMessage} onTypingAction={handleTypingAction} />
    </div>
  )
}
