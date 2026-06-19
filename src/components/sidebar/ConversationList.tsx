"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useConversations } from "@/hooks/useConversations"
import { FullConversationType } from "@/types"
import ConversationBox from "./ConversationBox"
import NewConversationModal from "@/components/conversations/NewConversationModal"
import Skeleton from "@/components/ui/Skeleton"
import { HiPencilSquare } from "react-icons/hi2"

export default function ConversationList({
  initialConversations,
}: {
  initialConversations?: FullConversationType[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { conversations, isLoading } = useConversations(initialConversations)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const isOnConversationsPage = pathname === "/conversations"
  const prefetchedRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)

  useEffect(() => {
    if (prefetchedRef.current) return
    if (conversations.length === 0) return
    prefetchedRef.current = true
    conversations.forEach((conv) => {
      router.prefetch(`/conversations/${conv.id}`)
    })
  }, [conversations, router])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta <= 0) {
      setPullDistance(0)
      return
    }
    setPullDistance(Math.min(delta * 0.5, 120))
  }

  const handleTouchEnd = () => {
    if (!isPulling.current) return
    isPulling.current = false
    if (pullDistance >= 80) {
      setRefreshing(true)
      setPullDistance(0)
      setTimeout(() => {
        setRefreshing(false)
        router.refresh()
      }, 800)
    } else {
      setPullDistance(0)
    }
  }

  return (
    <div className={`${isOnConversationsPage ? "fixed inset-0 z-30 flex flex-col" : "hidden"} lg:fixed lg:inset-y-0 lg:left-20 lg:z-30 lg:w-80 lg:flex lg:flex-col lg:border-r lg:border-gray-200 dark:lg:border-gray-700 lg:bg-white dark:lg:bg-gray-950 bg-white dark:bg-gray-950`}>
      <NewConversationModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
      />
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Messages</h2>
        <button
          onClick={() => setShowGroupModal(true)}
          className="flex items-center justify-center h-11 w-11 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-150"
          aria-label="New conversation"
        >
          <HiPencilSquare className="h-5 w-5" />
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto lg:pb-0 [padding-bottom:max(4rem,env(safe-area-inset-bottom))]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {refreshing && (
          <div className="flex justify-center py-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          </div>
        )}
        {pullDistance > 0 && (
          <div
            className="flex justify-center py-2 transition-transform"
            style={{ transform: `translateY(${pullDistance}px)` }}
          >
            <div
              className="h-5 w-5 rounded-full border-2 border-gray-400 dark:border-gray-500 transition-transform"
              style={{ transform: `rotate(${pullDistance * 3}deg)` }}
            />
          </div>
        )}
        {isLoading ? (
          <div className="space-y-2 px-5 py-4" aria-label="Loading conversations">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400 text-sm">
              No conversations yet
          </div>
        ) : (
          <div className="motion-safe:animate-fadeIn">
            {conversations.map((conversation, index) => (
              <div
                key={conversation.id}
                className=""
              >
                <ConversationBox
                  conversation={conversation}
                  selected={pathname === `/conversations/${conversation.id}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
