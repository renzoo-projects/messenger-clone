import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Page not found
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/conversations"
          className="mt-4 inline-block rounded-md bg-sky-500 px-4 py-2 text-sm text-white hover:bg-sky-600 transition"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
