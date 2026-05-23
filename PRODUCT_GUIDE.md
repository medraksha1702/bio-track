# k² Biomedical Finance Tracking — Product Guide

**Live app:** https://bio-track-tan.vercel.app/

---

## What We Built

A full-stack biomedical finance tracking application for **k² Enterprise** — a biomedical equipment service and support business. The app covers the complete money lifecycle: recording income and expenses, creating and sending professional invoices, tracking payments, and exporting reports.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| State / API | RTK Query (`@reduxjs/toolkit/query`) |
| Styling | Tailwind CSS v4 with oklch color variables |
| Animations | Framer Motion |
| PDF generation | jsPDF + jspdf-autotable |
| Deployment | Vercel |

---

## Pages & Features

### Dashboard `/`
- KPI cards: Total Income, Total Expenses, Net Profit, Transaction Count
- Income vs Expense bar chart
- Expense breakdown pie chart
- Monthly profit trend chart
- Recent transactions table (last 5)
- Export panel: CSV and PDF of all filtered data
- Date range filter applies to **all charts and cards simultaneously**

### Income `/income`
- Add income form (client, category, amount, date, notes)
- Income table with pagination
- **"From Invoice" badge** on rows where income was auto-created from a paid invoice
- **Create Invoice button** per row — pre-fills the invoice form with income data
  - If an invoice already exists for that entry, the button is replaced with a status badge (paid / sent / draft / overdue) and a tooltip showing the invoice number

### Expenses `/expenses`
- Add expense form
- Expense table with date range filter

### Transactions `/transactions`
- Combined view of all income + expense transactions
- Summary cards: Total Income, Total Expenses, Net Total (filtered)
- Import CSV dialog for bulk data entry
- Full transaction table with pagination

### Billing `/billing`
- **Billing stats row**: Total Billed, Paid, Pending, Overdue
- **Create Invoice form** with:
  - Auto-generated invoice number (`INV-YYYYMM-NNNN`)
  - Line items (description, qty, unit price — amount auto-calculated)
  - Tax rate with auto-computed tax amount and total
  - Notes field
- **Invoice table** with:
  - Status filter (All / Draft / Sent / Paid / Overdue)
  - Inline status change dropdown per row
  - ✓ icon when income is auto-linked (tooltip: "Income recorded automatically")
  - Download PDF button per row
  - View detail dialog
  - Delete with confirmation

### Reports `/reports`
- Profit trend chart for selected period
- Export panel: CSV and PDF download

### Settings `/settings`
- Profile editing (name)
- Notification preferences
- Fiscal year setting
- Category management
- Customer management
- Export all transactions as CSV

---

## Core Flows

### Flow 1 — Direct Income Entry
```
Income page → Add Income form → Submit
→ Transaction saved → Appears in income table
```
Use this for cash payments, bank transfers, or any income that doesn't need a formal invoice.

> ⚠️ A warning banner at the top of the income form says:
> *"Need to send a bill first? Use Billing → Create Invoice instead. Marking the invoice as Paid will record income automatically."*

---

### Flow 2 — Invoice → Payment → Auto Income (recommended for billable work)
```
Billing page → Create Invoice → Set status to Sent
→ Client pays → Change status to Paid
→ Income transaction created automatically (no double-entry)

If later un-marked as Paid → income transaction deleted automatically
```
This is the primary flow for biomedical service billing. You never touch the income page for invoiced work.

---

### Flow 3 — Create Invoice from Existing Income Entry
```
Income page → Find the row → Click Receipt icon
→ Invoice form pre-filled with: client name, date, category as line item, amount
→ Submit → Invoice created and linked to that transaction
```
Useful when you've already recorded income but realise you need to issue a formal invoice retroactively.

---

### Flow 4 — PDF Invoice Download
```
Billing page → Invoice row → Download icon (or View → Download PDF)
→ Professional PDF generated client-side (no server needed)
```

The PDF includes:
- **Header bar**: K² ENTERPRISE branding
- **Company info**: address, phone, email, website
- **TAX INVOICE box**: invoice number, date, due date, service type
- **BILL TO**: hospital/lab name (pre-filled), contact, mobile, address fields
- **Equipment Details**: blank table for manual filling
- **Service Details**: populated from invoice line items (padded to 3 rows minimum)
- **Payment Summary**: subtotal, GST, total
- **Payment Details**: UPI, bank name, account no., IFSC (blank fields)
- **Terms & Conditions**: 4 standard clauses
- **Signature**: customer signature + Kaushik Koshti / K² Enterprise
- **Footer**: teal bar with company tagline

---

## Key Design Decisions & Problems Resolved

### 1. No double-counting income
**Problem:** If you create an invoice AND add an income entry for the same payment, you'd count the money twice.

**Solution:** The `invoices` table has a `transaction_id` column. When an invoice is marked Paid:
- The API auto-creates an income transaction and stores its ID in `transaction_id`
- If the invoice is un-paid, the linked transaction is auto-deleted
- The income form shows a warning directing users to Billing for billable work

### 2. Invoice status reflected on income table
**Problem:** After creating an invoice from an income row, the button still showed "Create Invoice", tempting duplicate creation.

**Solution:** The income table fetches all invoices and builds a `transaction_id → invoice` map. If a match exists, the button is replaced with the invoice's status badge + tooltip with the invoice number.

### 3. Consistent date filtering across all pages
- Default filter changed from "All Time" to **"This Month"** on every page
- All pages with a date filter show: `Showing data for: This Month (May 1 – May 31, 2026)`
- Controlled from a single constant: `DEFAULT_FILTER` in `lib/date-filters.ts`

### 4. PDF content overlap
**Problem:** All sections (header, tables, payment summary, terms, signature) exceeded the page height, causing sections to print over the footer.

**Root cause:** `cellPadding: {top:4.5, bottom:4.5}` in jspdf-autotable made each row ~12 mm tall; combined section heights exceeded 281 mm (A4 minus 16 mm footer).

**Fix:** Reduced cellPadding to `{top:3, bottom:3}`, tightened all section box heights, fixed a `hLine()` call that was drawing a full-width teal line through the company name text on the left column.

### 5. Design consistency across pages
All pages now share:
- `p-6 md:p-8` padding
- `max-w-7xl` container width
- `lg:grid-cols-4` (1 col form + 3 col table) for Income, Expenses, Billing
- Consistent "Showing data for:" label below the date filter on every filtered page

---

## Database Schema (Supabase)

### `transactions`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| type | text | `income` or `expense` |
| client | text | |
| category | text | |
| amount | numeric | |
| date | date | |
| notes | text | |
| created_at | timestamptz | |

### `invoices`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| invoice_number | text | Unique, format `INV-YYYYMM-NNNN` |
| client_name | text | |
| status | text | `draft` / `sent` / `paid` / `overdue` |
| issue_date | date | |
| due_date | date | |
| subtotal | numeric | |
| tax_rate | numeric | |
| tax_amount | numeric | |
| total | numeric | |
| notes | text | |
| transaction_id | uuid | FK → transactions (auto-managed) |
| created_at | timestamptz | |

### `invoice_items`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| invoice_id | uuid | FK → invoices (CASCADE DELETE) |
| description | text | |
| quantity | numeric | |
| unit_price | numeric | |
| amount | numeric | qty × unit_price |

All tables use **Row Level Security** — each user only sees their own data.

---

## Branding

| Token | Value | Use |
|---|---|---|
| Dark Teal | `#006D6F` | Primary colour, buttons, active states |
| Deep Teal | `#004B4D` | Section headers in PDF, sidebar |
| Silver Gray | `#BFC5C7` | Borders, dividers |
| Soft White | `#F8FAFA` | Page background |
| Charcoal | `#1F2933` | Body text |

Logo: K² mark with teal K, silver swoosh — stored at `public/logo.png`.

---

## Scripts

```bash
# Run database migration (creates transactions + billing schema)
npx tsx scripts/migrate.ts

# One-time backfill: creates paid invoices for all existing income entries
npx tsx scripts/backfill-invoices.ts

# Development server
npm run dev

# Build for production
npm run build
```
