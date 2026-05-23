# k² Biomedical — Finance Tracking App
### User Guide

**App link:** https://bio-track-tan.vercel.app/

---

## What This App Does

The k² Biomedical Finance Tracker helps you manage all money coming in and going out of your business — in one place. You can record income, track expenses, create professional invoices, monitor payment status, and download reports — all without spreadsheets.

---

## Pages at a Glance

| Page | What it's for |
|---|---|
| **Dashboard** | Summary of your financial health for the selected period |
| **Income** | Record and review all income received |
| **Expenses** | Record and review all business expenses |
| **Transactions** | See everything (income + expenses) in one list |
| **Billing** | Create invoices, track payment status, download PDFs |
| **Reports** | Profit trend chart + export data |
| **Settings** | Update your profile, categories, and preferences |

---

## How to Use Each Feature

### Dashboard
- Shows your **Total Income**, **Total Expenses**, **Net Profit**, and **Transaction Count** for the selected period.
- Charts show income vs expense trends, expense breakdown by category, and monthly profit.
- Use the date filter at the top to change the period (e.g., This Month, Last Quarter, All Time).
- The **Export** panel lets you download all filtered data as a **CSV** (spreadsheet) or **PDF** report.

---

### Recording Income

Go to **Income** → fill in the form on the left:
- **Client**: who paid you
- **Category**: type of income (e.g., Service, Repair)
- **Amount**: how much was received
- **Date**: when you received it
- **Notes**: any extra detail

> **Tip:** If you need to send a formal invoice first, go to **Billing** instead. When you mark the invoice as Paid, the income is recorded automatically — so you don't need to add it here separately.

---

### Recording Expenses

Go to **Expenses** → fill in the form on the left:
- **Vendor / Payee**: who you paid
- **Category**: type of expense (e.g., Parts, Travel, Tools)
- **Amount** and **Date**

---

### Billing & Invoices

#### Creating an Invoice
Go to **Billing** → fill in the **Create Invoice** form:
1. Enter the **client name** and **issue / due dates**
2. Add **line items** — each service or part with quantity and unit price (amounts calculate automatically)
3. Set a **tax rate** if applicable (total updates automatically)
4. Add any **notes** for the client
5. Click **Create Invoice**

The invoice is assigned a number automatically (e.g., `INV-202605-0001`).

#### Invoice Statuses
| Status | Meaning |
|---|---|
| **Draft** | Created but not yet sent to client |
| **Sent** | Sent to client, awaiting payment |
| **Paid** | Payment received — income recorded automatically |
| **Overdue** | Past due date, not yet paid |

To update the status, click the status badge on the invoice row and select the new status.

> When you mark an invoice as **Paid**, an income entry is created automatically. If you later change it back to Unpaid, that income entry is removed — so your records stay accurate with no double-counting.

#### Downloading an Invoice PDF
Click the **download icon** on any invoice row (or open the invoice and click **Download PDF**).

The PDF includes:
- Your company header (K² Enterprise)
- TAX INVOICE with invoice number, date, and due date
- Bill To section
- Equipment and service details table
- Payment summary (subtotal, GST, total)
- Payment details (UPI, bank info)
- Terms & conditions
- Signature block (Kaushik Koshti / K² Enterprise)

---

### Creating an Invoice from an Income Entry

If you have already recorded income but need to issue a formal invoice for it:
1. Go to **Income**
2. Find the row → click the **receipt icon** on the right
3. The invoice form opens pre-filled with the client name, date, and amount
4. Adjust as needed and submit

Once an invoice exists for an income entry, the receipt icon is replaced with the **invoice status badge** — so you always know whether a formal invoice has been raised.

---

### Transactions

The **Transactions** page shows every income and expense in one combined list. Use it to:
- Search across all activity for a period
- See running totals (Total Income, Total Expenses, Net)
- Import transactions in bulk using **Import CSV**

---

### Reports

Go to **Reports** to:
- View a **monthly profit chart** for the selected period
- Download a **CSV** or **PDF** of all transactions in that period

---

### Date Filtering

Every page with financial data has a **date range filter** at the top. The default is **This Month**. Options:

| Filter | What it shows |
|---|---|
| All Time | Everything ever recorded |
| This Month | Current calendar month |
| Last Month | Previous calendar month |
| This Quarter | Current 3-month quarter |
| Last Quarter | Previous 3-month quarter |
| This Year | January to December of current year |
| Custom Range | Pick any start and end date |

The selected period and its exact dates are shown below the filter:
> *Showing data for: This Month (May 1 – May 31, 2026)*

---

## Key Rules to Remember

1. **Invoice paid = income auto-recorded.** You don't need to add it manually on the Income page.
2. **Manual income = no invoice.** Use this only for payments received without a formal invoice (e.g., cash sales).
3. **Never add the same payment twice** — either use Billing (invoice route) or Income (direct entry), not both.
4. **Invoice numbers are assigned automatically** — you cannot change them.
5. **Deleting an invoice** removes it permanently. If it was marked Paid, the linked income entry is also removed.

---

## Branding

The app uses the k² Biomedical colour palette:
- **Dark Teal** — primary buttons and highlights
- **Deep Teal** — section headers
- **Silver Gray** — borders and secondary elements
- **Soft White** — page backgrounds
- **Charcoal** — body text

---

*For technical support or feature requests, contact the development team.*
