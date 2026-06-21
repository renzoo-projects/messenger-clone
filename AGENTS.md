# Messenger Clone — Real-Time Chat Application

This is a real-time messenger clone built with Next.js 16, Auth.js v5, MongoDB + Prisma, Pusher, and Cloudinary.

## Key Conventions

- **Next.js 16** — App Router, async params (`await params`)
- **Auth.js v5** — `next-auth` package, `auth()` instead of `getServerSession()`
- **Prisma + MongoDB** — document-based schema, no migrations needed for MongoDB adapter
- **Pusher** — real-time events for messages, conversations, goals
- **Tailwind v4** — CSS-first config, no `tailwind.config.js`
- **Server Components by default** — use `"use client"` only when needed
- **Zustand** — client-side state management
- **react-hook-form** — form validation/handling
- **react-hot-toast** — toast notifications
