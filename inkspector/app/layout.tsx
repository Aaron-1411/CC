import type { Metadata } from 'next'
import { Courier_Prime, Oswald } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const courierPrime = Courier_Prime({
  variable: '--font-courier',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
})

const oswald = Oswald({
  variable: '--font-big-shoulders',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Inkspector — Jordan Mitchell | Tattoo Artist, London',
  description:
    'Custom tattoo artist based at One by One Tattoo, London. Specialising in playful, client-focused artwork. Book your consultation today.',
  keywords: ['tattoo artist', 'London tattoo', 'custom tattoo', 'One by One Tattoo', 'Inkspector', 'Jordan Mitchell'],
  openGraph: {
    title: 'Inkspector — Jordan Mitchell | Tattoo Artist, London',
    description: 'Creating artwork in a fun and playful way. Book your consultation today.',
    url: 'https://inkspector.uk',
    siteName: 'Inkspector',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${courierPrime.variable} ${oswald.variable}`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        {children}
        <Toaster position="top-right" theme="light" />
      </body>
    </html>
  )
}
