import { FullConversationType } from "@/types"

interface RawConversationUser {
  id: string
  userId: string
  conversationId: string
  createdAt: string | Date
  user: {
    id: string
    name: string | null
    email: string | null
    emailVerified: string | Date | null
    image: string | null
    createdAt: string | Date
    updatedAt: string | Date
  }
}

export function transformConversation(conv: any): FullConversationType {
  return {
    id: conv.id,
    name: conv.name,
    isGroup: conv.isGroup,
    unreadCount: conv.unreadCount ?? 0,
    createdAt:
      typeof conv.createdAt === "string"
        ? conv.createdAt
        : conv.createdAt?.toISOString?.() || conv.createdAt,
    updatedAt:
      typeof conv.updatedAt === "string"
        ? conv.updatedAt
        : conv.updatedAt?.toISOString?.() || conv.updatedAt,
    users: (conv.users || []).map((cu: RawConversationUser) => ({
      id: cu.user.id,
      name: cu.user.name,
      email: cu.user.email,
      emailVerified:
        typeof cu.user.emailVerified === "string"
          ? cu.user.emailVerified
          : cu.user.emailVerified?.toISOString?.() || cu.user.emailVerified,
      image: cu.user.image,
      createdAt:
        typeof cu.user.createdAt === "string"
          ? cu.user.createdAt
          : cu.user.createdAt?.toISOString?.() || cu.user.createdAt,
      updatedAt:
        typeof cu.user.updatedAt === "string"
          ? cu.user.updatedAt
          : cu.user.updatedAt?.toISOString?.() || cu.user.updatedAt,
    })),
    messages: (conv.messages || []).map((msg: any) => ({
      id: msg.id,
      body: msg.body,
      image: msg.image,
      createdAt:
        typeof msg.createdAt === "string"
          ? msg.createdAt
          : msg.createdAt?.toISOString?.() || msg.createdAt,
      sender: msg.sender
        ? {
            id: msg.sender.id,
            name: msg.sender.name,
            email: msg.sender.email,
            emailVerified:
              typeof msg.sender.emailVerified === "string"
                ? msg.sender.emailVerified
                : msg.sender.emailVerified?.toISOString?.() ||
                  msg.sender.emailVerified,
            image: msg.sender.image,
            createdAt:
              typeof msg.sender.createdAt === "string"
                ? msg.sender.createdAt
                : msg.sender.createdAt?.toISOString?.() || msg.sender.createdAt,
            updatedAt:
              typeof msg.sender.updatedAt === "string"
                ? msg.sender.updatedAt
                : msg.sender.updatedAt?.toISOString?.() || msg.sender.updatedAt,
          }
        : null,
      seenBy: (msg.seenBy || []).map((sm: any) => ({
        user: {
          id: sm.user.id,
          name: sm.user.name,
          email: sm.user.email,
          emailVerified:
            typeof sm.user.emailVerified === "string"
              ? sm.user.emailVerified
              : sm.user.emailVerified?.toISOString?.() || sm.user.emailVerified,
          image: sm.user.image,
          createdAt:
            typeof sm.user.createdAt === "string"
              ? sm.user.createdAt
              : sm.user.createdAt?.toISOString?.() || sm.user.createdAt,
          updatedAt:
            typeof sm.user.updatedAt === "string"
              ? sm.user.updatedAt
              : sm.user.updatedAt?.toISOString?.() || sm.user.updatedAt,
        },
      })),
    })),
  }
}
