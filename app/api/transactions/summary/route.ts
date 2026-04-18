import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  let query = supabase.from('transactions').select('type, amount')

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    )
  }

  const totalIncome = (data ?? [])
    .filter((t) => t.type === 'income')
    .reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0)

  const totalExpense = (data ?? [])
    .filter((t) => t.type === 'expense')
    .reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0)

  const profit = totalIncome - totalExpense

  return NextResponse.json({ totalIncome, totalExpense, profit })
}
