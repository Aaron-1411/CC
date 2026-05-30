'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/about', label: 'About' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/aftercare', label: 'Aftercare' },
  { href: '/book', label: 'Book', cta: true },
]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    handler()
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Home page: transparent over dark hero, white text; all other pages: always solid
  const isHome = pathname === '/'
  const transparentMode = isHome && !scrolled

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        transparentMode
          ? 'bg-transparent'
          : 'bg-white/95 backdrop-blur-sm border-b border-border'
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Image
            src="/inkspector-logo.png"
            alt="Inkspector"
            width={140}
            height={44}
            className={cn('h-9 w-auto', transparentMode ? 'invert' : '')}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-sans tracking-widest uppercase transition-colors',
                link.cta
                  ? 'px-5 py-2 bg-primary text-primary-foreground font-medium rounded-sm hover:bg-primary/90'
                  : pathname === link.href
                  ? transparentMode ? 'text-white' : 'text-foreground font-medium'
                  : transparentMode
                  ? 'text-white/70 hover:text-white'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          className={cn(
            'md:hidden transition-colors',
            transparentMode ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-b border-border px-6 pb-6 flex flex-col gap-4">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm tracking-widest uppercase py-2 transition-colors font-sans',
                link.cta
                  ? 'text-primary font-medium'
                  : pathname === link.href
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
