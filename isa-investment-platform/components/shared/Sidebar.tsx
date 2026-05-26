'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',             label: 'Overview',      icon: '⬡' },
  { href: '/portfolio',    label: 'Portfolio',     icon: '◎' },
  { href: '/performance',  label: 'Performance',   icon: '📈' },
  { href: '/risk',         label: 'Risk',           icon: '⚠' },
  { href: '/analysis',     label: 'AI Analysis',   icon: '✦' },
  { href: '/positions',    label: 'Positions',     icon: '≡' },
  { href: '/tools',        label: 'Tools',         icon: '⚒' },
  { href: '/settings',     label: 'Settings',      icon: '⚙' },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-52 flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] min-h-screen sticky top-0 pt-6 pb-4 gap-0">
      <div className="px-4 mb-6">
        <div className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest mb-1">ISA Platform</div>
        <div className="text-[var(--text-primary)] font-semibold text-sm">Fund Manager</div>
      </div>
      <nav className="flex flex-col flex-1 gap-0.5 px-2">
        {NAV.map(({ href, label, icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)]'
              }`}
            >
              <span className="w-4 text-center text-base leading-none flex-shrink-0">{icon}</span>
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 mt-4 text-[10px] font-mono text-[var(--text-tertiary)]">
        UK Stocks ISA · 2025/26
      </div>
    </aside>
  );
}
