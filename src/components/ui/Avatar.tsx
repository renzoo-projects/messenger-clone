"use client"

import Image from "next/image"
import { HiUser } from "react-icons/hi2"
import useActiveList from "@/hooks/useActiveList"

interface AvatarUser {
  id?: string
  name?: string | null
  image?: string | null
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-9 w-9",
  lg: "h-16 w-16",
} as const

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-5 w-5",
  lg: "h-8 w-8",
} as const

const dotSizes = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
} as const

export default function Avatar({
  user,
  size = "md",
}: {
  user?: AvatarUser | null
  size?: "sm" | "md" | "lg"
}) {
  const { members } = useActiveList()
  const isActive = user?.id ? members.includes(user.id) : false

  const name = user?.name
  const image = user?.image

  if (image) {
    return (
      <div className="relative inline-block transition-transform duration-150 hover:scale-105">
        <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden`}>
          <Image
            src={image}
            alt={name || "Avatar"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        {isActive && (
          <span
            className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full bg-green-500 ring-2 ring-white`}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative inline-block transition-transform duration-150 hover:scale-105">
      <div
        className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center`}
      >
        <HiUser className={`${iconSizes[size]} text-gray-500`} />
      </div>
      {isActive && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full bg-green-500 ring-2 ring-white`}
        />
      )}
    </div>
  )
}
