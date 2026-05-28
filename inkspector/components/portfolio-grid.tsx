'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioImage } from '@/types/booking'

interface Props {
  images: PortfolioImage[]
}

export default function PortfolioGrid({ images }: Props) {
  const [filter, setFilter] = useState('All')
  const [lightbox, setLightbox] = useState<PortfolioImage | null>(null)

  const filtered = filter === 'All' ? images : images.filter(img => img.style_tag === filter)
  const availableFilters = ['All', ...Array.from(new Set(images.map(i => i.style_tag).filter(Boolean)))]

  return (
    <>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {availableFilters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f!)}
            className={cn(
              'px-4 py-1.5 text-sm rounded-sm border transition-colors',
              filter === f
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-heading text-2xl mb-3">Gallery Coming Soon</p>
          <p className="text-sm">Check back shortly or follow <a href="https://instagram.com/inkspector_" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@inkspector_</a> on Instagram for the latest work.</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {filtered.map(img => (
            <div
              key={img.id}
              className="break-inside-avoid group relative cursor-pointer overflow-hidden rounded-sm bg-card"
              onClick={() => setLightbox(img)}
            >
              <Image
                src={img.url}
                alt={img.caption ?? img.style_tag ?? 'Tattoo'}
                width={400}
                height={400}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-3">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {img.style_tag && (
                    <span className="text-xs text-primary bg-black/60 px-2 py-1 rounded-sm">
                      {img.style_tag}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X size={28} />
          </button>
          <div
            className="relative max-w-3xl max-h-[90vh] w-full"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={lightbox.url}
              alt={lightbox.caption ?? 'Tattoo'}
              width={900}
              height={900}
              className="object-contain max-h-[80vh] w-full rounded-sm"
            />
            {(lightbox.caption || lightbox.style_tag) && (
              <div className="mt-3 text-center text-sm text-white/60">
                {lightbox.caption && <span>{lightbox.caption}</span>}
                {lightbox.style_tag && <span className="text-primary ml-2">· {lightbox.style_tag}</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
