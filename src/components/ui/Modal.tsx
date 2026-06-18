"use client"

import { useEffect, useCallback, useRef, useState } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  variant?: "center" | "sheet"
}

export default function Modal({ isOpen, onClose, children, variant = "center" }: ModalProps) {
  const [render, setRender] = useState(false)
  const [active, setActive] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const dragStartY = useRef(0)
  const dragCurrentY = useRef(0)
  const isDragging = useRef(false)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      setRender(true)
      requestAnimationFrame(() => setActive(true))
    } else {
      setActive(false)
      const timer = setTimeout(() => {
        setRender(false)
        dragCurrentY.current = 0
      }, 200)
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

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    if (sheetRef.current && sheetRef.current.scrollTop > 0) return
    dragStartY.current = e.touches[0].clientY
    dragCurrentY.current = 0
    isDragging.current = true
  }

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const delta = e.touches[0].clientY - dragStartY.current
    if (delta < 0) return
    dragCurrentY.current = delta
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`
      sheetRef.current.style.transition = "none"
    }
  }

  const handleSheetTouchEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    if (dragCurrentY.current > 80) {
      if (sheetRef.current) {
        sheetRef.current.style.transform = ""
        sheetRef.current.style.transition = ""
      }
      onClose()
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transform = ""
        sheetRef.current.style.transition = "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)"
      }
    }
  }

  if (!render) return null

  if (variant === "sheet") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          ref={(node) => {
            dialogRef.current = node
            sheetRef.current = node
          }}
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
          className={`relative z-10 w-full max-w-lg max-h-[85dvh] bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl flex flex-col transition-transform duration-300 ease-out ${active ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
          <div className="overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    )
  }

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
