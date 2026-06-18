"use client"

import PusherClient from "pusher-js"

let pusherInstance: PusherClient | null = null

export function getPusherClient(): PusherClient {
  if (typeof window === "undefined") {
    throw new Error("PusherClient should only be used on the client side")
  }

  if (!pusherInstance) {
    pusherInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: "/api/pusher/auth",
        forceTLS: true,
      }
    )
  }

  return pusherInstance
}
