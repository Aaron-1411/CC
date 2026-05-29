import Nav from '@/components/nav'
import { InstagramIcon } from '@/components/icons'
import BookingForm from '@/components/booking-form'
import { Clock, Banknote, MapPin } from 'lucide-react'

export default function BookPage() {
  return (
    <>
      <Nav />

      <main className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">Get in touch</p>
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-4">Book a Consultation</h1>
          <p className="text-muted-foreground leading-relaxed max-w-xl">
            Fill in as much detail as possible — the more Jordan knows about your idea upfront, the quicker he can come back with a realistic quote and available dates.
          </p>
        </div>

        {/* Info strips */}
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          <div className="flex items-start gap-3 p-4 rounded-sm border border-border bg-card">
            <Clock size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">48hr response</p>
              <p className="text-xs text-muted-foreground mt-0.5">Currently booking 4–6 weeks out</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-sm border border-border bg-card">
            <Banknote size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Deposit required</p>
              <p className="text-xs text-muted-foreground mt-0.5">£50 non-refundable, deducted from final price</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-sm border border-border bg-card">
            <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">One by One Tattoo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <a
                  href="https://maps.google.com/?q=One+by+One+Tattoo+London"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  View on Google Maps →
                </a>
              </p>
            </div>
          </div>
        </div>

        <BookingForm />
      </main>

      <footer className="border-t border-border px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="font-heading font-bold text-foreground tracking-widest uppercase">Inkspector</p>
          <p>One by One Tattoo · London</p>
          <a href="https://instagram.com/inkspector_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <InstagramIcon size={16} /> @inkspector_
          </a>
        </div>
      </footer>
    </>
  )
}
