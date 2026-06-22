import { FullConversationType } from "@/types"

interface RawUser {
  id: string
  name: string | null
  email: string | null
  emailVerified: string | Date | null
  image: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

interface RawConversationUser {
  id?: string
  userId: string
  conversationId?: string
  createdAt?: string | Date
  user: RawUser
}

interface RawSeenMessage {
  userId: string
  user: RawUser
}

interface RawMessage {
  id: string
  body: string | null
  image: string | null
  createdAt: string | Date
  sender: RawUser
  seenBy?: RawSeenMessage[]
}

interface RawConversation {
  id: string
  name: string | null
  isGroup: boolean
  unreadCount?: number
  createdAt: string | Date
  updatedAt: string | Date
  users?: RawConversationUser[]
  messages?: RawMessage[]
}

function serializeDate(value: string | Date): string {
  return typeof value === "string" ? value : value.toISOString()
}

function serializeNullableDate(value: string | Date | null): string | null {
  if (!value) return null
  return serializeDate(value)
}

export function transformConversation(conv: RawConversation): FullConversationType {
  return {
    id: conv.id,
    name: conv.name,
    isGroup: conv.isGroup,
    unreadCount: conv.unreadCount ?? 0,
    createdAt: serializeDate(conv.createdAt),
    updatedAt: serializeDate(conv.updatedAt),
    users: (conv.users || []).map((cu: RawConversationUser) => ({
      id: cu.user.id,
      name: cu.user.name,
      email: cu.user.email,
      emailVerified: serializeNullableDate(cu.user.emailVerified),
      image: cu.user.image,
      createdAt: serializeDate(cu.user.createdAt),
      updatedAt: serializeDate(cu.user.updatedAt),
    })),
    messages: (conv.messages || []).map((msg) => ({
      id: msg.id,
      body: msg.body,
      image: msg.image,
      images: msg.images || [],
      createdAt:
        typeof msg.createdAt === "string"
          ? msg.createdAt
          : msg.createdAt?.toISOString?.() || msg.createdAt,
      sender: msg.sender
        ? {
            id: msg.sender.id,
            name: msg.sender.name,
            email: msg.sender.email,
            emailVerified: serializeNullableDate(msg.sender.emailVerified),
            image: msg.sender.image,
            createdAt: serializeDate(msg.sender.createdAt),
            updatedAt: serializeDate(msg.sender.updatedAt),
          }
        : null,
      seenBy: (msg.seenBy || []).map((sm: any) => ({
        userId: sm.userId,
        user: {
          id: sm.user.id,
          name: sm.user.name,
          email: sm.user.email,
          emailVerified: serializeNullableDate(sm.user.emailVerified),
          image: sm.user.image,
          createdAt: serializeDate(sm.user.createdAt),
          updatedAt: serializeDate(sm.user.updatedAt),
        },
      })),
    })),
  }
}
