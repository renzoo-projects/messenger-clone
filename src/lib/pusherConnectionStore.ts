import { create } from "zustand"

interface PusherConnectionStore {
  status: "connected" | "connecting" | "disconnected"
  previousStatus: "connected" | "connecting" | "disconnected" | null
  reconnectCount: number
  setStatus: (status: "connected" | "connecting" | "disconnected") => void
}

const usePusherConnection = create<PusherConnectionStore>((set) => ({
  status: "connecting",
  previousStatus: null,
  reconnectCount: 0,
  setStatus: (status) =>
    set((state) => ({
      previousStatus: state.status,
      status,
      reconnectCount:
        status === "connected" && state.status !== "connected"
          ? state.reconnectCount + 1
          : state.reconnectCount,
    })),
}))

export default usePusherConnection
