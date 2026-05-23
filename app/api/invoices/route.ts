import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .order('issue_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { client_name, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, notes, transaction_id, items } = body

  if (!client_name || !issue_date || !due_date || !items?.length) {
    return NextResponse.json(
      { message: 'Missing required fields: client_name, issue_date, due_date, items' },
      { status: 400 }
    )
  }

  // Generate invoice number: INV-YYYYMM-XXXX
  const now = new Date()
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `${prefix}-%`)
  const seq = String((count ?? 0) + 1).padStart(4, '0')
  const invoice_number = `${prefix}-${seq}`

  // Insert invoice
  const { data: invoice, error: invoiceErr } = await supabase
    .from('invoices')
    .insert([{
      invoice_number,
      client_name,
      status: status ?? 'draft',
      issue_date,
      due_date,
      subtotal: subtotal ?? 0,
      tax_rate: tax_rate ?? 0,
      tax_amount: tax_amount ?? 0,
      total: total ?? 0,
      notes: notes ?? null,
      transaction_id: transaction_id ?? null,
    }])
    .select()
    .single()

  if (invoiceErr) return NextResponse.json({ message: invoiceErr.message }, { status: 500 })

  // Insert line items
  const itemsWithId = items.map((item: { description: string; quantity: number; unit_price: number; amount: number }) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: item.amount,
  }))

  const { data: savedItems, error: itemsErr } = await supabase
    .from('invoice_items')
    .insert(itemsWithId)
    .select()

  if (itemsErr) return NextResponse.json({ message: itemsErr.message }, { status: 500 })

  return NextResponse.json({ ...invoice, invoice_items: savedItems }, { status: 201 })
}
