import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, contact_number, gst_number, bill_to_address, ship_to_address } = body

  if (!name?.trim()) {
    return NextResponse.json({ message: 'name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('customers')
    .insert([{
      name: name.trim(),
      contact_number: contact_number?.trim() || null,
      gst_number: gst_number?.trim() || null,
      bill_to_address: bill_to_address?.trim() || null,
      ship_to_address: ship_to_address?.trim() || null,
    }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ message: `"${name}" already exists` }, { status: 409 })
    }
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
