import Nav from '@/components/nav'
import { InstagramIcon } from '@/components/icons'
import BookingForm from '@/components/booking-form'

export default function BookPage() {
  return (
    <>
      <Nav />

      <main className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">Get in touch</p>
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-4">Book a Consultation</h1>
          <p className="text-muted-foreground leading-relaxed max-w-xl">
            Fill in as much detail as possible — the more Jordan knows about your idea upfront, the quicker he can come back with a realistic quote and available dates.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Jordan responds to all requests within <span className="text-foreground font-medium">48 hours</span>.
          </p>
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
