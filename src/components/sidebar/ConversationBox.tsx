"use client"

import { useCallback, useMemo, useRef, useState, useEffect, memo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import clsx from "clsx"
import Avatar from "@/components/ui/Avatar"
import { FullConversationType } from "@/types"
import { format } from "date-fns"
import { HiEllipsisHorizontal, HiOutlineEnvelope, HiOutlineEnvelopeOpen, HiTrash } from "react-icons/hi2"
import toast from "react-hot-toast"
import { hapticLight } from "@/lib/haptic"

interface ConversationBoxProps {
  conversation: FullConversationType
  selected: boolean
}

const SWIPE_THRESHOLD = 80

function conversationBoxAreEqual(prev: ConversationBoxProps, next: ConversationBoxProps) {
  const prevLastMsg = prev.conversation.messages?.[prev.conversation.messages.length - 1]
  const nextLastMsg = next.conversation.messages?.[next.conversation.messages.length - 1]
  return prev.conversation.id === next.conversation.id &&
    prev.conversation.unreadCount === next.conversation.unreadCount &&
    prev.conversation.updatedAt === next.conversation.updatedAt &&
    prev.selected === next.selected &&
    (prevLastMsg?.id === nextLastMsg?.id || (!prevLastMsg && !nextLastMsg))
}

const ConversationBox = memo(function ConversationBox({
  conversation,
  selected,
}: ConversationBoxProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [showMenu, setShowMenu] = useState(false)
  const [swiped, setSwiped] = useState(false)
  const touchRef = useRef({ startX: 0, currentX: 0, swiping: false })
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const rowRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [showMenu])

  const otherUser = useMemo(() => {
    const currentUserId = session?.user?.id
    return conversation.users?.find((u) => u.id !== currentUserId)
  }, [session?.user?.id, conversation.users])

  const lastMessage = useMemo(() => {
    const messages = conversation.messages || []
    return messages[messages.length - 1]
  }, [conversation.messages])

  const lastMessageText = useMemo(() => {
    const isOwn = lastMessage?.sender?.id === session?.user?.id
    if (lastMessage?.image) return isOwn ? "You sent an image" : "Sent an image"
    if (lastMessage?.body) return isOwn ? `You: ${lastMessage.body}` : lastMessage.body
    return "Started a conversation"
  }, [lastMessage, session?.user?.id])

  const unreadCount = conversation.unreadCount || 0

  const handleClick = useCallback(() => {
    if (swiped) return
    router.push(`/conversations/${conversation.id}`)
  }, [router, conversation.id, swiped])

  const handleMouseEnter = useCallback(() => {
    router.prefetch(`/conversations/${conversation.id}`)
  }, [router, conversation.id])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClick()
    }
  }, [handleClick])

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      router.push("/conversations")
    } catch {
      toast.error("Failed to delete conversation")
    }
  }, [conversation.id, router])

  const handleMarkRead = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/seen`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to mark read")
    } catch {
      toast.error("Failed to mark as read")
    }
  }, [conversation.id])

  const handleMarkUnread = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/unread`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to mark unread")
    } catch {
      toast.error("Failed to mark as unread")
    }
  }, [conversation.id])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = {
      startX: e.touches[0].clientX,
      currentX: e.touches[0].clientX,
      swiping: false,
    }
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    longPressTimer.current = setTimeout(() => {
      hapticLight()
      setShowMenu(true)
    }, 500)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const startX = touchRef.current.startX
    const currentX = e.touches[0].clientX
    const delta = startX - currentX

    if (Math.abs(delta) > 10) {
      touchRef.current.swiping = true
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = undefined
      }
    }

    if (delta > 0) {
      const overage = Math.max(0, delta - SWIPE_THRESHOLD)
      const rubberBand = SWIPE_THRESHOLD + Math.sqrt(overage * 4)
      touchRef.current.currentX = currentX
      if (rowRef.current) {
        rowRef.current.style.transform = `translateX(-${Math.min(delta, rubberBand)}px)`
        rowRef.current.style.transition = "none"
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = undefined
    }
    const delta = touchRef.current.startX - touchRef.current.currentX
    if (delta > SWIPE_THRESHOLD) {
      setSwiped(true)
      if (rowRef.current) {
        rowRef.current.style.transform = `translateX(-${SWIPE_THRESHOLD}px)`
        rowRef.current.style.transition = "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)"
      }
    } else {
      setSwiped(false)
      if (rowRef.current) {
        rowRef.current.style.transform = ""
        rowRef.current.style.transition = "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)"
      }
    }
    touchRef.current.swiping = false
  }, [])

  const handleSwipeDelete = useCallback(async () => {
    try {
      hapticLight()
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      router.push("/conversations")
    } catch {
      toast.error("Failed to delete conversation")
      setSwiped(false)
      if (rowRef.current) {
        rowRef.current.style.transform = ""
      }
    }
  }, [conversation.id, router])

  return (
    <div className="relative group" onMouseLeave={() => setShowMenu(false)}>
      <div className="overflow-hidden">
        <div
          ref={rowRef}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={handleMouseEnter}
          role="button"
          tabIndex={0}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={clsx(
            "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors active:scale-[0.98] touch-pan-y",
            selected && "bg-blue-50 dark:bg-blue-950/20"
          )}
          style={{ transition: swiped ? "none" : undefined }}
        >
          <Avatar user={conversation.isGroup ? undefined : otherUser} users={conversation.isGroup ? conversation.users : undefined} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p
                className={clsx(
                  "text-sm truncate",
                  unreadCount > 0
                    ? "font-semibold text-gray-900 dark:text-gray-100"
                    : "font-medium text-gray-900 dark:text-gray-100"
                )}
              >
                {conversation.name || otherUser?.name || "Unknown User"}
              </p>
              <div className="flex items-center gap-1.5">
                {lastMessage?.createdAt && (
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {format(new Date(lastMessage.createdAt), "p")}
                  </p>
                )}
                {unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
            </div>
            <p
              className={clsx(
                "text-sm truncate",
                unreadCount > 0
                  ? "font-semibold text-gray-900 dark:text-gray-100"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              {lastMessageText}
            </p>
          </div>
        </div>
        <button
          onClick={handleSwipeDelete}
          className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-500 text-white text-sm font-medium"
          style={{ transform: swiped ? "translateX(0)" : "translateX(100%)", transition: "transform 0.2s ease" }}
        >
          <HiTrash className="h-5 w-5" />
        </button>
      </div>
      {!swiped && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3" ref={menuRef}>
          <button
            ref={menuButtonRef}
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu((prev) => !prev)
            }}
            className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-11 w-11 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            aria-label="More options"
            aria-expanded={showMenu}
          >
            <HiEllipsisHorizontal className="h-5 w-5" />
          </button>
          {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                <button
                  onClick={handleMarkRead}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <HiOutlineEnvelopeOpen className="h-4 w-4" />
                  Mark as read
                </button>
                <button
                  onClick={handleMarkUnread}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <HiOutlineEnvelope className="h-4 w-4" />
                  Mark as unread
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <HiTrash className="h-4 w-4" />
                  Delete
                </button>
              </div>
          )}
        </div>
      )}
      </div>
    )
  }, conversationBoxAreEqual)
  
  export default ConversationBox
