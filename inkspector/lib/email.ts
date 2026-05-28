import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

type BookingPayload = {
  name: string
  email: string
  phone?: string | null
  instagram?: string | null
  tattoo_style: string
  description: string
  reference_images: string[]
  is_cover_up: boolean
  cover_up_notes?: string | null
  body_part: string
  placement_detail?: string | null
  size_category: string
  size_notes?: string | null
  is_first_tattoo: boolean
  preferred_date?: string | null
  time_preference?: string | null
  budget_range?: string | null
  additional_notes?: string | null
}

const ARTIST_EMAIL = 'mraaronmanu@gmail.com' // Replace with Jordan's actual email
const FROM_EMAIL = 'bookings@inkspector.uk'

export async function sendBookingConfirmation(booking: BookingPayload) {
  const preferredDate = booking.preferred_date
    ? new Date(booking.preferred_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Flexible'

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: booking.email,
    subject: 'Booking Request Received — Inkspector',
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #f5f5f0; padding: 40px;">
        <h1 style="font-size: 28px; margin-bottom: 8px; color: #c9a84c;">Booking Request Received</h1>
        <p style="color: #888; margin-bottom: 32px;">Inkspector · Jordan Mitchell · London</p>

        <p>Hi ${booking.name},</p>
        <p>Thanks for reaching out — I've received your tattoo request and will be in touch within <strong>48 hours</strong> to discuss availability and pricing.</p>

        <div style="background: #111; border: 1px solid #222; border-radius: 6px; padding: 24px; margin: 24px 0;">
          <h2 style="font-size: 16px; color: #c9a84c; margin-top: 0;">Your Request Summary</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #888; width: 40%;">Style</td><td style="padding: 6px 0;">${booking.tattoo_style}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Placement</td><td style="padding: 6px 0;">${booking.body_part}${booking.placement_detail ? ` — ${booking.placement_detail}` : ''}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Size</td><td style="padding: 6px 0;">${booking.size_category}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Preferred Date</td><td style="padding: 6px 0;">${preferredDate}</td></tr>
            ${booking.budget_range ? `<tr><td style="padding: 6px 0; color: #888;">Budget</td><td style="padding: 6px 0;">${booking.budget_range}</td></tr>` : ''}
          </table>
        </div>

        <p style="color: #888; font-size: 14px;">Follow my work on Instagram: <a href="https://instagram.com/inkspector_" style="color: #c9a84c;">@inkspector_</a></p>
        <p style="color: #888; font-size: 14px; margin-top: 32px;">— Jordan · Inkspector</p>
      </div>
    `,
  })
}

export async function sendArtistNotification(booking: BookingPayload) {
  const preferredDate = booking.preferred_date
    ? new Date(booking.preferred_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Not specified'

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ARTIST_EMAIL,
    subject: `New Booking Request — ${booking.name} · ${booking.tattoo_style}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #f5f5f0; padding: 40px;">
        <h1 style="font-size: 24px; color: #c9a84c; margin-bottom: 4px;">New Booking Request</h1>
        <p style="color: #888; margin-bottom: 32px;">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

        <div style="background: #111; border: 1px solid #333; border-radius: 6px; padding: 24px; margin-bottom: 20px;">
          <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #c9a84c; margin-top: 0;">Contact</h2>
          <p style="margin: 4px 0;"><strong>${booking.name}</strong></p>
          <p style="margin: 4px 0; color: #aaa;">${booking.email}</p>
          ${booking.phone ? `<p style="margin: 4px 0; color: #aaa;">${booking.phone}</p>` : ''}
          ${booking.instagram ? `<p style="margin: 4px 0; color: #aaa;">@${booking.instagram}</p>` : ''}
        </div>

        <div style="background: #111; border: 1px solid #333; border-radius: 6px; padding: 24px; margin-bottom: 20px;">
          <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #c9a84c; margin-top: 0;">The Tattoo</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 5px 0; color: #888; width: 35%;">Style</td><td style="padding: 5px 0;">${booking.tattoo_style}</td></tr>
            <tr><td style="padding: 5px 0; color: #888;">Placement</td><td style="padding: 5px 0;">${booking.body_part}${booking.placement_detail ? ` (${booking.placement_detail})` : ''}</td></tr>
            <tr><td style="padding: 5px 0; color: #888;">Size</td><td style="padding: 5px 0;">${booking.size_category}${booking.size_notes ? ` — ${booking.size_notes}` : ''}</td></tr>
            <tr><td style="padding: 5px 0; color: #888;">Cover-up</td><td style="padding: 5px 0;">${booking.is_cover_up ? `Yes${booking.cover_up_notes ? ` — ${booking.cover_up_notes}` : ''}` : 'No'}</td></tr>
            <tr><td style="padding: 5px 0; color: #888;">First tattoo</td><td style="padding: 5px 0;">${booking.is_first_tattoo ? 'Yes' : 'No'}</td></tr>
          </table>
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #222;">
            <p style="color: #888; font-size: 12px; margin: 0 0 6px;">Description:</p>
            <p style="margin: 0;">${booking.description}</p>
          </div>
          ${booking.reference_images.length > 0 ? `<p style="margin-top: 12px; color: #888; font-size: 12px;">${booking.reference_images.length} reference image(s) attached</p>` : ''}
        </div>

        <div style="background: #111; border: 1px solid #333; border-radius: 6px; padding: 24px; margin-bottom: 20px;">
          <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #c9a84c; margin-top: 0;">Session</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 5px 0; color: #888; width: 35%;">Preferred date</td><td style="padding: 5px 0;">${preferredDate}</td></tr>
            ${booking.time_preference ? `<tr><td style="padding: 5px 0; color: #888;">Time</td><td style="padding: 5px 0;">${booking.time_preference}</td></tr>` : ''}
            ${booking.budget_range ? `<tr><td style="padding: 5px 0; color: #888;">Budget</td><td style="padding: 5px 0;">${booking.budget_range}</td></tr>` : ''}
          </table>
          ${booking.additional_notes ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #222;"><p style="color: #888; font-size: 12px; margin: 0 0 6px;">Additional notes:</p><p style="margin: 0;">${booking.additional_notes}</p></div>` : ''}
        </div>
      </div>
    `,
  })
}
