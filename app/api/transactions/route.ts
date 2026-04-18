import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
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
    .insert([{ type, client, category, amount, date, notes: notes ?? null }])
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data, { status: 201 })
}
