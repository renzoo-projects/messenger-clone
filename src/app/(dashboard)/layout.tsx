import { auth } from "@/auth"
import prismadb from "@/lib/prismadb"
import { transformConversation } from "@/lib/conversationTransformer"
import Sidebar from "@/components/sidebar/Sidebar"
import ConversationList from "@/components/sidebar/ConversationList"
import SettingsModal from "@/components/sidebar/SettingsModal"
import PusherConnectionIndicator from "@/components/PusherConnectionIndicator"
import { FullConversationType } from "@/types"

async function getConversations(userId: string): Promise<FullConversationType[]> {
  const conversations = await prismadb.conversation.findMany({
    where: {
      users: {
        some: { userId },
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
      senderId: { not: userId },
      seenBy: { none: { userId } },
    },
    select: { conversationId: true },
  })

  const unreadMap: Record<string, number> = {}
  for (const msg of unreadMessages) {
    unreadMap[msg.conversationId] = (unreadMap[msg.conversationId] || 0) + 1
  }

  return conversations.map((conv) => ({
    ...transformConversation(conv),
    unreadCount: unreadMap[conv.id] || 0,
  }))
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const initialConversations = session?.user?.id
    ? await getConversations(session.user.id)
    : []

  return (
    <div className="h-full">
      <PusherConnectionIndicator />
      <SettingsModal />
      <Sidebar />
      <ConversationList initialConversations={initialConversations} />
      <main id="main-content" className="lg:ml-20 lg:pl-80 h-full pb-20 lg:pb-0 [padding-bottom:max(5rem,env(safe-area-inset-bottom))] lg:[padding-bottom:0] bg-[#F0F2F5] dark:bg-gray-900">
        {children}
      </main>
    </div>
  )
}
