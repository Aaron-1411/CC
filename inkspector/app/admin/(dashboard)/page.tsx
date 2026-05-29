import { createClient } from '@/lib/supabase-server'

import BookingStatusBadge from '@/components/booking-status-badge'

import type { BookingStatus } from '@/types/booking'

import Link from 'next/link'

export const runtime = 'edge'


const STATUS_OPTIONS: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'waitlist']

export default async function AdminDashboard() {
  let bookings: { id: string; name: string; tattoo_style: string; status: string; created_at: string }[] = []
  const counts: Record<string, number> = {}
  let total = 0
  try {
    const supabase = await createClient()
    const { data: recentData } = await supabase
      .from('bookings')
      .select('id, name, tattoo_style, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    bookings = recentData ?? []
    const { data: allStatuses } = await supabase.from('bookings').select('status')
    for (const row of allStatuses ?? []) {
      counts[row.status] = (counts[row.status] ?? 0) + 1
    }
    total = allStatuses?.length ?? 0
  } catch {}

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-heading text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8 text-sm">Overview of all booking requests.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
        <div className="bg-card border border-border rounded-sm p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total</p>
          <p className="font-heading text-3xl font-bold">{total}</p>
        </div>
        {STATUS_OPTIONS.map(s => (
          <div key={s} className="bg-card border border-border rounded-sm p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{s}</p>
            <p className="font-heading text-3xl font-bold">{counts[s] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold">Recent Requests</h2>
          <Link href="/admin/bookings" className="text-sm text-primary hover:underline">View all →</Link>
        </div>

        {!bookings?.length ? (
          <p className="text-muted-foreground text-sm py-8 text-center border border-border rounded-sm">No booking requests yet.</p>
        ) : (
          <div className="border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Style</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={b.id} className={`border-b border-border last:border-0 hover:bg-card/50 transition-colors ${i % 2 === 0 ? '' : 'bg-card/20'}`}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className="hover:text-primary transition-colors font-medium">
                        {b.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{b.tattoo_style}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={b.status as BookingStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
