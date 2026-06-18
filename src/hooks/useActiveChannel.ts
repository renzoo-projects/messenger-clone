"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { getPusherClient } from "@/lib/pusherClient"
import useActiveList from "./useActiveList"

export default function useActiveChannel() {
  const { data: session } = useSession()
  const { add, remove, set } = useActiveList()

  useEffect(() => {
    if (!session?.user?.id) return

    const pusherClient = getPusherClient()
    const channel = pusherClient.subscribe("presence-messenger")

    channel.bind("pusher:subscription_succeeded", (members: any) => {
      const memberIds: string[] = []
      members.each((member: any) => memberIds.push(member.id))
      set(memberIds)
    })

    channel.bind("pusher:member_added", (member: any) => {
      add(member.id)
    })

    channel.bind("pusher:member_removed", (member: any) => {
      remove(member.id)
    })

    return () => {
      channel.unbind_all()
      const pusherClient = getPusherClient()
      pusherClient.unsubscribe("presence-messenger")
    }
  }, [session?.user?.id, add, remove, set])
}
