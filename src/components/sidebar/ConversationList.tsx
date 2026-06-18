"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useConversations } from "@/hooks/useConversations"
import { FullConversationType } from "@/types"
import ConversationBox from "./ConversationBox"
import GroupCreateModal from "@/components/conversations/GroupCreateModal"
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
  const isOnConversationsPage = pathname === "/conversations"

  useEffect(() => {
    conversations.forEach((conv) => {
      router.prefetch(`/conversations/${conv.id}`)
    })
  }, [conversations, router])

  return (
    <div className={`${isOnConversationsPage ? "fixed inset-0 z-30 flex flex-col" : "hidden"} lg:fixed lg:inset-y-0 lg:left-20 lg:z-30 lg:w-80 lg:flex lg:flex-col lg:border-r lg:border-gray-200 dark:lg:border-gray-700 lg:bg-white dark:lg:bg-gray-950 bg-white dark:bg-gray-950`}>
      <GroupCreateModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
      />
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Messages</h2>
        <button
          onClick={() => setShowGroupModal(true)}
          className="flex items-center justify-center h-11 w-11 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-150"
          aria-label="Create group"
        >
          <HiPencilSquare className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
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
