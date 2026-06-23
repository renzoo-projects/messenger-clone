"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import useSettingsModal from "@/hooks/useSettingsModal"
import useLogoutModal from "@/hooks/useLogoutModal"
import { useTheme } from "@/hooks/useTheme"
import {
  HiChatBubbleLeftRight,
  HiUsers,
  HiOutlineSun,
  HiOutlineMoon,
  HiEllipsisHorizontal,
  HiCog6Tooth,
  HiArrowRightOnRectangle,
} from "react-icons/hi2"

export default function MobileFooter() {
  const pathname = usePathname()
  const settingsModal = useSettingsModal()
  const logoutModal = useLogoutModal()
  const { theme, toggle } = useTheme()
  const [showMenu, setShowMenu] = useState(false)

  const isConversations = pathname?.startsWith("/conversations")
  const isUsers = pathname === "/users"

  return (
    <>
      {/* Mobile Footer */}
      <div className="fixed bottom-0 left-0 z-40 w-full bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Primary Navigation */}
          <div className="flex items-center gap-4">
            <Link
              href="/conversations"
              className={`flex flex-col items-center justify-center rounded-lg transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 ${
                 isConversations
                   ? "text-blue-500"
                   : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
               }`}
               aria-current={isConversations ? "page" : undefined}
            >
              <HiChatBubbleLeftRight className="h-6 w-6" />
              <span className="text-[10px] mt-0.5 font-medium">Chats</span>
            </Link>
            <Link
              href="/users"
              className={`flex flex-col items-center justify-center rounded-lg transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 ${
                 isUsers
                   ? "text-blue-500"
                   : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
               }`}
               aria-current={isUsers ? "page" : undefined}
            >
              <HiUsers className="h-6 w-6" />
              <span className="text-[10px] mt-0.5 font-medium">People</span>
            </Link>
          </div>

          {/* Theme Toggle + More Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
className="flex items-center justify-center h-11 w-11 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
               aria-label={
                 theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? (
                <HiOutlineSun className="h-6 w-6" />
              ) : (
                <HiOutlineMoon className="h-6 w-6" />
              )}
            </button>

            {/* More Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
className="flex items-center justify-center h-11 w-11 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
               aria-label="More options"
                aria-expanded={showMenu}
                aria-haspopup="menu"
              >
                <HiEllipsisHorizontal className="h-6 w-6" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div
                  className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <button
                    onClick={() => {
                      settingsModal.onOpen()
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition focus-visible:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-gray-700"
                    role="menuitem"
                  >
                    <HiCog6Tooth className="h-5 w-5" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      logoutModal.onOpen()
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition border-t border-gray-200 dark:border-gray-700 focus-visible:outline-none focus-visible:bg-red-50 dark:focus-visible:bg-red-900/20"
                    role="menuitem"
                  >
                    <HiArrowRightOnRectangle className="h-5 w-5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => setShowMenu(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
