'use client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import type { ETFHolding } from '@/types/market';
import { fetchJson } from '@/lib/fetchJson';

interface Props { ticker: string }

const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#3d7eff',
  'Communication Services': '#bc8cff',
  'Consumer Cyclical': '#f5a623',
  'Financial Services': '#4ade80',
  'Healthcare': '#f472b6',
  'Industrials': '#fb923c',
  'Consumer Defensive': '#34d399',
  'Energy': '#fbbf24',
  'Real Estate': '#a78bfa',
  'Materials': '#60a5fa',
  'Utilities': '#94a3b8',
};

function sectorColor(sector: string | null): string {
  return sector ? (SECTOR_COLORS[sector] ?? '#8896b0') : '#8896b0';
}

function BarLabel({ weight }: { weight: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
        <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${Math.min(weight * 10, 100)}%` }} />
      </div>
      <span className="tabular-nums text-[var(--text-primary)]">{weight.toFixed(2)}%</span>
    </div>
  );
}

export function ETFHoldingsTab({ ticker }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['etf-holdings', ticker],
    queryFn: () => fetchJson(`/api/etf-holdings/${encodeURIComponent(ticker)}`),
    staleTime: 86_400_000,
  });

  if (isLoading) return <SkeletonCard className="h-64" />;

  const holdings: ETFHolding[] = Array.isArray(data?.holdings) ? data.holdings : [];

  if (holdings.length === 0) {
    return (
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 text-center">
        <div className="text-2xl mb-2">📊</div>
        <div className="text-[12px] font-mono text-[var(--text-secondary)]">ETF holdings not available</div>
        <div className="text-[11px] font-mono text-[var(--text-tertiary)] mt-1">
          Add an <code className="bg-[var(--bg-overlay)] px-1 rounded">FMP_API_KEY</code> to{' '}
          <code className="bg-[var(--bg-overlay)] px-1 rounded">.env.local</code> to enable.
        </div>
      </div>
    );
  }

  const top20 = holdings.slice(0, 20);
  const totalTop20Pct = top20.reduce((s, h) => s + h.weight, 0) * 100;

  // Sector breakdown
  const sectorMap: Record<string, number> = {};
  for (const h of holdings) {
    const s = h.sector ?? 'Other';
    sectorMap[s] = (sectorMap[s] ?? 0) + h.weight;
  }
  const sectors = Object.entries(sectorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, weight]) => ({ name, weight: +(weight * 100).toFixed(2) }));

  const chartData = top20.map(h => ({
    name: h.ticker ?? h.name.slice(0, 10),
    weight: +(h.weight * 100).toFixed(2),
    sector: h.sector,
  }));

  return (
    <div className="space-y-4">
      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Total Holdings</div>
          <div className="text-lg font-bold font-mono text-[var(--text-primary)]">{holdings.length}</div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Top 20 Concentration</div>
          <div className="text-lg font-bold font-mono text-[var(--text-primary)]">{totalTop20Pct.toFixed(1)}%</div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Largest Position</div>
          <div className="text-lg font-bold font-mono text-[var(--text-primary)]">{top20[0]?.ticker ?? '—'}</div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)]">
            {top20[0] ? `${(top20[0].weight * 100).toFixed(2)}%` : ''}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 20 bar chart */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
            Top 20 Holdings by Weight
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 52 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: unknown) => `${v}%`}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-overlay)',
                  border: '1px solid var(--border-normal)',
                  borderRadius: 8,
                  fontFamily: 'monospace',
                  fontSize: 10,
                }}
                formatter={(v: unknown, _name: unknown, props: { payload?: { sector?: string } }) =>
                  [`${v}% · ${props.payload?.sector ?? 'N/A'}`, 'Weight'] as [string, string]
                }
              />
              <Bar dataKey="weight" radius={2}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={sectorColor(entry.sector)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sector breakdown */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
            Sector Allocation
          </div>
          <div className="space-y-2">
            {sectors.map(({ name, weight }) => (
              <div key={name}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[11px] font-mono text-[var(--text-secondary)]">{name}</span>
                  <span className="text-[11px] font-mono tabular-nums text-[var(--text-primary)]">{weight}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-overlay)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(weight, 100)}%`, background: sectorColor(name) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full holdings table */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
          All Holdings (top 50)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['#', 'Ticker', 'Name', 'Sector', 'Country', 'Weight'].map(h => (
                  <th key={h} className="pb-2 pr-4 text-left text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.slice(0, 50).map((h, i) => (
                <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-raised)] transition-colors">
                  <td className="py-1.5 pr-4 text-[var(--text-tertiary)]">{i + 1}</td>
                  <td className="py-1.5 pr-4 font-semibold text-[var(--text-primary)]">{h.ticker ?? '—'}</td>
                  <td className="py-1.5 pr-4 text-[var(--text-secondary)] max-w-[160px] truncate">{h.name}</td>
                  <td className="py-1.5 pr-4">
                    {h.sector && (
                      <span className="px-1.5 py-0.5 rounded text-[9px]"
                            style={{ background: `${sectorColor(h.sector)}20`, color: sectorColor(h.sector) }}>
                        {h.sector}
                      </span>
                    )}
                    {!h.sector && <span className="text-[var(--text-tertiary)]">—</span>}
                  </td>
                  <td className="py-1.5 pr-4 text-[var(--text-tertiary)]">{h.country ?? '—'}</td>
                  <td className="py-1.5">
                    <BarLabel weight={+(h.weight * 100).toFixed(2)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
