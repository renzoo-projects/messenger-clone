export default function DashboardLoading() {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800 motion-safe:animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
      <div className="flex-1 px-4 py-6 space-y-4">
        <div className="flex justify-start">
          <div className="h-10 w-48 rounded-[22px] rounded-bl-sm bg-white dark:bg-gray-900 shadow-sm" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-36 rounded-[22px] rounded-br-sm bg-blue-100 dark:bg-blue-900/30 shadow-sm" />
        </div>
        <div className="flex justify-start">
          <div className="h-10 w-56 rounded-[22px] rounded-bl-sm bg-white dark:bg-gray-900 shadow-sm" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-40 rounded-[22px] rounded-br-sm bg-blue-100 dark:bg-blue-900/30 shadow-sm" />
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="h-11 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800" />
      </div>
    </div>
  )
}
