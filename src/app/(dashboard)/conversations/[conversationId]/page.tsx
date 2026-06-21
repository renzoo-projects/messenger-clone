import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ConversationClient from "./ConversationClient"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }
  const { conversationId } = await params

  return (
    <ConversationClient
      conversationId={conversationId}
    />
  )
}
