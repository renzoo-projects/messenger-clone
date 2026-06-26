"use client"

import { useEffect } from "react"
import { HiXMark } from "react-icons/hi2"

export default function ImagePreview({
  src,
  onClose,
}: {
  src: string | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!src) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [src, onClose])

  if (!src) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 motion-safe:animate-fadeIn"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex items-center justify-center h-11 w-11 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Close preview"
      >
        <HiXMark className="h-6 w-6" />
      </button>
      <img
        src={src}
        alt="Image preview"
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
