import { auth } from "@/auth"
import { NextResponse } from "next/server"
import pusherServer from "@/lib/pusherServer"
import { verifyConversationMembership } from "@/lib/conversationAuth"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const socketId = formData.get("socket_id")
    const channelName = formData.get("channel_name")

    if (typeof socketId !== "string" || typeof channelName !== "string" || !socketId || !channelName) {
      return NextResponse.json(
        { error: "Missing socket_id or channel_name" },
        { status: 400 }
      )
    }

    if (channelName.startsWith("presence-")) {
      const presenceData = {
        user_id: session.user.id,
        user_info: { name: session.user.name },
      }
      const authResponse = pusherServer.authorizeChannel(
        socketId,
        channelName,
        presenceData
      )
      return NextResponse.json(authResponse)
    }

    if (channelName.startsWith("private-conversation-")) {
      const convId = channelName.replace("private-conversation-", "")
      const isMember = await verifyConversationMembership(
        session.user.id,
        convId
      )
      if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (channelName.startsWith("private-")) {
      const targetUserId = channelName.replace("private-", "")
      if (targetUserId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName)
    return NextResponse.json(authResponse)
  } catch (error) {
    console.error("PUSHER_AUTH", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
