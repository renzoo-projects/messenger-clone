"use client"

import { memo } from "react"
import Image from "next/image"
import { HiUser } from "react-icons/hi2"

interface GroupAvatarUser {
  id?: string
  name?: string | null
  image?: string | null
}

const containerClasses = {
  sm: "h-7 w-7",
  md: "h-10 w-10",
  lg: "h-16 w-16",
} as const

const containerPx = { sm: 28, md: 40, lg: 64 } as const

function Face({ user, circleSize }: { user: GroupAvatarUser | undefined; circleSize: number }) {
  const style = { width: circleSize, height: circleSize }

  if (user?.image) {
    return (
      <div className="relative rounded-full overflow-hidden" style={style}>
        <Image
          src={user.image}
          alt={user.name || "Avatar"}
          fill
          className="object-cover"
          sizes={circleSize + "px"}
        />
      </div>
    )
  }

  if (user?.name) {
    return (
      <div
        className="flex items-center justify-center bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden font-medium"
        style={{ ...style, fontSize: circleSize * 0.3 }}
      >
        <span className="text-gray-600 dark:text-gray-300">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" style={style}>
      <HiUser className="text-gray-400 dark:text-gray-500" style={{ width: circleSize * 0.5, height: circleSize * 0.5 }} />
    </div>
  )
}

const GroupAvatar = memo(function GroupAvatar({
  users,
  size = "md",
}: {
  users: GroupAvatarUser[]
  size?: "sm" | "md" | "lg"
}) {
  const container = containerPx[size]
  const c1Size = Math.round(container * 0.6)
  const c2Size = Math.round(container * 0.72)
  const displayUsers = users.slice(0, 2)

  return (
    <div className={"relative inline-block " + containerClasses[size]}>
      <div
        className="absolute rounded-full overflow-hidden"
        style={{ top: 0, left: 0, width: c1Size, height: c1Size, zIndex: 2 }}
      >
        <Face user={displayUsers[0]} circleSize={c1Size} />
      </div>
      <div
        className="absolute rounded-full overflow-hidden"
        style={{
          bottom: 0,
          right: 0,
          width: c2Size,
          height: c2Size,
          zIndex: 1,
          boxShadow: "-2px -2px 0 2px var(--avatar-gap-bg)",
        }}
      >
        <Face user={displayUsers[1]} circleSize={c2Size} />
      </div>
    </div>
  )
})

export default GroupAvatar
