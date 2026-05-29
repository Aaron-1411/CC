export const runtime = 'edge'

import { Suspense } from 'react'
import BookingsClient from './bookings-client'

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground text-sm">Loading…</div>}>
      <BookingsClient />
    </Suspense>
  )
}
