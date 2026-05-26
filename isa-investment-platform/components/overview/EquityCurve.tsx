'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar,
} from 'recharts';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useUiStore } from '@/store/uiStore';

const RANGES = ['1W', '1M', '3M', '6M', 'YTD', 'All'] as const;
type Range = (typeof RANGES)[number];

interface SnapshotPoint {
  date: string;
  valueGBP: number;
  sp500?: number;
  ftse?: number;
  drawdown?: number;
}

export function EquityCurve() {
  const { chartRange, setChartRange } = useUiStore();
  const [showSP500, setShowSP500] = useState(true);
  const [showFTSE, setShowFTSE] = useState(false);

  const { data, isLoading } = useQuery<SnapshotPoint[]>({
    queryKey: ['portfolio', 'history', chartRange],
    queryFn: () => fetch(`/api/portfolio/history?range=${chartRange}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <SkeletonCard className="h-64" />;

  const points = Array.isArray(data) ? data : [];

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const fmtGBP = (v: number) => `£${v.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setChartRange(r)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded border flex-shrink-0 transition-colors ${
                chartRange === r
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-normal)]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-secondary)] cursor-pointer">
            <input type="checkbox" checked={showSP500} onChange={(e) => setShowSP500(e.target.checked)} className="w-3 h-3" />
            S&P 500
          </label>
          <label className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-secondary)] cursor-pointer">
            <input type="checkbox" checked={showFTSE} onChange={(e) => setShowFTSE(e.target.checked)} className="w-3 h-3" />
            FTSE 100
          </label>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-[var(--text-tertiary)] text-sm font-mono">
          No historical data yet — snapshots accumulate daily
        </div>
      ) : (
        <>
          {/* Main equity curve */}
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-ibm-plex-mono)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtGBP} tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-ibm-plex-mono)' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-normal)', borderRadius: 8, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 12 }}
                labelStyle={{ color: 'var(--text-secondary)' }}
                formatter={(v, name) => [fmtGBP(Number(v)), String(name)] as [string, string]}
                labelFormatter={(label) => fmtDate(String(label))}
              />
              <Area type="monotone" dataKey="valueGBP" name="Portfolio" stroke="var(--accent)" strokeWidth={2} fill="url(#portfolioGrad)" dot={false} />
              {showSP500 && <Area type="monotone" dataKey="sp500" name="S&P 500" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeDasharray="4 2" fill="none" dot={false} />}
              {showFTSE && <Area type="monotone" dataKey="ftse" name="FTSE 100" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="2 3" fill="none" dot={false} />}
            </AreaChart>
          </ResponsiveContainer>

          {/* Drawdown sub-chart */}
          {points.some((p) => p.drawdown !== undefined) && (
            <ResponsiveContainer width="100%" height={50}>
              <BarChart data={points} margin={{ top: 2, right: 4, bottom: 0, left: 0 }}>
                <YAxis tick={false} axisLine={false} tickLine={false} width={60} />
                <Bar dataKey="drawdown" fill="var(--negative)" fillOpacity={0.4} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}
