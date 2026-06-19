import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import pusherServer from "@/lib/pusherServer"
import { transformConversation } from "@/lib/conversationTransformer"
import { assertConversationMember, ForbiddenError } from "@/lib/conversationAuth"
import { addMemberSchema, removeMemberSchema } from "@/lib/validations"

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

    const conversation = await prismadb.conversation.findUnique({
      where: { id: conversationId },
      select: { isGroup: true },
    })
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }
    if (!conversation.isGroup) {
      return NextResponse.json(
        { error: "Cannot add members to a 1-on-1 conversation" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = addMemberSchema.safeParse(body)
    if (!parsed.success) {
      console.error("MEMBERS_POST_VALIDATION_ERROR", parsed.error.issues)
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }
    const { userId } = parsed.data

    const existing = await prismadb.conversationUser.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    })
    if (existing) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 409 }
      )
    }

    await prismadb.conversationUser.create({
      data: { userId, conversationId },
    })

    const updated = await prismadb.conversation.findUnique({
      where: { id: conversationId },
      include: {
        users: { include: { user: true } },
      },
    })

    if (!updated) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    const transformed = transformConversation(updated)

    await pusherServer.trigger(
      `private-${userId}`,
      "conversation:new",
      transformed
    )

    await pusherServer.trigger(
      `private-conversation-${conversationId}`,
      "conversation:update",
      transformed
    )

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("MEMBERS_POST", error)
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
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
    const parsed = removeMemberSchema.safeParse(body)
    if (!parsed.success) {
      console.error("MEMBERS_DELETE_VALIDATION_ERROR", parsed.error.issues)
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }
    const { userId } = parsed.data

    await prismadb.conversationUser.deleteMany({
      where: {
        userId,
        conversationId,
      },
    })

    await pusherServer.trigger(
      `private-${userId}`,
      "conversation:delete",
      { id: conversationId }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("MEMBERS_DELETE", error)
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
