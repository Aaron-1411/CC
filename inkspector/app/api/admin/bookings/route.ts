import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase-server'

export const runtime = 'edge'


export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined

  let query = supabase
    .from('bookings')
    .select('id, name, email, tattoo_style, body_part, size_category, preferred_date, budget_range, status, created_at')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })

  return NextResponse.json(data)
}
