import { create } from "zustand"

interface ConversationStore {
  conversationId: string | null
  setConversationId: (id: string | null) => void
}

const useConversation = create<ConversationStore>((set) => ({
  conversationId: null,
  setConversationId: (id) => set({ conversationId: id }),
}))

export default useConversation
