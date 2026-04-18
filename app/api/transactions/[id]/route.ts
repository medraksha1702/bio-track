import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await request.json()

  const { type, client, category, amount, date, notes } = body

  if (!type || !client || !category || !amount || !date) {
    return NextResponse.json(
      { message: 'Missing required fields: type, client, category, amount, date' },
      { status: 400 }
    )
  }

  if (type !== 'income' && type !== 'expense') {
    return NextResponse.json(
      { message: 'type must be "income" or "expense"' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({ type, client, category, amount, date, notes: notes ?? null })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ message: 'Transaction not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
