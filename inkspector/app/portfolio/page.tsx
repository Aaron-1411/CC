import Nav from '@/components/nav'

import { InstagramIcon } from '@/components/icons'

import PortfolioGrid from '@/components/portfolio-grid'

import { createClient } from '@/lib/supabase-server'

export const runtime = 'edge'


export default async function PortfolioPage() {
  let images: import('@/types/booking').PortfolioImage[] = []
  try {
    const supabase = await createClient()
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

        <PortfolioGrid images={images} />
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
