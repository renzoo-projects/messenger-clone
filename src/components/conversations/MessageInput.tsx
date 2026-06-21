"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { HiPaperAirplane, HiPhoto, HiXMark } from "react-icons/hi2"
import toast from "react-hot-toast"

interface Attachment {
  id: string
  file: File
  url: string
}

interface MessageInputProps {
  onSend: (message: string, images?: string[]) => Promise<void>
  onEngage?: () => void
  onTypingAction?: (action: "start" | "stop") => void
}

export default function MessageInput({ onSend, onEngage, onTypingAction }: MessageInputProps) {
  const [text, setText] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const typingThrottleRef = useRef(false)
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      attachments.forEach((a) => URL.revokeObjectURL(a.url))
    }
  }, [])

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
    if (onTypingAction && !typingThrottleRef.current) {
      typingThrottleRef.current = true
      onTypingAction("start")
      setTimeout(() => { typingThrottleRef.current = false }, 3000)
    }
    if (onTypingAction) {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
      typingStopTimerRef.current = setTimeout(() => {
        onTypingAction("stop")
        typingStopTimerRef.current = undefined
      }, 3000)
    }
  }

  const handleBlur = () => {
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
    if (onTypingAction) onTypingAction("stop")
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    e.target.value = ""

    const newAttachments = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }))
    setAttachments((prev) => [...prev, ...newAttachments])
  }

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const item = prev.find((a) => a.id === id)
      if (item) URL.revokeObjectURL(item.url)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const clearAttachments = useCallback(() => {
    attachments.forEach((a) => URL.revokeObjectURL(a.url))
    setAttachments([])
  }, [attachments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() && attachments.length === 0) return

    const messageText = text.trim()
    const currentAttachments = attachments

    setText("")
    clearAttachments()

    try {
      const uploadPromises = currentAttachments.map(async (att) => {
        const formData = new FormData()
        formData.append("file", att.file)
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) throw new Error("Upload failed")
        const data = await res.json()
        if (!data.url) throw new Error("No URL returned")
        return data.url
      })

      const imageUrls = await Promise.all(uploadPromises)

      await onSend(messageText, imageUrls.length > 0 ? imageUrls : undefined)
      if (onTypingAction) onTypingAction("stop")
    } catch {
      toast.error("Failed to send message")
    }
  }

  return (
    <div
      ref={formRef}
      className="sticky bottom-0 bg-transparent px-4 pt-2 transition-[padding-bottom]"
      style={keyboardOffset > 0 ? { paddingBottom: `${keyboardOffset}px` } : undefined}
    >
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div key={att.id} className="relative w-36 h-36">
              <Image
                src={att.url}
                alt="Image preview"
                fill
                className="rounded-xl object-cover shadow-sm"
                sizes="144px"
              />
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800/70 text-white hover:bg-gray-800/90 transition"
                aria-label="Remove image"
              >
                <HiXMark className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-3 py-2 shadow-elevated dark:shadow-elevated-dark border border-gray-100 dark:border-gray-800">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center h-11 w-11 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
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
          onBlur={handleBlur}
          placeholder="Type a message"
          aria-label="Message text"
          className="flex-1 rounded-full border-0 bg-gray-100 dark:bg-gray-800 px-4 py-2 min-h-[44px] text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() && attachments.length === 0}
          className="flex items-center justify-center h-11 w-11 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
          aria-label="Send message"
        >
          <HiPaperAirplane className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}
