import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const limit = searchParams.get('limit')
  const cursor = searchParams.get('cursor') // ISO timestamp for cursor-based pagination

  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)
  
  // Cursor-based pagination: fetch records older than cursor
  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  // Apply limit (default 50, max 100)
  const pageSize = limit ? Math.min(parseInt(limit, 10), 100) : 50
  query = query.limit(pageSize)

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    )
  }

  // Return data with pagination metadata
  const hasMore = data.length === pageSize
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].created_at : null

  return NextResponse.json({
    data,
    pagination: {
      hasMore,
      nextCursor,
      count: data.length,
    },
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const { type, client, category, amount, date, notes, attachment_url, attachment_name, attachment_size, attachment_type } = body

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
    .insert([{ 
      type, 
      client, 
      category, 
      amount, 
      date, 
      notes: notes ?? null,
      attachment_url: attachment_url ?? null,
      attachment_name: attachment_name ?? null,
      attachment_size: attachment_size ?? null,
      attachment_type: attachment_type ?? null,
    }])
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
