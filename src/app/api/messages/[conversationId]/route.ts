import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import pusherServer from "@/lib/pusherServer"
import { transformConversation } from "@/lib/conversationTransformer"
import { sanitizeUser } from "@/lib/safeUser"
import { messageSchema } from "@/lib/validations"
import { assertConversationMember } from "@/lib/conversationAuth"

export async function GET(
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

    const messages = await prismadb.message.findMany({
      where: { conversationId },
      include: {
        sender: true,
        seenBy: { include: { user: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    const sanitized = messages.map((m) => ({
      ...m,
      sender: m.sender ? sanitizeUser(m.sender) : null,
      seenBy: m.seenBy.map((sm) => ({
        ...sm,
        user: sanitizeUser(sm.user),
      })),
    }))

    return NextResponse.json(sanitized)
  } catch (error) {
    console.error("MESSAGES_GET", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params
    await assertConversationMember(session.user.id, conversationId)
    const body = await request.json()
    const parsed = messageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues.map(e => e.message).join(", ") },
        { status: 400 }
      )
    }

    const { message, image } = parsed.data

    if (!message && !image) {
      return NextResponse.json(
        { error: "Message or image required" },
        { status: 400 }
      )
    }

    const newMessage = await prismadb.message.create({
      data: {
        body: message || null,
        image: image || null,
        conversationId,
        senderId: session.user.id,
        seenBy: {
          create: { userId: session.user.id },
        },
      },
      select: {
        id: true,
        body: true,
        image: true,
        createdAt: true,
        senderId: true,
        conversationId: true,
        sender: {
          select: {
            id: true, name: true, image: true, email: true,
            emailVerified: true, createdAt: true, updatedAt: true,
          },
        },
        seenBy: {
          select: {
            userId: true,
            user: {
              select: {
                id: true, name: true, image: true, email: true,
                emailVerified: true, createdAt: true, updatedAt: true,
              },
            },
          },
        },
      },
    })

    const conversation = await prismadb.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
      include: {
        users: { include: { user: true } },
        messages: {
          include: {
            sender: true,
            seenBy: { include: { user: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })

    await pusherServer.trigger(
      `private-conversation-${conversationId}`,
      "messages:new",
      newMessage
    )

    const transformed = transformConversation(conversation)

    const results = await Promise.allSettled(
      conversation.users.map(async (member) => {
        const unreadCount = await prismadb.message.count({
          where: {
            conversationId,
            senderId: { not: member.user.id },
            seenBy: { none: { userId: member.user.id } },
          },
        })

        await pusherServer.trigger(
          `private-${member.user.id}`,
          "conversation:update",
          { ...transformed, unreadCount }
        )
      })
    )

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[MESSAGES_POST] Pusher conversation:update failed:", result.reason)
      }
    }

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error("[MESSAGES_POST] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
