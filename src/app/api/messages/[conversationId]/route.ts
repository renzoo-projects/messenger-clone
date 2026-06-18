import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import pusherServer from "@/lib/pusherServer"
import { transformConversation } from "@/lib/conversationTransformer"
import { sanitizeUser } from "@/lib/safeUser"
import { messageSchema } from "@/lib/validations"
import { assertConversationMember, ForbiddenError } from "@/lib/conversationAuth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params
    const currentUserId = session.user.id
    await assertConversationMember(currentUserId, conversationId)

    const url = new URL(request.url)
    const cursor = url.searchParams.get("cursor")
    const take = Math.min(Number(url.searchParams.get("take")) || 50, 100)

    const messages = await prismadb.message.findMany({
      where: { conversationId },
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        sender: true,
        seenBy: { include: { user: true } },
      },
    })

    const hasMore = messages.length > take
    if (hasMore) messages.pop()

    const nextCursor = hasMore ? messages[messages.length - 1]?.id : null

    const sanitized = messages
      .filter((m) => m.sender)
      .reverse()
      .map((m) => ({
        ...m,
        sender: sanitizeUser(m.sender!),
        seenBy: m.seenBy.map((sm) => ({
          ...sm,
          user: sanitizeUser(sm.user),
        })),
      }))

    return NextResponse.json({ messages: sanitized, nextCursor })
  } catch (error) {
    console.error("MESSAGES_GET", error)
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
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

    const currentUserId = session.user.id

    const { conversationId } = await params
    await assertConversationMember(currentUserId, conversationId)
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
        senderId: currentUserId,
        seenBy: {
          create: { userId: currentUserId },
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

    await pusherServer.trigger(
      `private-conversation-${conversationId}`,
      "messages:new",
      newMessage
    )

    const [convData, lastMsg] = await Promise.all([
      prismadb.conversation.findUnique({
        where: { id: conversationId },
        select: {
          id: true,
          name: true,
          isGroup: true,
          createdAt: true,
          updatedAt: true,
          users: {
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
      }),
      prismadb.message.findFirst({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, body: true, image: true, createdAt: true,
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
      }),
    ])

    const transformed = convData
      ? transformConversation({ ...convData, messages: lastMsg ? [lastMsg] : [] })
      : null

    const memberIds = convData?.users.map((u) => u.userId) || []

    const unreadCounts = await Promise.all(
      memberIds
        .filter((uid) => uid !== currentUserId)
        .map((userId) =>
          prismadb.message
            .count({
              where: {
                conversationId,
                senderId: { not: userId },
                seenBy: { none: { userId } },
              },
            })
            .then((count) => ({ userId, count }))
        )
    )

    await Promise.allSettled(
      unreadCounts.map(({ userId, count }) =>
        pusherServer.trigger(`private-${userId}`, "conversation:update", {
          ...transformed,
          unreadCount: count,
        })
      )
    )

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error("[MESSAGES_POST] Error:", error)
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
