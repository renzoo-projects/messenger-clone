"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import useGroupDrawer from "@/hooks/useGroupDrawer"
import Avatar from "@/components/ui/Avatar"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { HiPencil, HiCheck, HiXMark } from "react-icons/hi2"

export default function GroupDrawer() {
  const { isOpen, onClose, conversation, updateConversation } = useGroupDrawer()
  const [editName, setEditName] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const startEditing = () => {
    setEditName(conversation?.name || "")
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditName("")
  }

  const handleRename = async () => {
    if (!editName?.trim() || !conversation) {
      toast.error("Group name cannot be empty")
      return
    }

    const trimmedName = editName.trim()

    if (trimmedName === conversation.name) {
      setIsEditing(false)
      setEditName("")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      })
      if (!res.ok) throw new Error("Failed to rename")
      toast.success("Group renamed")
      setIsEditing(false)
    } catch (error) {
      console.error("Rename error:", error)
      toast.error("Failed to rename group")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!conversation) return
    updateConversation({
      ...conversation,
      users: conversation.users.filter((u) => u.id !== userId),
    })
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/conversations/${conversation.id}/members`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      )
      if (!res.ok) throw new Error()
      toast.success(`${userName} removed`)
    } catch {
      updateConversation(conversation)
      toast.error("Failed to remove member")
    } finally {
      setIsLoading(false)
    }
  }

  if (!conversation) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Group Info</h2>
        <button
          onClick={onClose}
          className="flex items-center justify-center h-11 w-11 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          aria-label="Close group info"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-6 py-4 space-y-4">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <Button
              variant="primary"
              onClick={handleRename}
              disabled={isLoading || !editName.trim()}
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              aria-label="Save"
            >
              <HiCheck className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={cancelEditing}
              disabled={isLoading}
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              aria-label="Cancel"
            >
              <HiXMark className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {conversation.name || "Group"}
            </h3>
            <Button
              variant="text"
              onClick={startEditing}
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              aria-label="Rename group"
            >
              <HiPencil className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Members ({conversation.users?.length || 0})
          </p>
          <div className="space-y-2">
            {(conversation.users || []).map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition motion-safe:animate-slideUp"
                style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
              >
                <div className="flex items-center gap-3">
                  <Avatar user={user} />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.name || "Unknown"}
                  </p>
                </div>
                <Button
                  variant="text"
                  onClick={() => handleRemoveMember(user.id, user.name || "Unknown")}
                  disabled={isLoading}
                  size="sm"
                  className="min-h-[44px] min-w-[44px] text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300"
                  aria-label={`Remove ${user.name || "member"}`}
                >
                  <HiXMark className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
