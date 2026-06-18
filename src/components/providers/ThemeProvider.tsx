"use client"

import { useEffect, useCallback } from "react"
import { useTheme } from "@/hooks/useTheme"

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = useTheme((s) => s.theme)
  const setTheme = useTheme((s) => s.setTheme)

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
  }, [syncFromStorage])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
  }, [theme])

  return <>{children}</>
}
