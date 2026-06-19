"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import useGroupDrawer from "@/hooks/useGroupDrawer"
import Avatar from "@/components/ui/Avatar"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { HiPencil, HiCheck, HiXMark, HiPlusCircle } from "react-icons/hi2"
import { SafeUser } from "@/types"

export default function GroupDrawer() {
  const { isOpen, onClose, conversation, updateConversation } = useGroupDrawer()
  const [editName, setEditName] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<SafeUser[]>([])
  const [availableLoading, setAvailableLoading] = useState(false)
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null)

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
    const currentConv = useGroupDrawer.getState().conversation || conversation

    if (trimmedName === currentConv.name) {
      setIsEditing(false)
      setEditName("")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/conversations/${currentConv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      })
      if (!res.ok) throw new Error("Failed to rename")
      updateConversation({ ...currentConv, name: trimmedName })
      toast.success("Group renamed")
      setIsEditing(false)
    } catch (error) {
      console.error("Rename error:", error)
      toast.error("Failed to rename group")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!showAddMember || !conversation) return
    setAvailableLoading(true)
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load users")
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const memberIds = new Set(conversation.users.map((u) => u.id))
          setAvailableUsers(data.filter((u: SafeUser) => !memberIds.has(u.id)))
        }
      })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setAvailableLoading(false))
  }, [showAddMember, conversation])

  const handleAddMember = async (userId: string) => {
    if (!conversation) return
    setAddingMemberId(userId)
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error("Failed to add member")
      const addedUser = availableUsers.find((u) => u.id === userId)
      if (addedUser) {
        updateConversation({
          ...conversation,
          users: [...conversation.users, addedUser],
        })
        setAvailableUsers((prev) => prev.filter((u) => u.id !== userId))
      }
      toast.success("Member added")
    } catch {
      toast.error("Failed to add member")
    } finally {
      setAddingMemberId(null)
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    const currentConversation = useGroupDrawer.getState().conversation
    if (!currentConversation) return
    const prevConversation = currentConversation
    updateConversation({
      ...currentConversation,
      users: currentConversation.users.filter((u) => u.id !== userId),
    })
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/conversations/${currentConversation.id}/members`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      )
      if (!res.ok) throw new Error()
      toast.success(`${userName} removed`)
    } catch {
      updateConversation(prevConversation)
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

          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
          >
            <HiPlusCircle className="h-4 w-4" />
            Add people
          </button>

          {showAddMember && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              {availableLoading ? (
                <div className="text-sm text-gray-400 dark:text-gray-500 py-2">
                  Loading...
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-sm text-gray-400 dark:text-gray-500 py-2">
                  No more users to add
                </div>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar user={user} size="sm" />
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {user.name || user.email || "Unknown"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddMember(user.id)}
                        disabled={addingMemberId === user.id}
                        className="flex items-center justify-center h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50"
                        aria-label={`Add ${user.name || "user"}`}
                      >
                        {addingMemberId === user.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        ) : (
                          <HiPlusCircle className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
