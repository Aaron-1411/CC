import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('bookings').select('status')
    const counts: Record<string, number> = {}
    for (const row of data ?? []) {
      counts[row.status] = (counts[row.status] ?? 0) + 1
    }
    return NextResponse.json({ total: data?.length ?? 0, counts })
  } catch {
    return NextResponse.json({ total: 0, counts: {} })
  }
}
