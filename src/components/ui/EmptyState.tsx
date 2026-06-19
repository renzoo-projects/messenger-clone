import { HiChatBubbleLeftRight } from "react-icons/hi2"

interface EmptyStateProps {
  title?: string
  subtitle?: string
}

export default function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8 h-full flex justify-center items-center bg-transparent">
      <div className="text-center items-center flex flex-col">
        <HiChatBubbleLeftRight className="mx-auto h-20 w-20 text-gray-200 dark:text-gray-700 mb-4" />
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {title || "Select a conversation or start a new one"}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
