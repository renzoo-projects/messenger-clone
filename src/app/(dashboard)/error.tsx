"use client"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ reset }: ErrorProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
      <div className="text-center px-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
