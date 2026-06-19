import { create } from "zustand"

interface PusherConnectionStore {
  status: "connected" | "connecting" | "disconnected"
  previousStatus: "connected" | "connecting" | "disconnected" | null
  setStatus: (status: "connected" | "connecting" | "disconnected") => void
}

const usePusherConnection = create<PusherConnectionStore>((set) => ({
  status: "connecting",
  previousStatus: null,
  setStatus: (status) =>
    set((state) => ({
      previousStatus: state.status,
      status,
    })),
}))

export default usePusherConnection
