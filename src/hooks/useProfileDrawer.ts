import { create } from "zustand"
import { SafeUser } from "@/types"

interface ProfileDrawerStore {
  isOpen: boolean
  user: SafeUser | null
  onOpen: (user: SafeUser) => void
  onClose: () => void
}

const useProfileDrawer = create<ProfileDrawerStore>((set) => ({
  isOpen: false,
  user: null,
  onOpen: (user) => set({ isOpen: true, user }),
  onClose: () => set({ isOpen: false }),
}))

export default useProfileDrawer
