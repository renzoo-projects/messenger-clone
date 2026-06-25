import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import pusherServer from "@/lib/pusherServer"
import { sanitizeUser } from "@/lib/safeUser"
import { settingsSchema } from "@/lib/validations"
import { transformConversation } from "@/lib/conversationTransformer"

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) {
      console.error("SETTINGS_VALIDATION_ERROR", parsed.error.issues)
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    const { name, image } = parsed.data

    const user = await prismadb.user.update({
      where: { id: session.user.id },
      data: { name, image },
    })

    try {
      const conversations = await prismadb.conversation.findMany({
        where: { users: { some: { userId: session.user.id } } },
        include: {
          users: { include: { user: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: true, seenBy: { include: { user: true } } },
          },
        },
      })

      await Promise.allSettled(
        conversations.flatMap((conv) => {
          const transformed = transformConversation(conv)
          const memberIds = conv.users.map((cu) => cu.userId)
          return [
            pusherServer.trigger(
              `private-conversation-${conv.id}`,
              "conversation:update",
              transformed
            ),
            ...memberIds.map((uid) =>
              pusherServer.trigger(
                `private-${uid}`,
                "conversation:update",
                transformed
              )
            ),
          ]
        })
      )
    } catch (e) {
      console.warn("SETTINGS_PUSHER_FAILED", e)
    }

    return NextResponse.json(sanitizeUser(user))
  } catch (error) {
    console.error("SETTINGS_PATCH", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
