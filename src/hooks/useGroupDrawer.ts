import { create } from "zustand"
import { FullConversationType } from "@/types"

interface GroupDrawerStore {
  isOpen: boolean
  conversation: FullConversationType | null
  onOpen: (conversation: FullConversationType) => void
  onClose: () => void
  updateConversation: (conversation: FullConversationType) => void
}

const useGroupDrawer = create<GroupDrawerStore>((set) => ({
  isOpen: false,
  conversation: null,
  onOpen: (conversation) => set({ isOpen: true, conversation }),
  onClose: () => set({ isOpen: false }),
  updateConversation: (conversation) => set({ conversation }),
}))

export default useGroupDrawer
