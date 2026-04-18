import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()
  const { name } = body

  if (!name?.trim()) {
    return NextResponse.json({ message: 'name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('customers')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ message: `"${name}" already exists` }, { status: 409 })
    }
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ message: 'Customer not found' }, { status: 404 })

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
