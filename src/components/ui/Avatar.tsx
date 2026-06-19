"use client"

import { memo } from "react"
import Image from "next/image"
import { HiUser } from "react-icons/hi2"
import useActiveList from "@/hooks/useActiveList"

interface AvatarUser {
  id?: string
  name?: string | null
  image?: string | null
}

const sizeClasses = {
  sm: "h-7 w-7",
  md: "h-10 w-10",
  lg: "h-16 w-16",
} as const

const iconSizes = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-8 w-8",
} as const

const dotSizes = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-4 w-4",
} as const

const sizePx = { sm: "28px", md: "40px", lg: "64px" } as const

const groupContainer = {
  sm: "h-7 w-7 rounded-md",
  md: "h-10 w-10 rounded-lg",
  lg: "h-16 w-16 rounded-xl",
} as const

function GroupAvatar({ users, size }: { users: AvatarUser[]; size: "sm" | "md" | "lg" }) {
  const displayUsers = users.slice(0, 2)

  function renderFace(user: AvatarUser | undefined, clipPath: string) {
    if (!user) {
      return (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700"
          style={{ clipPath }}
        >
          <HiUser className={iconSizes[size] + " text-gray-400 dark:text-gray-500"} />
        </div>
      )
    }

    if (user.image) {
      return (
        <div className="absolute inset-0" style={{ clipPath }}>
          <Image
            src={user.image}
            alt={user.name || "Avatar"}
            fill
            sizes={sizePx[size]}
            className="object-cover"
          />
        </div>
      )
    }

    if (user.name) {
      return (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-300 dark:bg-gray-600"
          style={{ clipPath }}
        >
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )
    }

    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700"
        style={{ clipPath }}
      >
        <HiUser className={iconSizes[size] + " text-gray-400 dark:text-gray-500"} />
      </div>
    )
  }

  return (
    <div className={"relative inline-block " + groupContainer[size] + " overflow-hidden bg-gray-200 dark:bg-gray-700"}>
      {renderFace(displayUsers[0], "polygon(0 0, 100% 0, 0 100%)")}
      {renderFace(displayUsers[1], "polygon(100% 0, 100% 100%, 0 100%)")}
    </div>
  )
}

const Avatar = memo(function Avatar({
  user,
  users,
  size = "md",
}: {
  user?: AvatarUser | null
  users?: AvatarUser[]
  size?: "sm" | "md" | "lg"
}) {
  if (users && users.length >= 2) {
    return <GroupAvatar users={users} size={size} />
  }

  const { members } = useActiveList()
  const isActive = user?.id ? members.includes(user.id) : false

  const name = user?.name
  const image = user?.image

  if (image) {
    return (
      <div className="relative inline-block transition-transform duration-150 hover:scale-105">
        <div className={"relative " + sizeClasses[size] + " rounded-full overflow-hidden"}>
          <Image
            src={image}
            alt={name || "Avatar"}
            fill
            sizes={sizePx[size]}
            className="object-cover"
          />
        </div>
        {isActive && (
          <span
            className={"absolute bottom-0 right-0 " + dotSizes[size] + " rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-950"}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative inline-block transition-transform duration-150 hover:scale-105">
      <div
        className={sizeClasses[size] + " rounded-full bg-gray-200 flex items-center justify-center"}
      >
        <HiUser className={iconSizes[size] + " text-gray-500"} />
      </div>
      {isActive && (
        <span
          className={"absolute bottom-0 right-0 " + dotSizes[size] + " rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-950"}
        />
      )}
    </div>
  )
})

export default Avatar
