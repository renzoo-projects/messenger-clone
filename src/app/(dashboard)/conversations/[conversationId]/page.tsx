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

  const conversation = await prismadb.conversation.findUnique({
    where: { id: conversationId },
    include: {
      users: { include: { user: true } },
      messages: {
        include: {
          sender: true,
          seenBy: { include: { user: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!conversation) {
    notFound()
  }

  const isMember = conversation.users.some((u) => u.userId === currentUserId)
  if (!isMember) {
    notFound()
  }

  const unreadCount = await prismadb.message.count({
    where: {
      conversationId,
      senderId: { not: currentUserId },
      seenBy: { none: { userId: currentUserId } },
    },
  })

  const transformed = transformConversation(conversation)
  transformed.unreadCount = unreadCount

  return (
    <ConversationClient
      initialConversation={transformed}
      conversationId={conversationId}
    />
  )
}
