"use client"

import { create } from "zustand"

export type FontSize = "sm" | "md" | "lg" | "xl"

interface FontSizeStore {
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
}

export const useFontSize = create<FontSizeStore>((set) => ({
  fontSize: "md",
  setFontSize: (size) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("font-size", size)
      document.documentElement.dataset.fontSize = size === "md" ? "" : size
    }
    set({ fontSize: size })
  },
}))
