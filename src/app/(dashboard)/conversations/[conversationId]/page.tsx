import { auth } from "@/auth"
import prismadb from "@/lib/prismadb"
import { transformConversation } from "@/lib/conversationTransformer"
import { notFound, redirect } from "next/navigation"
import ConversationClient from "./ConversationClient"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }
  const currentUserId = session.user.id

  const { conversationId } = await params

  const [conversation, messages, unreadCount] = await Promise.all([
    prismadb.conversation.findUnique({
      where: { id: conversationId },
      include: {
        users: { include: { user: true } },
      },
    }),
    prismadb.message.findMany({
      where: { conversationId },
      include: {
        sender: true,
        seenBy: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prismadb.message.count({
      where: {
        conversationId,
        senderId: { not: currentUserId },
        seenBy: { none: { userId: currentUserId } },
      },
    }),
  ])

  if (!conversation) {
    notFound()
  }

  const isMember = conversation.users.some((u) => u.userId === currentUserId)
  if (!isMember) {
    notFound()
  }

  messages.reverse()

  const initialCursor =
    messages.length > 0
      ? messages[0].id
      : null

  const transformed = transformConversation({ ...conversation, messages })
  transformed.unreadCount = unreadCount

  return (
    <ConversationClient
      initialConversation={transformed}
      conversationId={conversationId}
      initialCursor={initialCursor}
    />
  )
}
