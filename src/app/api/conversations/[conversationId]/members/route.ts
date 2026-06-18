import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import pusherServer from "@/lib/pusherServer"
import { transformConversation } from "@/lib/conversationTransformer"
import { assertConversationMember } from "@/lib/conversationAuth"
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
    const body = await request.json()
    const parsed = addMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues.map(e => e.message).join(", ") },
        { status: 400 }
      )
    }
    const { userId } = parsed.data

    await prismadb.conversationUser.create({
      data: {
        userId,
        conversationId,
      },
    })

    const conversation = await prismadb.conversation.findUnique({
      where: { id: conversationId },
      include: {
        users: { include: { user: true } },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    const transformed = transformConversation(conversation)

    await pusherServer.trigger(
      `private-${userId}`,
      "conversation:new",
      transformed
    )

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("MEMBERS_POST", error)
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
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues.map(e => e.message).join(", ") },
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
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
