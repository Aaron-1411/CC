'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',            label: 'Overview',    icon: '⬡' },
  { href: '/portfolio',   label: 'Portfolio',   icon: '◎' },
  { href: '/performance', label: 'Perf',        icon: '📈' },
  { href: '/risk',        label: 'Risk',        icon: '⚠' },
  { href: '/analysis',    label: 'AI',          icon: '✦' },
  { href: '/positions',   label: 'Positions',   icon: '≡' },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex z-50 safe-area-pb">
      {NAV.map(({ href, label, icon }) => {
        const active = href === '/' ? path === '/' : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] min-h-[56px] transition-colors ${
              active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
            }`}
          >
            <span className="text-lg leading-none">{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
