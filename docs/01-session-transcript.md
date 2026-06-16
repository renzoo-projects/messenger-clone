# Finance SaaS Platform — Session 1: Design & Planning

**Date:** 2026-06-16

---

## Objective

Build a Finance SaaS Platform following the Code With Antonio tutorial, with one additional feature: Budget Management.

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18
- **API:** Hono.js (inside `app/api/[[...route]]/route.ts`)
- **Database:** PostgreSQL (Neon DB), Drizzle ORM + Drizzle Kit
- **Auth:** Clerk (Core 2) with middleware
- **UI:** TailwindCSS, Shadcn UI, Recharts
- **State:** Tanstack React Query
- **CSV:** `papaparse`
- **Banking:** Plaid Link + Plaid API (sandbox — free in dev)
- **Payments:** Lemon Squeezy (free to start, takes transaction cut)
- **Deploy:** Vercel (hobby tier)
- **Icons:** Lucide React

## Architecture

Standard Next.js single project (not monorepo):

```
finance-platform/
├── app/
│   ├── (dashboard)/        # Dashboard layout + pages
│   │   ├── _layout.tsx     # Sidebar, header, user menu
│   │   ├── page.tsx        # Home — summary cards, charts, budget progress, recent txns
│   │   ├── transactions/   # Full table, search, filters, bulk delete
│   │   ├── budgets/        # Budget list, progress bars, CRUD
│   │   ├── accounts/       # Accounts list, Plaid connect, CSV import
│   │   └── settings/       # User settings, subscription, bank disconnect
│   ├── api/[[...route]]/   # Hono.js API handler
│   ├── sign-in/            # Clerk sign-in
│   ├── sign-up/            # Clerk sign-up
│   └── layout.tsx          # Root layout with ClerkProvider
├── components/
│   ├── ui/                 # Shadcn UI components
│   └── features/           # Feature-specific components
├── db/
│   ├── schema.ts           # Drizzle schema
│   └── index.ts            # DB connection + queries
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities
├── server/                 # Hono.js app instance / route definitions
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts
└── ...
```

## Database Schema

### accounts
| Column | Type | Notes |
|--------|------|-------|
| id | text (uuid) | Primary key |
| name | text | Account name |
| user_id | text | Clerk user ID |
| plaid_id | text | Nullable, Plaid access token |

### categories
| Column | Type | Notes |
|--------|------|-------|
| id | text (uuid) | Primary key |
| name | text | e.g. "Food", "Housing" |
| user_id | text | Nullable — null for seeded defaults |
| plaid_id | text | Nullable |

### transactions
| Column | Type | Notes |
|--------|------|-------|
| id | text (uuid) | Primary key |
| account_id | text | FK → accounts |
| category_id | text | FK → categories |
| amount | integer | In cents (positive = income, negative = expense) |
| payee | text | Merchant name |
| notes | text | Optional |
| date | date | Transaction date |
| user_id | text | Clerk user ID |

### budgets
| Column | Type | Notes |
|--------|------|-------|
| id | text (uuid) | Primary key |
| category_id | text | FK → categories |
| amount_cents | integer | Budget limit in cents |
| period | text (enum) | `daily`, `weekly`, `monthly`, `yearly` |
| start_date | date | When budget period starts |
| end_date | date | Nullable — when budget period ends |
| user_id | text | Clerk user ID |

## API Routes (Hono.js)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/accounts` | List user's accounts |
| POST | `/api/accounts` | Create account |
| DELETE | `/api/accounts/:id` | Delete account |
| GET | `/api/categories` | List categories (defaults + user's) |
| POST | `/api/categories` | Create category |
| DELETE | `/api/categories/:id` | Delete category |
| GET | `/api/transactions` | List with search, filters, pagination |
| POST | `/api/transactions` | Create transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| POST | `/api/transactions/bulk-delete` | Bulk delete by IDs |
| POST | `/api/csv/upload` | Upload + parse CSV, return preview |
| POST | `/api/csv/import` | Confirm import of parsed CSV |
| GET | `/api/budgets` | List user's budgets |
| POST | `/api/budgets` | Create budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |
| GET | `/api/budgets/spending` | Get current spending vs budget per category |
| POST | `/api/plaid/link-token` | Create Plaid Link token |
| POST | `/api/plaid/exchange` | Exchange public token for access token |
| DELETE | `/api/plaid/disconnect` | Disconnect bank account |
| POST | `/api/webhooks/lemon-squeezy` | Handle payment webhooks |

## Budget Management Logic

**Comparison window per period:**
| Period | Window |
|--------|--------|
| daily | Today 00:00 → now |
| weekly | Monday 00:00 → now (calendar week) |
| monthly | 1st 00:00 → now (calendar month) |
| yearly | Jan 1 00:00 → now (calendar year) |

**Color coding (UI):**
- <50% of budget used → green
- 50–80% → yellow
- 80–100% → orange
- >100% → red

## Phased Build Order

### Phase 1: Scaffold + Auth + DB + API
- Project setup with all dependencies (Hono, Drizzle, Clerk, Shadcn, Tanstack Query, Recharts, etc.)
- Clerk auth middleware + sign-in/sign-up pages
- Drizzle schema + migrations
- Hono.js server setup inside API route handler
- ALL CRUD routes for accounts, categories, transactions, budgets
- Seed default categories

### Phase 2: Dashboard UI
- Dashboard layout (sidebar, header, user menu)
- Summary cards (income, expenses, balance)
- Chart with toggleable types (area, bar, pie)
- Account and date range filters
- Recent transactions list
- Budget progress card

### Phase 3: Transactions Page
- Full data table (using Tanstack Table or shadcn table)
- Search input
- Filters: account, category, date range
- Bulk delete with select-all
- Add transaction form (sheet or dialog)
- Edit/delete individual transactions

### Phase 4: Budgets Page
- Budget list with progress bars
- Create/edit/delete budget forms
- Current spending vs budget calculation

### Phase 5: CSV Import
- Upload CSV button
- Parse with papaparse
- Preview table of parsed data
- Column mapping UI (match CSV columns to fields)
- Confirm import → bulk insert

### Phase 6: Plaid Integration
- Plaid Link button in accounts page
- Create link token endpoint
- Exchange public token for access token
- Sync bank transactions
- Disconnect bank

### Phase 7: Lemon Squeezy + Settings
- Subscription plan tiers UI
- Lemon Squeezy checkout integration
- Webhook handler for subscription events
- Settings page (user preferences)
- Manage subscription page
- Bank disconnect from settings

## Service Setup Notes

All services have free tiers (or free in dev mode):
- **Clerk** — Free up to 10K users. Sign up at clerk.com, create app, copy API keys
- **Neon DB** — Free tier (0.5GB storage, compute credits). Sign up at neon.tech
- **Plaid** — Free in sandbox/dev. Requires business for production. Sign up at plaid.com
- **Lemon Squeezy** — Free to start, takes ~5% + $0.50 per transaction. Sign up at lemonsqueezy.com
- **Vercel** — Hobby tier is free
- **Logoipsum** — Free placeholder logos at logoipsum.com

## Key Decisions

1. **Following tutorial closely** — same stack, similar architecture
2. **One additional feature: budget management** — adds `budgets` table, CRUD, progress UI, period-based comparison
3. **Standard Next.js project** (not monorepo) — simpler setup, faster to build
4. **Phase-by-phase delivery** — each phase builds on the previous, deployable at each stage
5. **Drizzle ORM** — type-safe, lightweight, native to PostgreSQL
6. **Tanstack React Query** — server state management, caching, optimistic updates
7. **Amounts stored in cents** (integers) — avoids floating point issues
8. **Positive amounts = income, negative = expense** — simplifies calculations

## Next Session

Start with **Phase 1**: Install dependencies, configure Clerk, set up Drizzle schema + Neon DB, scaffold Hono.js API routes, and seed default categories.
