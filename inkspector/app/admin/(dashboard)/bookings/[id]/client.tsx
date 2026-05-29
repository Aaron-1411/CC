'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import BookingStatusBadge from '@/components/booking-status-badge'
import { Button } from '@/components/ui/button'
import type { Booking, BookingStatus } from '@/types/booking'

const STATUS_OPTIONS: BookingStatus[] = ['pending', 'confirmed', 'waitlist', 'completed', 'cancelled']

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-5 gap-4 py-3 border-b border-border last:border-0">
      <dt className="col-span-2 text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-3 text-sm">{value}</dd>
    </div>
  )
}

export default function BookingDetailClient() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [status, setStatus] = useState<BookingStatus>('pending')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/bookings/${id}`)
      .then(r => r.json())
      .then((data: Booking) => {
        setBooking(data)
        setStatus(data.status)
        setAdminNotes(data.admin_notes ?? '')
      })
  }, [id])

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Booking updated')
      const updated = await res.json()
      setBooking(updated)
    } else {
      toast.error('Failed to update')
    }
  }

  if (!booking) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  const receivedDate = new Date(booking.created_at).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/bookings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold">{booking.name}</h1>
          <p className="text-sm text-muted-foreground">{receivedDate}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">

          <div className="bg-card border border-border rounded-sm p-5">
            <h2 className="text-xs uppercase tracking-widest text-primary font-medium mb-4">Contact</h2>
            <dl>
              <DetailRow label="Name" value={booking.name} />
              <DetailRow label="Email" value={<a href={`mailto:${booking.email}`} className="text-primary hover:underline">{booking.email}</a>} />
              <DetailRow label="Phone" value={booking.phone} />
              <DetailRow label="Instagram" value={booking.instagram ? (
                <a href={`https://instagram.com/${booking.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  {booking.instagram} <ExternalLink size={12} />
                </a>
              ) : null} />
            </dl>
          </div>

          <div className="bg-card border border-border rounded-sm p-5">
            <h2 className="text-xs uppercase tracking-widest text-primary font-medium mb-4">Design</h2>
            <dl>
              <DetailRow label="Style" value={booking.tattoo_style} />
              <DetailRow label="Colour" value={booking.colour_preference} />
              <DetailRow label="Complexity" value={booking.complexity} />
              <DetailRow label="Description" value={<p className="whitespace-pre-wrap">{booking.description}</p>} />
              <DetailRow label="Cover-up" value={booking.is_cover_up ? `Yes${booking.cover_up_notes ? ` — ${booking.cover_up_notes}` : ''}` : 'No'} />
              <DetailRow label="First tattoo" value={booking.is_first_tattoo ? 'Yes' : 'No'} />
            </dl>
            {booking.reference_images.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3">Reference images</p>
                <div className="flex flex-wrap gap-2">
                  {booking.reference_images.map(url => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-sm overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-sm p-5">
            <h2 className="text-xs uppercase tracking-widest text-primary font-medium mb-4">Placement & Size</h2>
            <dl>
              <DetailRow label="Body area" value={booking.body_part} />
              <DetailRow label="Specific placement" value={booking.placement_detail} />
              <DetailRow label="Size" value={booking.size_category} />
              <DetailRow label="Dimensions" value={booking.dimensions} />
              <DetailRow label="Size notes" value={booking.size_notes} />
            </dl>
          </div>

          <div className="bg-card border border-border rounded-sm p-5">
            <h2 className="text-xs uppercase tracking-widest text-primary font-medium mb-4">Session</h2>
            <dl>
              <DetailRow label="Preferred date" value={booking.preferred_date
                ? new Date(booking.preferred_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Flexible'} />
              <DetailRow label="Time preference" value={booking.time_preference} />
              <DetailRow label="Budget" value={booking.budget_range} />
              <DetailRow label="Additional notes" value={booking.additional_notes
                ? <p className="whitespace-pre-wrap">{booking.additional_notes}</p>
                : null} />
            </dl>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-sm p-5 sticky top-6">
            <h2 className="text-xs uppercase tracking-widest text-primary font-medium mb-4">Update Booking</h2>

            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-1.5 block">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as BookingStatus)}
                className="w-full h-9 rounded-md border border-input bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} className="capitalize bg-card">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="text-sm text-muted-foreground mb-1.5 block">Admin notes</label>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                className="w-full min-h-[100px] rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Pricing, date agreed, anything relevant…"
              />
            </div>

            <Button
              onClick={save}
              disabled={saving}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
