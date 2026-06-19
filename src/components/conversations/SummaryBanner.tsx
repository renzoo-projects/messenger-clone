"use client"

import { HiXMark, HiOutlineSparkles, HiArrowPath } from "react-icons/hi2"
import { hapticLight } from "@/lib/haptic"

interface SummaryBannerProps {
  summary: string | null
  messageCount: number
  loading: boolean
  error: string | null
  onClose: () => void
  onRetry: () => void
}

const SummaryBanner: React.FC<SummaryBannerProps> = ({
  summary,
  messageCount,
  loading,
  error,
  onClose,
  onRetry,
}) => {
  const handleClose = () => {
    hapticLight()
    onClose()
  }

  if (loading) {
    return (
      <div className="mx-3 mb-3 animate-slideDown rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm dark:border-sky-800 dark:bg-sky-950/30">
        <div className="flex items-center gap-2 mb-3">
          <HiOutlineSparkles className="h-4 w-4 text-sky-500 animate-pulse" />
          <span className="text-sm font-medium text-sky-600 dark:text-sky-400">
            Generating summary&hellip;
          </span>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-sky-200 dark:bg-sky-800" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-sky-200 dark:bg-sky-800" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-sky-200 dark:bg-sky-800" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-3 mb-3 animate-slideDown rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-800 dark:bg-red-950/30">
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-900/50 dark:hover:text-gray-300"
          aria-label="Dismiss"
        >
          <HiXMark className="h-4 w-4" />
        </button>

        <div className="mb-2 text-sm font-semibold text-red-700 dark:text-red-300">
          Couldn&apos;t generate summary
        </div>

        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          The AI service timed out. Try again.
        </p>

        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 active:scale-[0.97]"
        >
          <HiArrowPath className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="group relative mx-3 mb-3 animate-slideDown rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm dark:border-sky-800 dark:bg-sky-950/30">
      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-sky-400 dark:bg-sky-500" />

      <button
        onClick={handleClose}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-sky-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-sky-500 dark:hover:bg-sky-900/50 dark:hover:text-gray-300"
        aria-label="Dismiss summary"
      >
        <HiXMark className="h-4 w-4" />
      </button>

      <div className="mb-2 flex items-center gap-1.5 pl-3">
        <HiOutlineSparkles className="h-4 w-4 text-sky-500" />
        <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">
          AI summary &middot; {messageCount} {messageCount === 1 ? "message" : "messages"}
        </span>
      </div>

      <p className="pl-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {summary}
      </p>
    </div>
  )
}

export default SummaryBanner
