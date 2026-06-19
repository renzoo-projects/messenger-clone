"use client"

import { useMemo, memo } from "react"
import { useSession } from "next-auth/react"
import Avatar from "@/components/ui/Avatar"
import useProfileDrawer from "@/hooks/useProfileDrawer"
import useGroupDrawer from "@/hooks/useGroupDrawer"
import useActiveList from "@/hooks/useActiveList"
import { FullConversationType } from "@/types"
import { HiInformationCircle, HiOutlineSparkles } from "react-icons/hi2"

interface ConversationHeaderProps {
  conversation: FullConversationType
  onSummarize?: () => void
  summarizing?: boolean
  typingUserIds?: Set<string>
}

const ConversationHeader = memo(function ConversationHeader({
  conversation,
  onSummarize,
  summarizing,
  typingUserIds,
}: ConversationHeaderProps) {
  const { data: session } = useSession()
  const profileDrawer = useProfileDrawer()
  const groupDrawer = useGroupDrawer()
  const { members } = useActiveList()

  const otherUser = useMemo(() => {
    if (!conversation?.users || conversation.users.length === 0) return undefined
    const currentUserId = session?.user?.id
    return conversation.users.find((u) => u.id !== currentUserId)
  }, [session?.user?.id, conversation?.users])

  const statusText = useMemo(() => {
    if (typingUserIds && typingUserIds.size > 0) {
      const typingNames: string[] = []
      for (const uid of typingUserIds) {
        const user = conversation.users?.find((u) => u.id === uid)
        if (user) typingNames.push(user.name || "Someone")
      }
      if (typingNames.length === 1) return `${typingNames[0]} is typing...`
      if (typingNames.length > 1) return `${typingNames[0]} and ${typingNames.length - 1} other${typingNames.length > 2 ? "s" : ""} typing...`
      return "Someone is typing..."
    }
    if (conversation.isGroup) {
      return `${conversation.users?.length || 0} members`
    }
    if (otherUser && members.includes(otherUser.id)) {
      return "Active now"
    }
    return "Offline"
  }, [conversation, otherUser, members, typingUserIds])

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/70 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <div
          className="cursor-pointer"
          onClick={() => {
            if (conversation.isGroup) {
              groupDrawer.onOpen(conversation)
            } else if (otherUser) {
              profileDrawer.onOpen(otherUser)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              if (conversation.isGroup) {
                groupDrawer.onOpen(conversation)
              } else if (otherUser) {
                profileDrawer.onOpen(otherUser)
              }
            }
          }}
          role="button"
          tabIndex={0}
        >
          <Avatar user={conversation.isGroup ? undefined : otherUser} users={conversation.isGroup ? conversation.users : undefined} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {conversation.name || otherUser?.name || "Unknown"}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300">{statusText}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onSummarize && (
          <button
            onClick={onSummarize}
            disabled={summarizing}
            title="Summarize conversation"
            className="flex items-center justify-center h-11 w-11 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Summarize conversation"
          >
            <HiOutlineSparkles className={`h-5 w-5 ${summarizing ? "animate-spin" : ""}`} />
          </button>
        )}
        {conversation.isGroup && (
          <button
            onClick={() => groupDrawer.onOpen(conversation)}
            className="flex items-center justify-center h-11 w-11 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-150"
            aria-label="Group info"
          >
            <HiInformationCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
})

export default ConversationHeader
