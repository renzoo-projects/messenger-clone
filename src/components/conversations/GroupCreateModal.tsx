"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import toast from "react-hot-toast"
import Modal from "@/components/ui/Modal"

const Select = dynamic(() => import("react-select"), { ssr: false })
import Button from "@/components/ui/Button"
import { SafeUser } from "@/types"
import { HiCheck, HiXMark } from "react-icons/hi2"

interface GroupCreateModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GroupCreateModal({ isOpen, onClose }: GroupCreateModalProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [users, setUsers] = useState<SafeUser[]>([])
  const [selected, setSelected] = useState<{ value: string; label: string }[]>([])
  const [groupName, setGroupName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load users")
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setUsers(data)
      })
      .catch(() => toast.error("Failed to load users"))
  }, [isOpen])

  const usersLoading = isOpen && users.length === 0

  const options = users
    .filter((user) => user.id !== session?.user?.id)
    .map((user) => ({
      value: user.id,
      label: user.name || user.email || "Unknown",
    }))

  const handleCreate = async () => {
    if (!groupName.trim() || selected.length < 2) {
      toast.error("Group needs a name and at least 2 members")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isGroup: true,
          name: groupName.trim(),
          members: selected.map((s) => s.value),
        }),
      })

      if (!res.ok) throw new Error("Failed to create group")

      const conversation = await res.json()
      router.push(`/conversations/${conversation.id}`)
      onClose()
    } catch {
      toast.error("Failed to create group")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="sheet">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Group</h2>
      </div>

      <div className="px-6 py-4 space-y-4">
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
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label id="add-members-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Add Members
          </label>
          {usersLoading ? (
            <div className="text-sm text-gray-400 dark:text-gray-500 py-2">
              Loading users...
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
              placeholder="Select people..."
              isDisabled={isLoading}
              className="text-sm"
              classNamePrefix="react-select"
              aria-labelledby="add-members-label"
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: "var(--select-bg, #fff)",
                  borderColor: state.isFocused
                    ? "rgb(14, 165, 233)"
                    : "var(--select-border, #d1d5db)",
                  borderWidth: "1px",
                  boxShadow: state.isFocused
                    ? "0 0 0 3px rgba(14, 165, 233, 0.1)"
                    : "none",
                  minHeight: "40px",
                  transition: "all 0.2s",
                  ":hover": {
                    borderColor: "rgb(14, 165, 233)",
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
                    ? "rgb(14, 165, 233)"
                    : state.isFocused
                      ? "var(--select-hover, #f3f4f6)"
                      : "var(--select-bg, #fff)",
                  color: state.isSelected ? "#fff" : "var(--select-text, #111827)",
                  cursor: "pointer",
                  padding: "8px 12px",
                  transition: "background-color 0.15s",
                  ":active": {
                    backgroundColor: "rgb(14, 165, 233)",
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
                    ? "rgb(14, 165, 233)"
                    : "var(--select-placeholder, #9ca3af)",
                  transition: "color 0.2s",
                  ":hover": {
                    color: "rgb(14, 165, 233)",
                  },
                }),
                clearIndicator: (base) => ({
                  ...base,
                  color: "var(--select-placeholder, #9ca3af)",
                  ":hover": {
                    color: "rgb(14, 165, 233)",
                  },
                }),
              }}
            />
          )}
        </div>
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
          onClick={handleCreate}
          disabled={isLoading || selected.length < 2 || !groupName.trim()}
          isLoading={isLoading}
          className="min-h-[44px] min-w-[44px]"
          aria-label="Create group"
        >
          <HiCheck className="h-5 w-5" />
        </Button>
      </div>
    </Modal>
  )
}
