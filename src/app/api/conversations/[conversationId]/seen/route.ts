import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import pusherServer from "@/lib/pusherServer"
import { assertConversationMember } from "@/lib/conversationAuth"
import { sanitizeUser } from "@/lib/safeUser"

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

    const currentUserId = session.user.id
    const messageIds = await prismadb.message.findMany({
      where: {
        conversationId,
        senderId: { not: currentUserId },
        seenBy: { none: { userId: currentUserId } },
      },
      select: { id: true },
    })

    if (messageIds.length > 0) {
      await prismadb.seenMessage.createMany({
        data: messageIds.map((m) => ({
          messageId: m.id,
          userId: currentUserId,
        })),
      })

      const currentUserData = await prismadb.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, name: true, image: true, email: true, emailVerified: true, hashedPassword: true, createdAt: true, updatedAt: true },
      })

      await pusherServer.trigger(
        `private-conversation-${conversationId}`,
        "messages:seen",
        {
          messageIds: messageIds.map((m) => m.id),
          userId: currentUserId,
          user: sanitizeUser(currentUserData!),
        }
      )
    }

    await pusherServer.trigger(
      `private-${currentUserId}`,
      "conversation:update",
      { id: conversationId, unreadCount: 0 }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("SEEN_POST", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
