import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'DEEP DIVE · 13-Pillar Ecommerce Audit',
  description: '13-pillar ecommerce brand audit powered by Gemini 2.0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body
        className="antialiased text-zinc-100"
        style={{ backgroundColor: '#080c14' }}
      >
        {children}
      </body>
    </html>
  );
}
