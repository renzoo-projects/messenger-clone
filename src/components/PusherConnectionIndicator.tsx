"use client"

import { useState, useEffect } from "react"
import { getPusherClient } from "@/lib/pusherClient"
import usePusherConnection from "@/lib/pusherConnectionStore"

export default function PusherConnectionIndicator() {
  const [status, setStatus] = useState<"connected" | "connecting" | "disconnected">("connecting")
  const storeStatus = usePusherConnection((s) => s.setStatus)

  useEffect(() => {
    const pusher = getPusherClient()
    const update = () => {
      const s = pusher.connection.state as typeof status
      setStatus(s)
      storeStatus(s)
    }
    update()
    pusher.connection.bind("state_change", update)
    return () => {
      pusher.connection.unbind("state_change", update)
    }
  }, [storeStatus])

  if (status === "connected") return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-1 text-xs text-white motion-safe:animate-slideDown [padding-top:max(0.25rem,env(safe-area-inset-top))]">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
      {status === "connecting" ? "Connecting..." : "Reconnecting..."}
    </div>
  )
}
