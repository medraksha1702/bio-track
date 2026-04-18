# MediLedger — Biomedical Finance Tracking

A full-featured financial dashboard for biomedical businesses to track income, expenses, profit, and analytics. Built with **Next.js 16**, **React 19**, **Redux Toolkit + RTK Query**, and a rich UI component library.

---

## Features

- **Dashboard** — Overview cards (Total Income, Expenses, Profit, Margin), profit trend chart, expense breakdown pie chart, and recent transactions table
- **Income** — Add income entries via form and view all income transactions in a table
- **Expenses** — Add expense entries via form and view all expense transactions in a table
- **Transactions** — Complete list of all transactions with summary cards
- **Reports** — YTD financial summary cards and downloadable report history
- **Real-time data** — All data fetched from backend APIs using RTK Query with automatic cache invalidation
- **Loading & error states** — Skeleton loaders, empty states, and inline error banners throughout

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| State Management | Redux Toolkit |
| API Layer | RTK Query |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + shadcn-style primitives |
| Charts | Recharts |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| Language | TypeScript 5.7 |

---

## Project Structure

```
bio_track/
├── app/
│   ├── layout.tsx                        # Root layout with Redux Provider
│   ├── globals.css
│   ├── api/
│   │   └── transactions/
│   │       ├── route.ts                  # GET + POST /api/transactions
│   │       └── summary/
│   │           └── route.ts             # GET /api/transactions/summary
│   └── (dashboard)/
│       ├── layout.tsx                    # Dashboard shell (sidebar + header)
│       ├── page.tsx                      # Dashboard home
│       ├── income/page.tsx               # Income management
│       ├── expenses/page.tsx             # Expense management
│       ├── transactions/page.tsx         # All transactions
│       ├── reports/page.tsx              # Reports & analytics
│       └── settings/page.tsx             # Settings
├── components/
│   ├── providers.tsx                     # Redux store provider
│   ├── summary-cards.tsx                 # KPI summary cards
│   ├── transactions-table.tsx            # Transactions data table
│   ├── income-table.tsx                  # Income data table
│   ├── expense-table.tsx                 # Expense data table
│   ├── income-form.tsx                   # Add income form
│   ├── expense-form.tsx                  # Add expense form
│   ├── profit-chart.tsx                  # Area chart
│   ├── expense-pie-chart.tsx             # Pie chart
│   ├── dashboard-header.tsx              # Page header
│   ├── app-sidebar.tsx                   # Navigation sidebar
│   └── ui/                               # Reusable UI primitives
├── lib/
│   ├── services/
│   │   └── api.ts                        # RTK Query API service
│   ├── store.ts                          # Redux store configuration
│   ├── supabase.ts                       # Supabase client
│   ├── data.ts                           # Types & static category lists
│   ├── animations.ts                     # Framer Motion variants
│   └── utils.ts                          # Utility helpers
├── supabase/
│   ├── schema.sql                        # Database table + RLS policies
│   └── seed.sql                          # Sample data
├── hooks/
│   ├── use-toast.ts
│   └── use-mobile.ts
└── .env.local                            # Supabase credentials (not committed)
```

---


## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A free **Supabase** account at [supabase.com](https://supabase.com)

---

### Step 1 — Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in
2. Click **New Project**, give it a name (e.g. `mediledger`), choose a region, set a database password, and click **Create project**
3. Wait ~1 minute for the project to spin up

---

### Step 2 — Create the Database Table

1. In your Supabase project, open the **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the contents of `supabase/schema.sql` and click **Run**
4. *(Optional)* To populate sample data, run `supabase/seed.sql` the same way

---

### Step 3 — Get Your API Credentials

1. In your Supabase project, go to **Settings → API**
2. Copy your **Project URL** and **anon / public** key

---

### Step 4 — Configure Environment Variables

Open `.env.local` at the project root and replace the placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 5 — Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> If port 3000 is busy, Next.js will auto-assign the next available port (e.g. 3002). Check your terminal output.

**Production build:**

```bash
npm run build
npm run start
```

**Lint:**

```bash
npm run lint
```

---

## Database Schema

The `transactions` table in Supabase:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `date` | DATE | Transaction date |
| `type` | TEXT | `'income'` or `'expense'` |
| `category` | TEXT | Business category |
| `amount` | NUMERIC(12,2) | Positive amount |
| `client` | TEXT | Client or vendor name |
| `notes` | TEXT (nullable) | Optional notes |
| `created_at` | TIMESTAMPTZ | Auto-generated timestamp |

The full SQL is in `supabase/schema.sql`. Sample data is in `supabase/seed.sql`.

---

## API Routes

The app uses **Next.js Route Handlers** as the API layer — no separate server needed.

| Method | Route | Handler file | Description |
|--------|-------|-------------|-------------|
| `GET` | `/api/transactions` | `app/api/transactions/route.ts` | Fetch all transactions |
| `POST` | `/api/transactions` | `app/api/transactions/route.ts` | Create a transaction |
| `GET` | `/api/transactions/summary` | `app/api/transactions/summary/route.ts` | Total income, expense & profit |

---

## How RTK Query Works in This Project

```
Redux Store (lib/store.ts)
    └── bioTrackApi reducer + middleware

RTK Query Endpoints (lib/services/api.ts)
    ├── useGetTransactionsQuery   →  GET /transactions
    ├── useAddTransactionMutation →  POST /transactions
    └── useGetSummaryQuery        →  GET /transactions/summary

Cache Invalidation
    └── addTransaction invalidates ['Transaction', 'Summary']
        → Tables and summary cards auto-refetch on new entry
```

### Components and their hooks

| Component | Hook Used |
|-----------|-----------|
| `SummaryCards` | `useGetSummaryQuery` |
| `TransactionsTable` | `useGetTransactionsQuery` |
| `IncomeTable` | `useGetTransactionsQuery` (filtered by `type='income'`) |
| `ExpenseTable` | `useGetTransactionsQuery` (filtered by `type='expense'`) |
| `IncomeForm` | `useAddTransactionMutation` |
| `ExpenseForm` | `useAddTransactionMutation` |
| `transactions/page.tsx` | `useGetSummaryQuery` |
| `reports/page.tsx` | `useGetSummaryQuery` |
