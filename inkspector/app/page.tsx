import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import Nav from '@/components/nav'
import { InstagramIcon } from '@/components/icons'
import { createClient } from '@/lib/supabase-server'
import type { PortfolioImage } from '@/types/booking'

export const runtime = 'edge'

export default async function HomePage() {
  let featured: PortfolioImage[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('portfolio_images')
      .select('*')
      .eq('featured', true)
      .order('display_order')
      .limit(6)
    featured = data ?? []
  } catch {}

  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-6">One by One Tattoo · London</p>
          <h1 className="font-heading text-6xl md:text-8xl font-bold tracking-tight mb-6 leading-none">
            Inkspector
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
            Creating artwork in a fun and playful way.<br />
            <span className="text-foreground">Your happiness is priority one.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-medium rounded-sm hover:bg-primary/90 transition-colors text-sm tracking-wide"
            >
              Book a Consultation <ArrowRight size={16} />
            </Link>
            <Link
              href="/portfolio"
              className="px-7 py-3.5 border border-border text-foreground rounded-sm hover:border-muted-foreground transition-colors text-sm tracking-wide"
            >
              View Portfolio
            </Link>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-px h-10 bg-gradient-to-b from-primary/60 to-transparent mx-auto" />
        </div>
      </section>

      {/* Featured work */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-heading text-3xl md:text-4xl">Featured Work</h2>
            <Link href="/portfolio" className="text-sm text-primary hover:underline flex items-center gap-1">
              Full portfolio <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {featured.map(img => (
              <Link key={img.id} href="/portfolio" className="group relative overflow-hidden rounded-sm bg-card aspect-square block">
                <Image
                  src={img.url}
                  alt={img.caption ?? img.style_tag ?? 'Tattoo'}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* About teaser */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-primary mb-4">The Artist</p>
            <h2 className="font-heading text-3xl md:text-4xl mb-6">Jordan Mitchell</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Based at One by One Tattoo in London, I specialise in custom designs tailored entirely to you. Every piece is created with care, creativity, and a genuine love for making people feel great in their skin.
            </p>
            <Link href="/about" className="text-sm text-primary hover:underline flex items-center gap-1 w-fit">
              More about me <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative aspect-[3/4] rounded-sm overflow-hidden bg-card border border-border flex items-center justify-center">
            <p className="font-heading text-muted-foreground/30 text-lg">Artist photo</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center border-t border-border">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-4">Ready to get started?</p>
        <h2 className="font-heading text-3xl md:text-5xl mb-6 max-w-xl mx-auto leading-tight">
          Let&apos;s create something you&apos;ll love forever
        </h2>
        <p className="text-muted-foreground mb-10 max-w-md mx-auto">
          Tell me about your idea. The more detail you share, the better I can prepare and give you an accurate quote.
        </p>
        <Link
          href="/book"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-sm hover:bg-primary/90 transition-colors"
        >
          Start Your Booking <ArrowRight size={16} />
        </Link>
      </section>

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
