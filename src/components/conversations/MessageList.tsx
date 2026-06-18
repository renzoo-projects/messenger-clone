"use client"

import { useRef, useEffect, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import clsx from "clsx"
import { FullMessageType } from "@/types"
import { format } from "date-fns"
import Avatar from "@/components/ui/Avatar"
import useActiveList from "@/hooks/useActiveList"

interface MessageListProps {
  messages: FullMessageType[]
  isGroup?: boolean
  loadMore?: () => void
  hasMore?: boolean
  loadingMore?: boolean
}

export default function MessageList({ messages, isGroup, loadMore, hasMore, loadingMore }: MessageListProps) {
  const { data: session } = useSession()
  const { members } = useActiveList()
  const bottomRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-800">
        No messages yet. Start the conversation!
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 px-4 py-6 space-y-4 min-h-0"
      role="log"
      aria-live="polite"
      aria-label="Message history"
    >
      <div ref={topRef} />
      {loadingMore && (
        <div className="flex justify-center py-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </div>
      )}
      {messages.map((message, index) => {
        const isOwn = message.sender.id === session?.user?.id
        const seenText = seenByText(message)
        const animClass = isOwn ? "motion-safe:animate-slideInRight" : "motion-safe:animate-slideInLeft"
        const isLatest = index === messages.length - 1
        const isOnline = members.includes(message.sender.id)

        return (
          <div
            key={message.id}
            className={clsx("flex gap-2", isOwn && "justify-end", animClass)}
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
                "flex flex-col max-w-xs",
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
                  <Image
                    src={message.image}
                    alt={`Image shared by ${message.sender.name || "Unknown"}`}
                    width={0}
                    height={0}
                    className="rounded-xl max-w-60 w-full h-auto shadow-sm"
                    sizes="240px"
                  />
                  {message.body && (
                    <div
                      className={clsx(
                        "rounded-2xl px-4 py-2 text-sm mt-1",
                        isOwn
                          ? "bg-sky-500 text-white rounded-br-sm"
                          : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm"
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
                    "rounded-2xl px-4 py-2 text-sm",
                    isOwn
                      ? "bg-sky-500 text-white rounded-br-sm"
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm"
                  )}
                >
                  {message.body}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {format(new Date(message.createdAt), "p")}
                </p>
                {isOwn && seenText && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-32">
                    {seenText}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
