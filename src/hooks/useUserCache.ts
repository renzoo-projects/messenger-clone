"use client"

import { create } from "zustand"
import { SafeUser } from "@/types"

const CACHE_TTL = 5 * 60 * 1000

interface UserCacheState {
  users: SafeUser[] | null
  fetchedAt: number | null
  getCached: () => SafeUser[] | null
  setCached: (users: SafeUser[]) => void
  clearAll: () => void
}

const useUserCache = create<UserCacheState>((set, get) => ({
  users: null,
  fetchedAt: null,

  getCached: () => {
    const { users, fetchedAt } = get()
    if (!users || !fetchedAt) return null
    if (Date.now() - fetchedAt > CACHE_TTL) return null
    return users
  },

  setCached: (users) => set({ users, fetchedAt: Date.now() }),

  clearAll: () => set({ users: null, fetchedAt: null }),
}))

export default useUserCache
