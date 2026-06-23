"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import useSettingsModal from "@/hooks/useSettingsModal"
import { useFontSize, FontSize } from "@/hooks/useFontSize"
import { api } from "@/lib/axios"
import Avatar from "@/components/ui/Avatar"
import { HiCamera, HiCheck, HiXMark } from "react-icons/hi2"

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
]

export default function SettingsModal() {
  const settingsModal = useSettingsModal()
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [image, setImage] = useState<string | undefined>(session?.user?.image || undefined)
  const fontSize = useFontSize((s) => s.fontSize)
  const setFontSize = useFontSize((s) => s.setFontSize)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string }>({
    defaultValues: { name: session?.user?.name || "" },
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      if (data.url) {
        setImage(data.url)
      } else {
        toast.error("Upload failed - Cloudinary may not be configured")
      }
    } catch {
      toast.error("Upload failed")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: { name: string }) => {
    setIsLoading(true)
    try {
      await api.patch("/api/settings", { name: data.name, image })

      await update()
      toast.success("Settings updated")
      settingsModal.onClose()
    } catch {
      toast.error("Failed to update settings")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={settingsModal.isOpen} onClose={settingsModal.onClose} titleId="settings-title">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 id="settings-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar user={{ name: session?.user?.name, image }} />
              {isLoading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          <label className="flex items-center justify-center h-11 w-11 cursor-pointer text-blue-600 hover:text-blue-500 transition-colors duration-150" aria-label="Change avatar">
            <HiCamera className="h-5 w-5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={isLoading}
            />
          </label>
        </div>

        <div>
          <label htmlFor="settings-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              id="settings-name"
              {...register("name", { required: true })}
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">Name is required</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text Size
            </label>
            <div className="flex gap-2">
              {FONT_SIZES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFontSize(value)}
                  disabled={isLoading}
                  className={`flex-1 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    fontSize === value
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={settingsModal.onClose}
            disabled={isLoading}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Cancel"
          >
            <HiXMark className="h-5 w-5" />
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="min-h-[44px] min-w-[44px]" aria-label="Save">
            <HiCheck className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </Modal>
  )
}
