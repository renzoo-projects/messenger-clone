type SkeletonVariant = "text" | "avatar" | "card" | "message" | "line"

interface SkeletonProps {
  className?: string
  variant?: SkeletonVariant
}

export default function Skeleton({ className = "", variant = "text" }: SkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded w-full",
    avatar: "h-12 w-12 rounded-full",
    card: "h-32 rounded-2xl",
    message: "h-12 w-2/3 rounded-[22px]",
    line: "h-3 rounded w-3/4",
  }

  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${variantClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  )
}
