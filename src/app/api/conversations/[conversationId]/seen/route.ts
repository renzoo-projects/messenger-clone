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
        senderId: { not: session.user.id },
        seenBy: { none: { userId: session.user.id } },
      },
      select: { id: true },
    })

    const currentUserData = await prismadb.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, name: true, image: true, email: true, emailVerified: true, hashedPassword: true, createdAt: true, updatedAt: true },
    })

    if (messageIds.length > 0) {
      await prismadb.seenMessage.createMany({
        data: messageIds.map((m) => ({
          messageId: m.id,
          userId: currentUserId,
        })),
      })

      const seenPayload = (m: { id: string }) => ({
        messageId: m.id,
        userId: currentUserId,
        user: sanitizeUser(currentUserData!),
      })

      await Promise.all(
        messageIds.map((m) =>
          pusherServer.trigger(
            `private-conversation-${conversationId}`,
            "message:seen",
            seenPayload(m)
          )
        )
      )
    }

    await pusherServer.trigger(
      `private-${session.user.id}`,
      "conversation:update",
      { id: conversationId, unreadCount: 0 }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("SEEN_POST", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
