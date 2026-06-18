import prismadb from "@/lib/prismadb"

export async function verifyConversationMembership(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const conversation = await prismadb.conversation.findFirst({
    where: {
      id: conversationId,
      users: { some: { userId } },
    },
    select: { id: true },
  })
  return conversation !== null
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message)
    this.name = "ForbiddenError"
  }
}

export async function assertConversationMember(
  userId: string,
  conversationId: string
): Promise<void> {
  if (!(await verifyConversationMembership(userId, conversationId))) {
    throw new ForbiddenError()
  }
}

