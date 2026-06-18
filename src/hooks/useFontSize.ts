"use client"

import { create } from "zustand"

export type FontSize = "sm" | "md" | "lg" | "xl"

interface FontSizeStore {
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
}

function getInitialFontSize(): FontSize {
  if (typeof window === "undefined") return "md"
  const stored = localStorage.getItem("font-size") as FontSize | null
  return stored ?? "md"
}

export const useFontSize = create<FontSizeStore>((set) => ({
  fontSize: getInitialFontSize(),
  setFontSize: (size) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("font-size", size)
      document.documentElement.dataset.fontSize = size === "md" ? "" : size
    }
    set({ fontSize: size })
  },
}))
