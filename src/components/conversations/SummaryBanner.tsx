"use client"

import { HiXMark } from "react-icons/hi2"
import { hapticLight } from "@/lib/haptic"

interface SummaryBannerProps {
  summary: string | null
  messageCount: number
  loading: boolean
  onClose: () => void
}

const SummaryBanner: React.FC<SummaryBannerProps> = ({
  summary,
  messageCount,
  loading,
  onClose,
}) => {
  const handleClose = () => {
    hapticLight()
    onClose()
  }

  if (loading) {
    return (
      <div className="mx-3 mb-3 animate-slideDown rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950/30">
        <div className="mb-3 h-4 w-32 animate-pulse rounded bg-sky-200 dark:bg-sky-800" />
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-sky-100 dark:bg-sky-900/50" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-sky-100 dark:bg-sky-900/50" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-sky-100 dark:bg-sky-900/50" />
        </div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="group relative mx-3 mb-3 animate-slideDown rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950/30">
      <button
        onClick={handleClose}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-sky-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-sky-500 dark:hover:bg-sky-900/50 dark:hover:text-gray-300"
        aria-label="Dismiss summary"
      >
        <HiXMark className="h-4 w-4" />
      </button>

      <div className="mb-2 text-sm font-semibold text-sky-700 dark:text-sky-300">
        {messageCount} new {messageCount === 1 ? "message" : "messages"}
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {summary}
      </p>
    </div>
  )
}

export default SummaryBanner
