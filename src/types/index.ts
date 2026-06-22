import { User } from "@prisma/client"

export type SafeUser = Omit<
  User,
  "createdAt" | "updatedAt" | "emailVerified" | "hashedPassword"
> & {
  createdAt: string
  updatedAt: string
  emailVerified: string | null
}

export interface FullMessageType {
  id: string
  body: string | null
  image: string | null
  images: string[]
  createdAt: string
  sender: SafeUser | null
  seenBy: { userId: string; user: SafeUser }[]
}

export type OptimisticMessageType = FullMessageType & {
  _status?: "sending"
}

export interface FullConversationType {
  id: string
  name: string | null
  isGroup: boolean
  users: SafeUser[]
  messages: FullMessageType[]
  unreadCount: number
  createdAt: string
  updatedAt: string
}
