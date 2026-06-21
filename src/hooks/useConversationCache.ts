"use client"

import { create } from "zustand"
import { FullConversationType, FullMessageType } from "@/types"

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  conversation: FullConversationType
  messages: FullMessageType[]
  nextCursor: string | null
  fetchedAt: number
}

interface ConversationCacheState {
  cache: Record<string, CacheEntry>
  getCached: (id: string) => CacheEntry | null
  setCached: (id: string, data: Partial<CacheEntry>) => void
  prefetchConversation: (id: string) => Promise<void>
  clearCached: (id: string) => void
  clearAll: () => void
}

const useConversationCache = create<ConversationCacheState>((set, get) => ({
  cache: {},

  getCached: (id: string) => {
    const entry = get().cache[id]
    if (!entry) return null
    if (Date.now() - entry.fetchedAt > CACHE_TTL) return null
    return entry
  },

  setCached: (id, data) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [id]: {
          ...state.cache[id],
          ...data,
          fetchedAt: state.cache[id]?.fetchedAt ?? Date.now(),
        },
      },
    }))
  },

  prefetchConversation: async (id: string) => {
    const existing = get().cache[id]
    if (existing && Date.now() - existing.fetchedAt < 30_000) return

    try {
      const [convRes, msgRes] = await Promise.all([
        fetch(`/api/conversations/${id}`),
        fetch(`/api/messages/${id}?take=25`),
      ])
      if (!convRes.ok || !msgRes.ok) return
      const [conversation, msgData] = await Promise.all([
        convRes.json(),
        msgRes.json(),
      ])
      set((state) => ({
        cache: {
          ...state.cache,
          [id]: {
            conversation,
            messages: msgData.messages ?? [],
            nextCursor: msgData.nextCursor ?? null,
            fetchedAt: Date.now(),
          },
        },
      }))
    } catch {
      // Silent — user can still fetch on click
    }
  },

  clearCached: (id) => {
    set((state) => {
      const next = { ...state.cache }
      delete next[id]
      return { cache: next }
    })
  },

  clearAll: () => set({ cache: {} }),
}))

export default useConversationCache

export type { CacheEntry }
