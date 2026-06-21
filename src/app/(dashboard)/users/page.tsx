"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import Avatar from "@/components/ui/Avatar"
import Skeleton from "@/components/ui/Skeleton"
import { SafeUser } from "@/types"
import useUserCache from "@/hooks/useUserCache"

export default function UsersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const getCachedUsers = useUserCache((s) => s.getCached)
  const setCachedUsers = useUserCache((s) => s.setCached)
  const [users, setUsers] = useState<SafeUser[]>(() => getCachedUsers() ?? [])
  const [isLoading, setIsLoading] = useState(() => !getCachedUsers())
  const [creating, setCreating] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false)
      return
    }

    if (fetchedRef.current) return
    fetchedRef.current = true
    const abortController = new AbortController()

    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users", { signal: abortController.signal })
        if (!res.ok) throw new Error("Failed to load users")
        const data = await res.json()
        if (Array.isArray(data)) {
          setUsers(data)
          setCachedUsers(data)
        }
      } catch (err) {
        if (err instanceof DOMException) return
        toast.error("Failed to load users")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
    return () => abortController.abort()
  }, [session?.user?.id, setCachedUsers])

  useEffect(() => {
    if (!session?.user?.id && session !== undefined) {
      router.push("/")
    }
  }, [session, session?.user?.id, router])

  const startConversation = async (userId: string) => {
    setCreating(userId)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) throw new Error("Failed")

      const conversation = await res.json()
      router.push(`/conversations/${conversation.id}`)
    } catch {
      toast.error("Failed to start conversation")
    } finally {
      setCreating(null)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex lg:block">
        <div className="lg:fixed lg:inset-y-0 lg:left-20 lg:z-30 lg:w-80 lg:flex lg:flex-col lg:border-r lg:border-gray-100 dark:lg:border-gray-800 lg:bg-white dark:lg:bg-gray-950 bg-white dark:bg-gray-950 h-full">
          <div className="px-5 py-4 border-b">
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          </div>
          <div className="space-y-2 px-5 py-4" aria-label="Loading users">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col lg:block">
      <div className="flex-1 overflow-y-auto lg:fixed lg:inset-y-0 lg:left-20 lg:z-30 lg:w-80 lg:flex lg:flex-col lg:border-r lg:border-gray-100 dark:lg:border-gray-800 lg:bg-white dark:lg:bg-gray-950 bg-white dark:bg-gray-950">
        <div className="px-5 py-4 border-b">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">People</h2>
        </div>
        <div className="flex-1 overflow-y-auto pb-16 motion-safe:animate-fadeIn">
          {users.map((user, index) => (
            <div
              key={user.id}
              onClick={() => startConversation(user.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  startConversation(user.id)
                }
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors active:scale-[0.98] motion-safe:animate-slideUp"
              role="button"
              tabIndex={0}
              style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}
            >
              <Avatar user={user} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              {creating === user.id && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
              )}
            </div>
          ))}
          {users.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400 text-sm">
              No other users found
            </div>
          )}
        </div>
      </div>
      <div className="hidden lg:block h-full">
          <div className="h-full flex items-center justify-center bg-transparent">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select a person to chat with
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Click on a name to start a conversation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
