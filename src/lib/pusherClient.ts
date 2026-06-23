"use client"

import PusherClient from "pusher-js"
import usePusherConnection from "./pusherConnectionStore"

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

    pusherInstance.connection.bind("state_change", (states: { current: string }) => {
      const status = states.current === "connected" ? "connected"
        : states.current === "connecting" ? "connecting"
        : "disconnected"
      usePusherConnection.getState().setStatus(status)
    })
  }

  return pusherInstance
}
