import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/shared/Sidebar';
import { BottomNav } from '@/components/shared/BottomNav';
import { BootstrapBanner } from '@/components/shared/BootstrapBanner';
import { Providers } from './providers';

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ISA Fund Manager',
  description: 'Institutional-grade UK Stocks ISA investment management platform',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#080c14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] antialiased">
        <Providers>
          <div className="flex flex-1 min-h-screen">
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col">
              <BootstrapBanner />
              <main className="flex-1 pb-16 lg:pb-0">
                {children}
              </main>
            </div>
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
