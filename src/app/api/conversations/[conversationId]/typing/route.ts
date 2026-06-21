import { auth } from "@/auth"
import { NextResponse } from "next/server"
import pusherServer from "@/lib/pusherServer"
import { assertConversationMember, ForbiddenError } from "@/lib/conversationAuth"

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

    const body = await request.json().catch(() => ({}))
    const action = body?.action === "stop" ? "stop" : "start"
    const event = action === "stop" ? "typing:stop" : "typing:start"

    try {
      await pusherServer.trigger(
        `private-conversation-${conversationId}`,
        event,
        {
          userId: session.user.id,
          userName: session.user.name || "Someone",
        }
      )
    } catch (e) {
      console.warn("PUSHER_TYPING_FAILED", e)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("TYPING_POST", error)
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
