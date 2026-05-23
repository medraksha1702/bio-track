/**
 * One-time script: create a paid invoice for every existing income transaction
 * that doesn't already have one linked.
 *
 * Run with:
 *   npx tsx scripts/backfill-invoices.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = 'https://mepniegwjfkpeiiqfmgu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lcG5pZWd3amZrcGVpaXFmbWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTk2MTQsImV4cCI6MjA5MTczNTYxNH0.mNA0l98cVZwVyMLqwStZhBN5TulcBJtud7hUGAk1lBE'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  console.log('Fetching all income transactions...')

  const { data: incomes, error: incomeErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('type', 'income')
    .order('date', { ascending: true })

  if (incomeErr) { console.error('Failed to fetch incomes:', incomeErr.message); process.exit(1) }
  if (!incomes?.length) { console.log('No income transactions found.'); return }

  console.log(`Found ${incomes.length} income transaction(s).`)

  // Find which income IDs are already linked to an invoice
  const { data: existing } = await supabase
    .from('invoices')
    .select('transaction_id')
    .not('transaction_id', 'is', null)

  const covered = new Set((existing ?? []).map((r) => r.transaction_id))
  const pending = incomes.filter((t) => !covered.has(t.id))

  if (!pending.length) {
    console.log('All income entries already have invoices. Nothing to do.')
    return
  }

  console.log(`Creating invoices for ${pending.length} income(s) (${covered.size} already covered)...`)

  // Determine starting invoice sequence for today's prefix
  const now    = new Date()
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const { count: existingCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `${prefix}-%`)

  let seq     = (existingCount ?? 0) + 1
  let created = 0
  let failed  = 0

  for (const income of pending) {
    const invoice_number = `${prefix}-${String(seq).padStart(4, '0')}`

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert([{
        invoice_number,
        client_name:    income.client,
        status:         'paid',
        issue_date:     income.date,
        due_date:       income.date,
        subtotal:       income.amount,
        tax_rate:       0,
        tax_amount:     0,
        total:          income.amount,
        notes:          income.notes ?? null,
        transaction_id: income.id,
      }])
      .select()
      .single()

    if (invErr) {
      console.error(`  ✗ ${invoice_number} (${income.client}) — ${invErr.message}`)
      failed++
      continue
    }

    const { error: itemErr } = await supabase
      .from('invoice_items')
      .insert([{
        invoice_id:  invoice.id,
        description: income.category,
        quantity:    1,
        unit_price:  income.amount,
        amount:      income.amount,
      }])

    if (itemErr) {
      console.error(`  ✗ Line item for ${invoice_number} — ${itemErr.message}`)
    }

    console.log(`  ✓ ${invoice_number} — ${income.client} — ₹${income.amount}`)
    seq++
    created++
  }

  console.log(`\nDone. Created: ${created}  Failed: ${failed}  Skipped (already had invoice): ${covered.size}`)
}

main()
