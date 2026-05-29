import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin } from 'lucide-react'
import Nav from '@/components/nav'
import { InstagramIcon } from '@/components/icons'

const styles = [
  { name: 'Blackwork', desc: 'Bold, graphic pieces that age beautifully and make a statement.' },
  { name: 'Fine Line', desc: 'Delicate, precise work with intricate detail and a refined finish.' },
  { name: 'Neo-Traditional', desc: 'Classic tattoo energy with a modern, illustrative twist.' },
  { name: 'Illustrative', desc: 'Playful and expressive — designs that feel like wearable art.' },
  { name: 'Geometric', desc: 'Clean lines, patterns, and precision that work with the body.' },
  { name: 'Custom', desc: 'Bring any idea — I&apos;ll make it work in a style that suits you.' },
]

export default function AboutPage() {
  return (
    <>
      <Nav />

      <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">About</p>
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-0">Jordan Mitchell</h1>
          <p className="font-heading text-xl text-muted-foreground italic mt-2">aka Inkspector</p>
        </div>

        {/* Bio section */}
        <div className="grid md:grid-cols-5 gap-12 mb-20">
          <div className="md:col-span-3 space-y-5 text-muted-foreground leading-relaxed text-[1.05rem]">
            <p>
              I&apos;m Jordan — a tattoo artist based at <span className="text-foreground">One by One Tattoo</span> in London. I started tattooing because I believe permanent art should feel personal, joyful, and entirely yours.
            </p>
            <p>
              My approach is simple: I listen carefully, I ask questions, and I don&apos;t put needle to skin until we&apos;re both genuinely excited about the design. Your happiness really is the number one priority — not just something I say.
            </p>
            <p>
              Whether you&apos;re walking in with a fully-formed vision or just a vibe and a mood board, I&apos;ll work with you to create something that fits your body, your personality, and your life.
            </p>
            <div className="flex items-center gap-2 text-sm pt-2">
              <MapPin size={14} className="text-primary" />
              <span className="text-foreground">One by One Tattoo, London</span>
            </div>
            <a
              href="https://instagram.com/inkspector_"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline w-fit"
            >
              <InstagramIcon size={14} /> @inkspector_
            </a>
          </div>

          <div className="md:col-span-2 relative aspect-[3/4] rounded-sm overflow-hidden bg-card border border-border">
            <Image
              src="/jordan-at-work.jpg"
              alt="Jordan Mitchell tattooing — One by One Tattoo, London"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>

        {/* Styles */}
        <div className="mb-20">
          <h2 className="font-heading text-2xl md:text-3xl mb-8">Styles I Work In</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-px bg-border">
            {styles.map(s => (
              <div key={s.name} className="bg-background p-6">
                <h3 className="font-heading text-lg font-semibold mb-2 text-primary">{s.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: s.desc }} />
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-20 border-t border-border pt-16">
          <h2 className="font-heading text-2xl md:text-3xl mb-8">Common Questions</h2>
          <div className="space-y-6 max-w-2xl">
            {[
              {
                q: 'How does the booking process work?',
                a: 'Fill in the booking form with as much detail as possible — style, placement, size, references. I\'ll review it and get back to you within 48 hours to confirm availability and pricing.',
              },
              {
                q: 'How much does a tattoo cost?',
                a: 'Pricing depends on size, complexity, placement, and style. I\'ll give you an honest quote once I\'ve reviewed your request. There\'s a minimum charge of £80.',
              },
              {
                q: 'Do you do walk-ins?',
                a: 'Occasionally — follow @inkspector_ on Instagram for walk-in availability announcements. For custom work, bookings are always recommended.',
              },
              {
                q: 'What should I bring to my appointment?',
                a: 'Any additional reference images, comfortable clothing that allows easy access to the area being tattooed, and a snack if it\'s a longer session.',
              },
              {
                q: 'Can you cover an old tattoo?',
                a: 'Absolutely. Cover-ups are assessed case by case — share a clear photo of the existing tattoo in your booking request and I\'ll let you know what\'s possible.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-border pb-6">
                <h3 className="font-medium mb-2">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center border border-border rounded-sm p-10">
          <h2 className="font-heading text-2xl md:text-3xl mb-3">Ready to book?</h2>
          <p className="text-muted-foreground mb-6">Fill out the request form and I&apos;ll be in touch within 48 hours.</p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-medium rounded-sm hover:bg-primary/90 transition-colors text-sm"
          >
            Book a Consultation <ArrowRight size={16} />
          </Link>
        </div>
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
