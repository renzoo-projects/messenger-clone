"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import MobileFooter from "./MobileFooter"
import Avatar from "@/components/ui/Avatar"
import useSettingsModal from "@/hooks/useSettingsModal"
import useLogoutModal from "@/hooks/useLogoutModal"
import LogoutModal from "./LogoutModal"
import { HiUsers, HiArrowRightOnRectangle, HiCog6Tooth, HiOutlineSun, HiOutlineMoon, HiChatBubbleLeftRight } from "react-icons/hi2"
import { useTheme } from "@/hooks/useTheme"

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const settingsModal = useSettingsModal()
  const logoutModal = useLogoutModal()
  const { theme, toggle } = useTheme()

  const isConversationPage = pathname?.startsWith("/conversations")
  const isUsersPage = pathname === "/users"

  return (
    <>
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-20 lg:flex lg:flex-col lg:overflow-y-auto lg:border-r lg:border-gray-100 dark:lg:border-gray-800 lg:bg-white dark:lg:bg-gray-950 lg:pb-4">
        <div className="flex flex-col items-center gap-y-2 mt-4">
          <div className="group relative">
            <Link
              href="/conversations"
              className={`flex items-center justify-center h-12 w-12 rounded-full transition ${
                isConversationPage
                  ? "bg-blue-500 text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <HiChatBubbleLeftRight className="h-6 w-6" />
            </Link>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Chats
            </span>
          </div>
          <div className="group relative">
            <Link
              href="/users"
              className={`flex items-center justify-center h-12 w-12 rounded-full transition ${
                isUsersPage
                  ? "bg-blue-500 text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <HiUsers className="h-6 w-6" />
            </Link>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              People
            </span>
          </div>
        </div>
        <div className="mt-auto flex flex-col items-center gap-y-2">
          <div className="group relative">
            <button
              onClick={toggle}
              className="flex items-center justify-center h-12 w-12 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <HiOutlineSun className="h-6 w-6" />
              ) : (
                <HiOutlineMoon className="h-6 w-6" />
              )}
            </button>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </span>
          </div>
          <div className="group relative">
            <button
              onClick={() => settingsModal.onOpen()}
              className="flex items-center justify-center h-12 w-12 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Settings"
            >
              <HiCog6Tooth className="h-6 w-6" />
            </button>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Settings
            </span>
          </div>
          <div className="group relative">
            <button
              onClick={() => logoutModal.onOpen()}
              className="flex items-center justify-center h-12 w-12 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Sign out"
            >
              <HiArrowRightOnRectangle className="h-6 w-6" />
            </button>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Sign out
            </span>
          </div>
          <div className="mb-4">
            <Avatar user={session?.user} />
          </div>
        </div>
      </div>
      <LogoutModal />
      <MobileFooter />
    </>
  )
}
