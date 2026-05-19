'use client';
import { useQuery } from '@tanstack/react-query';
import { SkeletonCard } from '@/components/shared/SkeletonCard';

interface RiskMetrics {
  var95_1d: number;
  var95pct: number;
  sharpe30d: number;
  maxDrawdown: number;
  currentDrawdown: number;
  volatility30d: number;
}

export function RiskSnapshot() {
  const { data, isLoading } = useQuery<{ metrics: RiskMetrics | null }>({
    queryKey: ['analytics', 'risk'],
    queryFn: () => fetch('/api/analytics/risk').then((r) => r.json()),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const d = data?.metrics ?? null;

  const cards = [
    {
      label: 'VaR (95%, 1D)',
      value: d ? `£${Math.abs(d.var95_1d).toFixed(0)}` : '--',
      sub: d ? `${d.var95pct.toFixed(2)}%` : '--',
      note: 'Historical sim.',
      color: 'text-[var(--negative)]',
    },
    {
      label: 'Sharpe (30d)',
      value: d ? d.sharpe30d.toFixed(2) : '--',
      sub: d ? (d.sharpe30d >= 1 ? 'Above 1 = good' : 'Below 1') : '--',
      note: 'Risk-adjusted return',
      color: d && d.sharpe30d >= 1 ? 'text-[var(--positive)]' : 'text-[var(--neutral)]',
    },
    {
      label: 'Max Drawdown',
      value: d ? `${d.maxDrawdown.toFixed(1)}%` : '--',
      sub: d ? `Now: ${d.currentDrawdown.toFixed(1)}%` : '--',
      note: 'From peak',
      color: 'text-[var(--negative)]',
    },
    {
      label: 'Volatility (30d)',
      value: d ? `${(d.volatility30d * 100).toFixed(1)}%` : '--',
      sub: 'Annualised',
      note: '30-day rolling',
      color: 'text-[var(--neutral)]',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">{c.label}</div>
          <div className={`text-xl font-bold font-mono tabular-nums ${c.color}`}>{c.value}</div>
          <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">{c.sub}</div>
          <div className="text-[10px] text-[var(--text-tertiary)] mt-1">{c.note}</div>
        </div>
      ))}
    </div>
  );
}
