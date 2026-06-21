"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import toast from "react-hot-toast"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import useLogoutModal from "@/hooks/useLogoutModal"
import { HiXMark, HiArrowRightOnRectangle } from "react-icons/hi2"

export default function LogoutModal() {
  const { isOpen, onClose } = useLogoutModal()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ redirect: true, callbackUrl: "/" })
    } catch {
      toast.error("Failed to sign out")
      setIsLoading(false)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId="logout-title">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h2 id="logout-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sign out</h2>
      </div>
      <div className="px-6 py-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to sign out?
        </p>
      </div>
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={isLoading} className="min-h-[44px] min-w-[44px]" aria-label="Cancel">
          <HiXMark className="h-5 w-5" />
        </Button>
        <Button
          variant="destructive"
          onClick={handleSignOut}
          isLoading={isLoading}
          className="min-h-[44px] min-w-[44px]"
          aria-label="Sign out"
        >
          <HiArrowRightOnRectangle className="h-5 w-5" />
        </Button>
      </div>
    </Modal>
  )
}
