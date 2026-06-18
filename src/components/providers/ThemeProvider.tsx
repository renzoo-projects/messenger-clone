"use client"

import { useEffect, useCallback } from "react"
import { useTheme } from "@/hooks/useTheme"
import { useFontSize } from "@/hooks/useFontSize"

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = useTheme((s) => s.theme)
  const setTheme = useTheme((s) => s.setTheme)
  const setFontSize = useFontSize((s) => s.setFontSize)

  const syncFromStorage = useCallback(() => {
    const stored = localStorage.getItem("theme")
    if (stored === "light" || stored === "dark") {
      setTheme(stored)
    } else {
      setTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
      )
    }
  }, [setTheme])

  useEffect(() => {
    syncFromStorage()
    const savedSize = localStorage.getItem("font-size")
    if (savedSize === "sm" || savedSize === "lg" || savedSize === "xl") {
      setFontSize(savedSize)
    }
  }, [syncFromStorage, setFontSize])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
  }, [theme])

  return <>{children}</>
}
