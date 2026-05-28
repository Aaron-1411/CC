import { createClient } from '@/lib/supabase-server'

import BookingStatusBadge from '@/components/booking-status-badge'

import type { BookingStatus } from '@/types/booking'

import Link from 'next/link'

export const runtime = 'edge'


const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'waitlist']

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status = 'all' } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('bookings')
    .select('id, name, email, tattoo_style, body_part, size_category, preferred_date, budget_range, status, created_at')
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: bookings } = await query

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="font-heading text-3xl font-bold mb-2">Bookings</h1>
      <p className="text-muted-foreground mb-6 text-sm">{bookings?.length ?? 0} request{bookings?.length !== 1 ? 's' : ''}</p>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map(s => (
          <Link
            key={s}
            href={`/admin/bookings${s === 'all' ? '' : `?status=${s}`}`}
            className={`px-3 py-1.5 text-xs rounded-sm border capitalize transition-colors ${
              status === s
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:border-muted-foreground'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {!bookings?.length ? (
        <p className="text-muted-foreground text-sm py-12 text-center border border-border rounded-sm">
          No {status === 'all' ? '' : status} bookings found.
        </p>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide hidden md:table-cell">Style</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide hidden lg:table-cell">Placement</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide hidden lg:table-cell">Size</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide hidden md:table-cell">Budget</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Received</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={b.id} className={`border-b border-border last:border-0 hover:bg-card/50 transition-colors ${i % 2 === 0 ? '' : 'bg-card/20'}`}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className="hover:text-primary transition-colors">
                        <span className="font-medium">{b.name}</span>
                        <span className="block text-xs text-muted-foreground">{b.email}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{b.tattoo_style}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{b.body_part}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell capitalize">{b.size_category}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{b.budget_range ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={b.status as BookingStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
