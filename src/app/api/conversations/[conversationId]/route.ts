import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import pusherServer from "@/lib/pusherServer"
import { transformConversation } from "@/lib/conversationTransformer"
import { conversationPatchSchema } from "@/lib/validations"
import { assertConversationMember, ForbiddenError } from "@/lib/conversationAuth"

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
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
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
      console.error("PATCH_VALIDATION_ERROR", parsed.error.issues)
      return NextResponse.json(
        { error: "Invalid input" },
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

    try {
      await pusherServer.trigger(
        `private-conversation-${conversationId}`,
        "conversation:update",
        transformed
      )
    } catch (e) {
      console.warn("PUSHER_UPDATE_FAILED", e)
    }

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("CONVERSATION_PATCH", error)
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
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

    await prismadb.conversationUser.deleteMany({
      where: { userId: session.user.id, conversationId },
    })

    await prismadb.seenMessage.deleteMany({
      where: {
        userId: session.user.id,
        message: { conversationId },
      },
    })

    const deletePayload = { id: conversationId }

    await pusherServer.trigger(
      `private-${session.user.id}`,
      "conversation:delete",
      deletePayload
    )

    return NextResponse.json(deletePayload)
  } catch (error) {
    console.error("CONVERSATION_DELETE", error)
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
