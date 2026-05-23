import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  // 1. Fetch all income transactions
  const { data: incomes, error: incomeErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('type', 'income')
    .order('date', { ascending: true })

  if (incomeErr) return NextResponse.json({ message: incomeErr.message }, { status: 500 })
  if (!incomes?.length) return NextResponse.json({ created: 0, skipped: 0 })

  // 2. Fetch transaction_ids already linked to an invoice (already covered)
  const { data: existingInvoices } = await supabase
    .from('invoices')
    .select('transaction_id')
    .not('transaction_id', 'is', null)

  const coveredIds = new Set((existingInvoices ?? []).map((i) => i.transaction_id))

  const pending = incomes.filter((t) => !coveredIds.has(t.id))
  if (!pending.length) return NextResponse.json({ created: 0, skipped: incomes.length })

  // 3. Calculate starting invoice sequence for today's prefix
  const now = new Date()
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const { count: existing } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `${prefix}-%`)

  let seq = (existing ?? 0) + 1

  // 4. Create an invoice + items for each pending income
  let created = 0
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

    if (invErr) continue // skip on error, best-effort

    await supabase.from('invoice_items').insert([{
      invoice_id:  invoice.id,
      description: income.category,
      quantity:    1,
      unit_price:  income.amount,
      amount:      income.amount,
    }])

    seq++
    created++
  }

  return NextResponse.json({ created, skipped: incomes.length - created })
}
