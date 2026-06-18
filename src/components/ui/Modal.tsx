"use client"

import { useEffect, useCallback, useRef, useState } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  const [render, setRender] = useState(false)
  const [active, setActive] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      setRender(true)
      requestAnimationFrame(() => setActive(true))
    } else {
      setActive(false)
      const timer = setTimeout(() => setRender(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    const timer = setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        ?.focus()
    }, 50)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
      previousFocusRef.current?.focus()
    }
  }, [isOpen, handleKeyDown])

  if (!render) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className={`relative z-10 w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-xl transition-all duration-200 ${active ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        {children}
      </div>
    </div>
  )
}
