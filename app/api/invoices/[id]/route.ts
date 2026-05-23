import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { items, ...invoiceFields } = body

  // Fetch current state so we can detect paid/unpaid transitions
  const { data: current, error: fetchErr } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr) return NextResponse.json({ message: fetchErr.message }, { status: 404 })

  const becomingPaid   = invoiceFields.status === 'paid' && current.status !== 'paid'
  const leavingPaid    = invoiceFields.status && invoiceFields.status !== 'paid' && current.status === 'paid'

  // Auto-create income transaction when invoice is marked Paid
  let newTransactionId: string | null = current.transaction_id ?? null

  if (becomingPaid && !current.transaction_id) {
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .insert([{
        type:     'income',
        client:   current.client_name,
        category: 'Invoice Payment',
        amount:   current.total,
        date:     new Date().toISOString().split('T')[0],
        notes:    `Invoice: ${current.invoice_number}`,
      }])
      .select()
      .single()

    if (txErr) return NextResponse.json({ message: txErr.message }, { status: 500 })
    newTransactionId = tx.id
    invoiceFields.transaction_id = newTransactionId
  }

  // Auto-delete the linked income transaction when invoice is un-paid
  if (leavingPaid && current.transaction_id) {
    await supabase.from('transactions').delete().eq('id', current.transaction_id)
    invoiceFields.transaction_id = null
    newTransactionId = null
  }

  // Update invoice fields
  const { data: invoice, error: invoiceErr } = await supabase
    .from('invoices')
    .update(invoiceFields)
    .eq('id', id)
    .select()
    .single()

  if (invoiceErr) return NextResponse.json({ message: invoiceErr.message }, { status: 500 })

  // Replace items if provided
  if (items) {
    await supabase.from('invoice_items').delete().eq('invoice_id', id)
    const itemsWithId = items.map((item: { description: string; quantity: number; unit_price: number; amount: number }) => ({
      invoice_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
    }))
    await supabase.from('invoice_items').insert(itemsWithId)
  }

  // Return updated invoice with items
  const { data: full } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', id)
    .single()

  return NextResponse.json(full ?? invoice)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
