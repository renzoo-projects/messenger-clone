"use client"

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-xl bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 transition"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
