# Messenger Clone

A real-time messaging application built with Next.js 16.

## What This Does

Lets you send messages in real time with other users. Sign in with Google, GitHub, or email/password. Create conversations, send text and images, and get AI-powered summaries of recent messages. Features dark mode, seen indicators, and a Messenger-style UX.

## Tech Stack

| Category | Choice |
|----------|--------|
| Framework | Next.js 16 (App Router) |
| Auth | Auth.js v5 |
| Database | MongoDB + Prisma |
| Real-time | Pusher |
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

## How It Works

- **Auth**: Auth.js v5 with Prisma adapter — credentials, Google, and GitHub providers.
- **Real-time**: Messages and conversation updates fire Pusher events. Each user has a private channel for notifications.
- **API routes**: RESTful handlers under `/api` for conversations, messages, uploads, seen state, and AI summaries.
- **Server components**: Page shell is server-rendered with `auth()`. Client components handle interactivity (messaging, forms, image previews).
- **Middleware**: Lightweight JWT check via `next-auth/jwt` — redirects unauthenticated users to the landing page. No Prisma dependency in Edge runtime.
- **AI summaries**: `POST /api/conversations/[id]/summarize` fetches the last 20 messages and sends them to Groq's Llama 3.3 70B for bullet-point summarization.
- **Images**: Rendered at natural aspect ratio outside message bubbles (Messenger-style). Image preview in input before sending.

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server |
| `npm run build` | Generate Prisma client + build production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## License

MIT
