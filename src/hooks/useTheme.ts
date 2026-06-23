"use client"

import { create } from "zustand"

type Theme = "light" | "dark"

interface ThemeStore {
  theme: Theme
  toggle: () => void
  setTheme: (theme: Theme) => void
}

export const useTheme = create<ThemeStore>((set) => ({
  theme: "light" as Theme,
  toggle: () =>
    set((state) => {
      const next = state.theme === "light" ? "dark" : "light"
      if (typeof window !== "undefined") localStorage.setItem("theme", next)
      return { theme: next }
    }),
  setTheme: (theme) => {
    if (typeof window !== "undefined") localStorage.setItem("theme", theme)
    set({ theme })
  },
}))
