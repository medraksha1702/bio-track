import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') // 'income' | 'expense' | null

  let query = supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (type === 'income' || type === 'expense') {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, type } = body

  if (!name?.trim()) {
    return NextResponse.json({ message: 'name is required' }, { status: 400 })
  }
  if (type !== 'income' && type !== 'expense') {
    return NextResponse.json({ message: 'type must be "income" or "expense"' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: name.trim(), type }])
    .select()
    .single()

  if (error) {
    // Unique violation
    if (error.code === '23505') {
      return NextResponse.json({ message: `"${name}" already exists for ${type}` }, { status: 409 })
    }
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
