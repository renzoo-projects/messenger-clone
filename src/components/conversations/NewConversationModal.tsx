"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import toast from "react-hot-toast"
import { api } from "@/lib/axios"
import Modal from "@/components/ui/Modal"
import axios from "axios"

const Select = dynamic(() => import("react-select"), { ssr: false })
import Button from "@/components/ui/Button"
import { SafeUser } from "@/types"
import { HiCheck, HiXMark, HiUsers } from "react-icons/hi2"

interface NewConversationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewConversationModal({ isOpen, onClose }: NewConversationModalProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [users, setUsers] = useState<SafeUser[]>([])
  const [selected, setSelected] = useState<{ value: string; label: string }[]>([])
  const [groupMode, setGroupMode] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoadingUsers(true)
    const abortController = new AbortController()

    api.get("/api/users", { signal: abortController.signal })
      .then(({ data }) => {
        if (Array.isArray(data)) setUsers(data)
      })
      .catch((err) => {
        if (axios.isCancel(err)) return
        toast.error("Failed to load users")
      })
      .finally(() => setLoadingUsers(false))
    return () => abortController.abort()
  }, [isOpen])

  const usersLoading = loadingUsers

  const options = users
    .filter((user) => user.id !== session?.user?.id)
    .map((user) => ({
      value: user.id,
      label: user.name || user.email || "Unknown",
    }))

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one person")
      return
    }

    if (groupMode && !groupName.trim()) {
      toast.error("Group needs a name")
      return
    }

    if (groupMode && selected.length < 2) {
      toast.error("Group needs at least 2 members")
      return
    }

    setIsLoading(true)
    try {
      const body = groupMode
        ? { isGroup: true, name: groupName.trim(), members: selected.map((s) => s.value) }
        : { userId: selected[0].value }

      const { data: conversation } = await api.post("/api/conversations", body)

      router.push(`/conversations/${conversation.id}`)
      onClose()
    } catch {
      toast.error(groupMode ? "Failed to create group" : "Failed to start conversation")
    } finally {
      setIsLoading(false)
    }
  }

  const title = groupMode ? "Create Group" : "New Message"

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId="new-conversation-title">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 id="new-conversation-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>

      <div className="px-6 py-4 space-y-4">
        {groupMode && (
          <div>
            <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name
            </label>
            <input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        )}

        <div>
          <label id="recipients-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            To:
          </label>
          {!isOpen ? null : usersLoading ? (
            <div className="flex justify-center py-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-sm text-gray-400 dark:text-gray-500 py-2">
              No other users found
            </div>
          ) : (
            <Select
              isMulti
              options={options}
              value={selected}
              onChange={(newValue) => setSelected(newValue as typeof selected)}
              placeholder="Search people..."
              isDisabled={isLoading}
              className="text-sm"
              classNamePrefix="react-select"
              aria-labelledby="recipients-label"
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: "var(--select-bg, #fff)",
                  borderColor: state.isFocused
                    ? "rgb(59, 130, 246)"
                    : "var(--select-border, #d1d5db)",
                  borderWidth: "1px",
                  boxShadow: state.isFocused
                    ? "0 0 0 3px rgba(59, 130, 246, 0.1)"
                    : "none",
                  minHeight: "40px",
                  transition: "all 0.2s",
                  ":hover": {
                    borderColor: "rgb(59, 130, 246)",
                  },
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "var(--select-bg, #fff)",
                  borderColor: "var(--select-border, #d1d5db)",
                  borderWidth: "1px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  marginTop: "4px",
                  zIndex: 50,
                }),
                menuList: (base) => ({
                  ...base,
                  padding: "4px 0",
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? "rgb(59, 130, 246)"
                    : state.isFocused
                      ? "var(--select-hover, #f3f4f6)"
                      : "var(--select-bg, #fff)",
                  color: state.isSelected ? "#fff" : "var(--select-text, #111827)",
                  cursor: "pointer",
                  padding: "8px 12px",
                  transition: "background-color 0.15s",
                  ":active": {
                    backgroundColor: "rgb(59, 130, 246)",
                  },
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "var(--select-chip-bg, #e5e7eb)",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  display: "flex",
                  alignItems: "center",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "var(--select-text, #111827)",
                  padding: "2px 6px",
                  fontSize: "13px",
                  fontWeight: "500",
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: "var(--select-text, #111827)",
                  ":hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                    color: "var(--select-text, #111827)",
                  },
                }),
                input: (base) => ({
                  ...base,
                  color: "var(--select-text, #111827)",
                  margin: "2px",
                }),
                placeholder: (base) => ({
                  ...base,
                  color: "var(--select-placeholder, #9ca3af)",
                  fontSize: "14px",
                }),
                singleValue: (base) => ({
                  ...base,
                  color: "var(--select-text, #111827)",
                }),
                indicatorSeparator: (base) => ({
                  ...base,
                  backgroundColor: "var(--select-border, #d1d5db)",
                }),
                dropdownIndicator: (base, state) => ({
                  ...base,
                  color: state.isFocused
                    ? "rgb(59, 130, 246)"
                    : "var(--select-placeholder, #9ca3af)",
                  transition: "color 0.2s",
                  ":hover": {
                    color: "rgb(59, 130, 246)",
                  },
                }),
                clearIndicator: (base) => ({
                  ...base,
                  color: "var(--select-placeholder, #9ca3af)",
                  ":hover": {
                    color: "rgb(59, 130, 246)",
                  },
                }),
              }}
            />
          )}
        </div>

        {!groupMode && selected.length > 0 && (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setGroupMode(true)}
              disabled={isLoading}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              <HiUsers className="h-4 w-4" />
              Create group
            </button>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
          className="min-h-[44px] min-w-[44px]"
          aria-label="Cancel"
        >
          <HiXMark className="h-5 w-5" />
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isLoading || selected.length === 0 || (groupMode && (!groupName.trim() || selected.length < 2))}
          isLoading={isLoading}
          className="min-h-[44px] min-w-[44px]"
          aria-label={groupMode ? "Create group" : "Start conversation"}
        >
          <HiCheck className="h-5 w-5" />
        </Button>
      </div>
    </Modal>
  )
}
