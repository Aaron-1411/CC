import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase-server'

import { sendBookingConfirmation, sendArtistNotification } from '@/lib/email'

import { bookingSchema } from '@/lib/validations/booking'

export const runtime = 'edge'


export async function POST(request: NextRequest) {
  const body = await request.json()

  const parsed = bookingSchema.omit({ consent: true }).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid booking data', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) {
    console.error('Booking insert error:', error)
    return NextResponse.json({ error: 'Failed to save booking' }, { status: 500 })
  }

  try {
    await Promise.all([
      sendBookingConfirmation(parsed.data),
      sendArtistNotification(parsed.data),
    ])
  } catch (emailErr) {
    console.error('Email send error:', emailErr)
    // Don't fail the request — booking is saved
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
