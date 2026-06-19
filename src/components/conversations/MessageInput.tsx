"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { HiPaperAirplane, HiPhoto, HiXMark } from "react-icons/hi2"
import toast from "react-hot-toast"

interface MessageInputProps {
  onSend: (message: string, image?: string) => Promise<void>
  onEngage?: () => void
  onTypingStart?: () => void
}

export default function MessageInput({ onSend, onEngage, onTypingStart }: MessageInputProps) {
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const typingThrottleRef = useRef(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const handleResize = () => {
      const diff = window.innerHeight - vv.height
      setKeyboardOffset(Math.max(0, diff))
      if (diff > 100) {
        setTimeout(() => {
          formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }, 100)
      }
    }

    vv.addEventListener("resize", handleResize)
    return () => vv.removeEventListener("resize", handleResize)
  }, [])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
    if (onTypingStart && !typingThrottleRef.current) {
      typingThrottleRef.current = true
      onTypingStart()
      setTimeout(() => { typingThrottleRef.current = false }, 3000)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || isLoading) return
    e.target.value = ""
    setPreviewFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewFile(null)
    setPreviewUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!text.trim() && !previewFile) || isLoading) return

    setIsLoading(true)
    try {
      let imageUrl: string | undefined

      if (previewFile) {
        const formData = new FormData()
        formData.append("file", previewFile)
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) throw new Error("Upload failed")
        const data = await res.json()
        if (!data.url) throw new Error("No URL returned")
        imageUrl = data.url
      }

      await onSend(text.trim(), imageUrl)
      setText("")
      clearPreview()
    } catch (error) {
      toast.error("Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      ref={formRef}
      className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 transition-[padding-bottom]"
      style={keyboardOffset > 0 ? { paddingBottom: `${keyboardOffset}px` } : undefined}
    >
      {previewUrl && (
        <div className="relative mb-3">
          <Image
            src={previewUrl}
            alt="Image preview"
            width={0}
            height={0}
            className="rounded-xl max-w-48 w-full h-auto shadow-sm"
            sizes="192px"
          />
          <button
            type="button"
            onClick={clearPreview}
            className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800/70 text-white hover:bg-gray-800 transition"
            aria-label="Remove image"
          >
            <HiXMark className="h-4 w-4" />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center justify-center h-11 w-11 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
          aria-label="Upload photo"
        >
          <HiPhoto className="h-6 w-6" />
        </button>
        <input
          type="text"
          inputMode="text"
          enterKeyHint="send"
          value={text}
          onChange={handleTextChange}
          onFocus={onEngage}
          placeholder="Type a message"
          disabled={isLoading}
          aria-label="Message text"
          className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2 min-h-[44px] text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
        />
        <button
          type="submit"
          disabled={(!text.trim() && !previewFile) || isLoading}
          className="flex items-center justify-center h-11 w-11 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition disabled:opacity-50"
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <HiPaperAirplane className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  )
}
