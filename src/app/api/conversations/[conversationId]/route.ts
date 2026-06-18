import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import pusherServer from "@/lib/pusherServer"
import { transformConversation } from "@/lib/conversationTransformer"
import { conversationPatchSchema } from "@/lib/validations"
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
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    const unreadCount = await prismadb.message.count({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        seenBy: {
          none: { userId: session.user.id },
        },
      },
    })

    const transformed = transformConversation(conversation)
    transformed.unreadCount = unreadCount

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("CONVERSATION_GET", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(
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
    const parsed = conversationPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues.map(e => e.message).join(", ") },
        { status: 400 }
      )
    }

    const { name } = parsed.data

    const conversation = await prismadb.conversation.update({
      where: { id: conversationId },
      data: { name },
      include: {
        users: { include: { user: true } },
      },
    })

    const transformed = transformConversation(conversation)

    await pusherServer.trigger(
      `private-conversation-${conversationId}`,
      "conversation:update",
      transformed
    )

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("CONVERSATION_PATCH", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
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

    const existing = await prismadb.conversation.findUnique({
      where: { id: conversationId },
      include: { users: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    await prismadb.conversation.delete({
      where: { id: conversationId },
    })

    const deletePayload = { id: conversationId }

    await pusherServer.trigger(
      `private-conversation-${conversationId}`,
      "conversation:delete",
      deletePayload
    )

    await Promise.all(
      existing.users.map((member) =>
        pusherServer.trigger(
          `private-${member.userId}`,
          "conversation:delete",
          deletePayload
        )
      )
    )

    return NextResponse.json(deletePayload)
  } catch (error) {
    console.error("CONVERSATION_DELETE", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
