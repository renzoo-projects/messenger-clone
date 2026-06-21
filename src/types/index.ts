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
  createdAt: string
  sender: SafeUser | null
  seenBy: { user: SafeUser }[]
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

