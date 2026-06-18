"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import useProfileDrawer from "@/hooks/useProfileDrawer"
import Avatar from "@/components/ui/Avatar"
import Modal from "@/components/ui/Modal"

export default function ProfileDrawer() {
  const { isOpen, onClose, user } = useProfileDrawer()

  const joinedDate = useMemo(() => {
    if (!user?.createdAt) return null
    return format(new Date(user?.createdAt), "MMMM yyyy")
  }, [user?.createdAt])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
        <button
          onClick={onClose}
          className="flex items-center justify-center h-11 w-11 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          aria-label="Close profile"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

        <div className="px-6 py-6 flex flex-col items-center gap-4">
          <Avatar user={user} size="lg" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {user?.name || "Unknown"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
        {joinedDate && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Member since {joinedDate}
          </p>
        )}
      </div>
    </Modal>
  )
}
