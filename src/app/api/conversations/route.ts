import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import pusherServer from "@/lib/pusherServer"
import { transformConversation } from "@/lib/conversationTransformer"
import { conversationSchema } from "@/lib/validations"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversations = await prismadb.conversation.findMany({
      where: {
        users: {
          some: { userId: session.user.id },
        },
      },
      include: {
        users: {
          include: { user: true },
        },
        messages: {
          include: {
            sender: true,
            seenBy: { include: { user: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    const conversationIds = conversations.map((c) => c.id)

    const unreadMessages = await prismadb.message.findMany({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: session.user.id },
        seenBy: { none: { userId: session.user.id } },
      },
      select: { conversationId: true },
    })

    const unreadMap: Record<string, number> = {}
    for (const msg of unreadMessages) {
      unreadMap[msg.conversationId] = (unreadMap[msg.conversationId] || 0) + 1
    }

    return NextResponse.json(
      conversations.map((conv) => ({
        ...transformConversation(conv),
        unreadCount: unreadMap[conv.id] || 0,
      }))
    )
  } catch (error) {
    console.error("CONVERSATIONS_GET", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = conversationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues.map(e => e.message).join(", ") },
        { status: 400 }
      )
    }

    const { userId, isGroup, members, name } = parsed.data

    if (isGroup) {
      if (!members || members.length < 2 || !name) {
        return NextResponse.json(
          { error: "Group requires at least 2 members and a name" },
          { status: 400 }
        )
      }

      const conversation = await prismadb.conversation.create({
        data: {
          name,
          isGroup: true,
          users: {
            create: [
              ...members.map((memberId: string) => ({
                userId: memberId,
              })),
              { userId: session.user.id },
            ],
          },
        },
        include: {
          users: { include: { user: true } },
          messages: {
            include: {
              sender: true,
              seenBy: { include: { user: true } },
            },
          },
        },
      })

      const transformedGroup = transformConversation(conversation)

      await Promise.all(
        conversation.users.map((member) =>
          pusherServer.trigger(
            `private-${member.user.id}`,
            "conversation:new",
            transformedGroup
          )
        )
      )

      return NextResponse.json(transformedGroup)
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      )
    }

    const existingConversations = await prismadb.conversation.findMany({
      where: {
        AND: [
          { isGroup: false },
          {
            users: {
              some: { userId: session.user.id },
            },
          },
          {
            users: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        users: { include: { user: true } },
      },
    })

    const existingConversation = existingConversations[0]

    if (existingConversation) {
      return NextResponse.json(transformConversation(existingConversation))
    }

    const conversation = await prismadb.conversation.create({
      data: {
        users: {
          create: [
            { userId: session.user.id },
            { userId },
          ],
        },
      },
      include: {
        users: { include: { user: true } },
        messages: {
          include: {
            sender: true,
            seenBy: { include: { user: true } },
          },
        },
      },
    })

    const transformed = transformConversation(conversation)

    await Promise.all([
      pusherServer.trigger(`private-${session.user.id}`, "conversation:new", transformed),
      pusherServer.trigger(`private-${userId}`, "conversation:new", transformed),
    ])

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("CONVERSATIONS_POST", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
