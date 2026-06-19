"use client"

import { useRef, useEffect, useMemo, useCallback, memo } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import clsx from "clsx"
import { FullMessageType } from "@/types"
import { format, isToday, isYesterday } from "date-fns"
import Avatar from "@/components/ui/Avatar"
import useActiveList from "@/hooks/useActiveList"


interface MessageListProps {
  messages: FullMessageType[]
  isGroup?: boolean
  loadMore?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  typingUserIds?: Set<string>
  conversation?: { users: { id: string; name: string | null; image: string | null }[] }
}

const TypingIndicator = memo(function TypingIndicator({
  typingUsers,
  isGroup,
}: {
  typingUsers: { id: string; name: string | null; image: string | null }[]
  isGroup?: boolean
}) {
  if (typingUsers.length === 0) return null

  return (
    <div className="flex gap-2 mb-1 motion-safe:animate-fadeIn">
      <div className="flex-shrink-0 mt-1 self-end">
        <Avatar user={typingUsers[0]} size="sm" />
      </div>
      <div className="flex flex-col items-start">
        {isGroup && (
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-0.5">
            {typingUsers[0]?.name || "Someone"}
          </span>
        )}
        <div className="flex items-center gap-1 rounded-[18px] bg-white dark:bg-gray-800 px-4 py-3 shadow-sm rounded-bl-sm">
          <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-400 animate-typing-dot" />
          <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-400 animate-typing-dot" style={{ animationDelay: "0.16s" }} />
          <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-400 animate-typing-dot" style={{ animationDelay: "0.32s" }} />
        </div>
      </div>
    </div>
  )
})

const MessageList = memo(function MessageList({ messages, isGroup, loadMore, hasMore, loadingMore, typingUserIds, conversation }: MessageListProps) {
  const { data: session } = useSession()
  const { members } = useActiveList()
  const bottomRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const typingUsers = useMemo(() => {
    if (!typingUserIds || typingUserIds.size === 0 || !conversation?.users) return []
    const currentUserId = session?.user?.id
    const others = new Set(typingUserIds)
    if (currentUserId) others.delete(currentUserId)
    if (others.size === 0) return []
    return conversation.users.filter((u) => others.has(u.id))
  }, [typingUserIds, conversation?.users, session?.user?.id])

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150
  }, [])

  useEffect(() => {
    if (!loadMore || !hasMore || !topRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { threshold: 0.1 }
    )
    observer.observe(topRef.current)
    return () => observer.disconnect()
  }, [loadMore, hasMore])

  useEffect(() => {
    if (isNearBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isNearBottom])

  const formatDateHeader = useCallback((date: Date) => {
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "EEEE, MMMM d")
  }, [])

  const seenByText = useMemo(() => {
    const currentUserId = session?.user?.id
    return (message: FullMessageType) => {
      if (!currentUserId) return ""
      const others = message.seenBy
        .filter((s) => s.user.id !== currentUserId)
        .map((s) => s.user.name || "Unknown")
      if (others.length === 0) return ""
      if (others.length === 1) return `Seen by ${others[0]}`
      if (others.length === 2) return `Seen by ${others[0]} and ${others[1]}`
      return `Seen by ${others[0]}, ${others[1]}, and ${others.length - 2} others`
    }
  }, [session?.user?.id])

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: FullMessageType[] }[] = []
    for (const msg of messages) {
      const dateKey = format(new Date(msg.createdAt), "yyyy-MM-dd")
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.date === dateKey) {
        lastGroup.messages.push(msg)
      } else {
        groups.push({ date: dateKey, messages: [msg] })
      }
    }
    return groups
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-transparent px-4">
        <svg className="h-14 w-14 text-gray-200 dark:text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-sm font-medium">No messages yet</p>
        <p className="text-xs mt-1">Type a message below to get started</p>
      </div>
    )
  }

  return (
      <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-transparent px-4 py-6 space-y-4 min-h-0"
          role="log"
          aria-live="polite"
          aria-label="Message history"
        >
      <div ref={topRef} />
      {loadingMore && (
        <div className="flex justify-center py-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
      {groupedMessages.map((group) => {
        const groupDate = new Date(group.messages[0].createdAt)
        return (
          <div key={group.date}>
            <div className="flex justify-center mb-4">
              <span className="px-3 py-1 rounded-full bg-gray-200/80 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                {formatDateHeader(groupDate)}
              </span>
            </div>
            {group.messages.map((message, index) => {
              const isOwn = message.sender.id === session?.user?.id
              const seenText = seenByText(message)
              const animClass = isOwn ? "motion-safe:animate-slideInRight" : "motion-safe:animate-slideInLeft"
              const isLatest = index === group.messages.length - 1
              const isOnline = members.includes(message.sender.id)

              return (
                <div
                  key={message.id}
                  className={clsx("flex gap-2 mb-1", isOwn && "justify-end", animClass)}
                  style={{ animationDelay: isLatest ? "0ms" : `${Math.min(index * 30, 150)}ms` }}
                  aria-label={`Message from ${message.sender.name || "Unknown"}`}
                >
                  {!isOwn && (
                    <div className="flex-shrink-0 mt-1 self-end">
                      <Avatar user={message.sender} size="sm" />
                    </div>
                  )}
                  <div
                    className={clsx(
                      "flex flex-col max-w-xs lg:max-w-sm",
                      isOwn ? "items-end" : "items-start"
                    )}
                  >
                    {isGroup && !isOwn && (
                      <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {message.sender.name || "Unknown"}
                        </span>
                        {isOnline && (
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" title="Online" />
                        )}
                      </div>
                    )}
                    {message.image && (
                      <div className={clsx(isOwn ? "items-end" : "items-start", "flex flex-col")}>
                        <div className="relative min-w-[200px] min-h-[200px]">
                          <Image
                            src={message.image}
                            alt={`Image shared by ${message.sender.name || "Unknown"}`}
                            fill
                            className="rounded-xl object-cover shadow-sm"
                            sizes="240px"
                          />
                        </div>
                        {message.body && (
                          <div
                            className={clsx(
                              "rounded-[22px] px-4 py-2 text-sm mt-1",
                              isOwn
                                ? "bg-blue-500 text-white rounded-br-sm"
                                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm"
                            )}
                          >
                            {message.body}
                          </div>
                        )}
                      </div>
                    )}
                    {!message.image && message.body && (
                      <div
                        className={clsx(
                          "rounded-[22px] px-4 py-2 text-sm",
                          isOwn
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm"
                        )}
                      >
                        {message.body}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1 min-h-4">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {format(new Date(message.createdAt), "p")}
                      </p>
                      {isOwn && (message as any)._status === "sending" && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">Sending...</span>
                      )}
                      {isOwn && !(message as any)._status && seenText && (
                          <span className="text-[10px] text-blue-500 font-medium" title={seenText}>
                          ✓✓
                        </span>
                      )}
                      {isOwn && !(message as any)._status && !seenText && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
      <div ref={bottomRef} />
      <TypingIndicator typingUsers={typingUsers} isGroup={isGroup} />
    </div>
  )
})

export default MessageList
