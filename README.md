# Messenger Clone

A real-time chat application with AI-powered summaries, group conversations, and Messenger-style UX.

## Features

- **Real-time messaging** — Instant send/receive via Pusher Channels with optimistic sending (messages appear immediately)
- **1-on-1 & group chats** — Create private conversations or multi-person groups with names and member management
- **AI summaries** — Auto-triggered on unread conversations or one-click via the sparkles button (powered by Groq/Llama 3.3 70B)
- **Multiple auth providers** — Sign in with Google or email/password via Auth.js v5
- **Image sharing** — Upload images inline via Cloudinary with preview before sending
- **Dark mode** — Toggle between light and dark themes with system preference detection
- **Typing indicators** — See when others are typing in real time
- **Seen receipts** — Double-check marks show when messages are read
- **Online presence** — Green dots indicate active users via Pusher presence channels
- **Text size control** — Choose from Small, Medium, Large, or Extra Large in Settings
- **Responsive design** — Desktop sidebar layout with mobile bottom nav, swipe-to-delete, and pull-to-refresh

## Tech Stack

| Category | Choice |
|----------|--------|
| Framework | Next.js 16 (App Router) |
| Auth | Auth.js v5 (Prisma adapter) |
| Database | MongoDB + Prisma |
| Real-time | Pusher Channels |
| File Uploads | Cloudinary |
| AI Summaries | Groq (Llama 3.3 70B) |
| Styling | Tailwind v4 |
| State Management | Zustand |
| Forms / Validation | react-hook-form + Zod |
| Language | TypeScript |

## Getting Started

### Prerequisites

- Node.js 20+
- A [MongoDB Atlas](https://cloud.mongodb.com) cluster
- A [Pusher](https://dashboard.pusher.com) Channels app
- A [Cloudinary](https://cloudinary.com) account
- A [Groq](https://console.groq.com) API key

### Setup

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MongoDB connection string |
| `NEXTAUTH_SECRET` | Random secret for session encryption |
| `NEXTAUTH_URL` | App URL (`http://localhost:3000` for dev) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_PUSHER_APP_KEY` | Pusher app key (public) |
| `PUSHER_APP_ID` | Pusher app ID |
| `PUSHER_SECRET` | Pusher app secret |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher cluster (e.g. `us2`) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset |
| `GROQ_API_KEY` | Groq API key |

Then install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Authenticated app shell
│   │   ├── conversations/  # Conversation list + chat view
│   │   └── users/          # People directory
│   ├── (site)/           # Landing / auth pages
│   └── api/              # RESTful API routes
├── components/
│   ├── conversations/    # MessageList, MessageInput, SummaryBanner, modals
│   ├── sidebar/          # ConversationList, Sidebar, MobileFooter, SettingsModal
│   ├── providers/        # Auth, Theme, Toast providers
│   └── ui/               # Avatar, Button, Modal, EmptyState, Skeleton
├── hooks/                # Zustand stores + custom hooks
├── lib/                  # Prisma, Pusher, validation utilities
└── types/                # TypeScript type definitions
```

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server |
| `npm run build` | Generate Prisma client + build production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## License

MIT
