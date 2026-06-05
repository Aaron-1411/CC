import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Fulcrum — Free Ecommerce Audit',
  description: 'Paste your URL and get a 13-pillar ecommerce audit in ~8 minutes. Powered by live AI research. Free — no signup required.',
  metadataBase: new URL('https://fulcrumsolutions.online'),
  openGraph: {
    title: 'Fulcrum — Free Ecommerce Audit',
    description: 'Your store is leaking revenue. Find out exactly where.',
    url: 'https://fulcrumsolutions.online',
    siteName: 'Fulcrum Solutions',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fulcrum — Free Ecommerce Audit',
    description: 'Your store is leaking revenue. Find out exactly where.',
  },
  themeColor: '#080a0f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="antialiased" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
