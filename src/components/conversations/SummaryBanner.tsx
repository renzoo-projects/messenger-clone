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

function LoadingSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-lg shadow-sky-100/30 dark:border-sky-900/30 dark:bg-gray-800/80 dark:shadow-black/20">
      <div className="absolute top-0 left-4 right-4 h-1 rounded-b-full bg-gradient-to-r from-sky-400 to-blue-500" />
      <div className="p-5 pt-6">
        <div className="mb-3 inline-flex h-7 w-28 animate-pulse rounded-full bg-sky-100 dark:bg-sky-900/50" />
        <div className="space-y-2.5">
          <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  )
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
      <div className="absolute left-3 right-3 top-3 z-10 animate-slideDown">
        <LoadingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="absolute left-3 right-3 top-3 z-10 animate-slideDown">
        <div className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-lg shadow-amber-100/30 dark:border-amber-900/30 dark:bg-amber-950/20 dark:shadow-black/20">
          <div className="absolute top-0 left-4 right-4 h-1 rounded-b-full bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="p-5 pt-6">
            <button
              onClick={handleClose}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-amber-400 opacity-0 transition-opacity hover:bg-amber-100 hover:text-amber-600 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-amber-500 group-hover:opacity-100 dark:hover:bg-amber-900/50 dark:hover:text-amber-300"
              aria-label="Dismiss"
            >
              <HiXMark className="h-4 w-4" />
            </button>

            <div className="mb-1 text-sm font-semibold text-amber-800 dark:text-amber-200">
              Couldn&apos;t generate summary
            </div>

            <p className="mb-4 text-sm text-amber-600/80 dark:text-amber-400/70">
              The AI service timed out. Try again.
            </p>

            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.97]"
            >
              <HiArrowPath className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="absolute left-3 right-3 top-3 z-10 animate-slideDown">
      <div className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-lg shadow-sky-100/30 dark:border-sky-900/30 dark:bg-gray-800/80 dark:shadow-black/20">
        <div className="absolute top-0 left-4 right-4 h-1 rounded-b-full bg-gradient-to-r from-sky-400 to-blue-500" />

        <button
          onClick={handleClose}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-gray-300 opacity-0 transition-opacity hover:bg-sky-50 hover:text-gray-500 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-sky-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-sky-900/30 dark:hover:text-gray-400"
          aria-label="Dismiss summary"
        >
          <HiXMark className="h-4 w-4" />
        </button>

        <div className="p-5 pt-6">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
              <HiOutlineSparkles className="h-3.5 w-3.5" />
              AI summary
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {messageCount} {messageCount === 1 ? "message" : "messages"}
            </span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {summary}
          </p>
        </div>
      </div>
    </div>
  )
}

export default SummaryBanner
