import Nav from '@/components/nav'
import { InstagramIcon } from '@/components/icons'
import PortfolioGrid from '@/components/portfolio-grid'
import { createStaticClient } from '@/lib/supabase-static'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const revalidate = 3600

export default async function PortfolioPage() {
  let images: import('@/types/booking').PortfolioImage[] = []
  try {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from('portfolio_images')
      .select('*')
      .order('display_order')
    images = data ?? []
  } catch {}

  return (
    <>
      <Nav />

      <main className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">Work</p>
          <h1 className="font-heading text-5xl md:text-6xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground mt-3 max-w-md">
            A selection of custom pieces. For the full feed, follow{' '}
            <a href="https://instagram.com/inkspector_" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              @inkspector_
            </a>{' '}
            on Instagram.
          </p>
        </div>

        {images.length > 0 ? (
          <PortfolioGrid images={images} />
        ) : (
          /* Empty state — direct to Instagram until portfolio is populated */
          <div className="border border-border rounded-sm p-12 text-center max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <InstagramIcon size={22} className="text-primary" />
            </div>
            <h2 className="font-heading text-xl mb-3">Portfolio coming soon</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              The full gallery is being set up. In the meantime, you can browse Jordan&apos;s latest work on Instagram — updated regularly with fresh pieces, healed shots, and flash availability.
            </p>
            <a
              href="https://instagram.com/inkspector_"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-sm hover:bg-primary/90 transition-colors text-sm"
            >
              <InstagramIcon size={15} /> View @inkspector_ on Instagram
            </a>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">Ready to book?</p>
              <Link
                href="/book"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                Request a consultation <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="font-heading font-bold text-foreground tracking-widests uppercase">Inkspector</p>
          <p>One by One Tattoo · London</p>
          <a href="https://instagram.com/inkspector_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <InstagramIcon size={16} /> @inkspector_
          </a>
        </div>
      </footer>
    </>
  )
}
