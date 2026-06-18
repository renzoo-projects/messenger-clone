import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import pusherServer from "@/lib/pusherServer"
import { transformConversation } from "@/lib/conversationTransformer"
import { assertConversationMember } from "@/lib/conversationAuth"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params
    await assertConversationMember(session.user.id, conversationId)

    await prismadb.seenMessage.deleteMany({
      where: {
        userId: session.user.id,
        message: {
          conversationId,
          senderId: { not: session.user.id },
        },
      },
    })

    const conversation = await prismadb.conversation.findUnique({
      where: { id: conversationId },
      include: {
        users: { include: { user: true } },
        messages: {
          include: { sender: true, seenBy: { include: { user: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })

    if (conversation) {
      const unreadCount = await prismadb.message.count({
        where: {
          conversationId,
          senderId: { not: session.user.id },
          seenBy: { none: { userId: session.user.id } },
        },
      })

      await pusherServer.trigger(
        `private-${session.user.id}`,
        "conversation:update",
        { ...transformConversation(conversation), unreadCount }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("UNREAD_POST", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
