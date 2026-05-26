'use client';
import { usePortfolioStore } from '@/store/portfolioStore';

interface Props { ticker: string; }

export function MyPositionCard({ ticker }: Props) {
  const positions = usePortfolioStore((s) => s.positions);
  const totalValueGBP = usePortfolioStore((s) => s.totalValueGBP);
  const pos = positions.find((p) => p.ticker === ticker);

  if (!pos) return null;

  const rank = [...positions].sort((a, b) => b.currentValueGBP - a.currentValueGBP)
    .findIndex((p) => p.ticker === ticker) + 1;

  const isPos = pos.dailyChangeGBP >= 0;

  const rows: [string, string, string?][] = [
    ['Est. value', `£${pos.currentValueGBP.toFixed(2)}`, undefined],
    ['Today', `${isPos ? '+' : ''}£${pos.dailyChangeGBP.toFixed(2)}`, isPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'],
    ['Daily return', `${isPos ? '+' : ''}${pos.dailyPct.toFixed(2)}%`, isPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'],
    ['ISA weight', `${(pos.weight * 100).toFixed(2)}%`, undefined],
    ['Rank by value', `#${rank} of ${positions.length}`, undefined],
  ];

  if (pos.units !== null) rows.push(['Units held', pos.units.toFixed(4), undefined]);
  if (pos.avgCostGBP !== null) rows.push(['Avg cost', `£${pos.avgCostGBP.toFixed(4)}`, undefined]);
  if (pos.unrealisedPnLGBP !== null) {
    const up = pos.unrealisedPnLGBP >= 0;
    rows.push(['Unrealised P&L', `${up ? '+' : ''}£${pos.unrealisedPnLGBP.toFixed(2)} (${pos.unrealisedPnLPct?.toFixed(1)}%)`, up ? 'text-[var(--positive)]' : 'text-[var(--negative)]']);
  }

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">My Position</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rows.map(([label, value, color]) => (
          <div key={label}>
            <div className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wide mb-1">{label}</div>
            <div className={`text-sm font-bold font-mono tabular-nums ${color ?? 'text-[var(--text-primary)]'}`}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
