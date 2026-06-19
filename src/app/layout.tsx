import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import AuthProvider from "@/components/providers/AuthProvider"
import ThemeProvider from "@/components/providers/ThemeProvider"
import ToastProvider from "@/components/providers/ToastProvider"
import ActiveStatus from "@/components/ActiveStatus"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Messenger Clone",
  description: "Real-time chat application",
  openGraph: {
    title: "Messenger Clone",
    description: "Real-time chat application",
    type: "website",
    siteName: "Messenger Clone",
  },
  twitter: {
    card: "summary",
    title: "Messenger Clone",
    description: "Real-time chat application",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={geist.className} suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-950">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <ThemeProvider>
            {children}
            <ActiveStatus />
            <ToastProvider />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
