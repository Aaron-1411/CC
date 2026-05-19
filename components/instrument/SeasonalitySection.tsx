'use client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ErrorBar,
} from 'recharts';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import type { SeasonalityBucket, SeasonalityData } from '@/app/api/seasonality/[ticker]/route';

interface Props { ticker: string; color?: string }

const POS = 'var(--positive)';
const NEG = 'var(--negative)';
const MUTED = 'rgba(255,255,255,0.06)';

function barColor(mean: number) { return mean >= 0 ? POS : NEG; }

// Custom tooltip shared by both charts
function SeasonTooltip({ active, payload, label }: {
  active?: boolean; payload?: { payload: SeasonalityBucket }[]; label?: string
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[var(--bg-overlay)] border border-[var(--border-normal)] rounded-lg p-3 text-[11px] font-mono min-w-[160px]">
      <div className="text-[var(--text-primary)] font-bold mb-1.5">{label}</div>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-4">
          <span className="text-[var(--text-tertiary)]">Avg return</span>
          <span className={d.mean >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}>
            {d.mean >= 0 ? '+' : ''}{d.mean.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[var(--text-tertiary)]">Std dev</span>
          <span className="text-[var(--text-secondary)]">±{d.stdev.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[var(--text-tertiary)]">Hit rate</span>
          <span className="text-[var(--text-secondary)]">{(d.hitRate * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[var(--text-tertiary)]">Samples</span>
          <span className="text-[var(--text-secondary)]">{d.count}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[var(--text-tertiary)]">Best</span>
          <span className="text-[var(--positive)]">+{d.best.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[var(--text-tertiary)]">Worst</span>
          <span className="text-[var(--negative)]">{d.worst.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}

function BucketChart({
  data, title,
}: { data: SeasonalityBucket[]; title: string }) {
  const maxAbs = Math.max(...data.map(d => Math.abs(d.mean)), 0.1);
  const domain: [number, number] = [-(maxAbs * 1.6), maxAbs * 1.6];

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-4">{title}</div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 16, right: 4, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={domain}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false} tickLine={false}
            tickFormatter={(v: unknown) => `${typeof v === 'number' ? v.toFixed(1) : v}%`}
            width={38}
          />
          <Tooltip content={<SeasonTooltip />} cursor={{ fill: MUTED }} />
          <ReferenceLine y={0} stroke="var(--border-normal)" strokeWidth={1} />
          <Bar dataKey="mean" radius={[3, 3, 0, 0]} maxBarSize={40}>
            <ErrorBar dataKey="stdev" width={4} strokeWidth={1.5} stroke="rgba(255,255,255,0.3)" direction="y" />
            {data.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.mean)} fillOpacity={0.75 + Math.min(Math.abs(entry.mean) / (maxAbs * 2), 0.25)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stat row */}
      <div className="mt-3 grid gap-0" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {data.map(d => (
          <div key={d.label} className="flex flex-col items-center gap-0.5 border-r border-[var(--border-subtle)] last:border-r-0 px-1">
            <span className={`text-[10px] font-mono font-semibold tabular-nums ${d.mean >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
              {d.mean >= 0 ? '+' : ''}{d.mean.toFixed(2)}%
            </span>
            <span className="text-[9px] font-mono text-[var(--text-tertiary)]">
              {(d.hitRate * 100).toFixed(0)}% up
            </span>
            <span className="text-[9px] font-mono text-[var(--text-tertiary)]">
              n={d.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeasonalitySection({ ticker }: Props) {
  const { data, isLoading, isError } = useQuery<SeasonalityData>({
    queryKey: ['seasonality', ticker],
    queryFn: async () => {
      const r = await fetch(`/api/seasonality/${encodeURIComponent(ticker)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json() as SeasonalityData & { error?: string };
      if ('error' in json) throw new Error(json.error);
      return json;
    },
    staleTime: 86_400_000,
    retry: 3,
    retryDelay: attempt => Math.min(2000 * 2 ** attempt, 15000),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (isError || !data || 'error' in data) {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-[11px] font-mono text-[var(--text-tertiary)]">
        Seasonality unavailable — could not fetch max history.
      </div>
    );
  }

  const years = Math.round(
    (new Date(data.lastDate).getTime() - new Date(data.firstDate).getTime()) / (365.25 * 86_400_000)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
            Historical Seasonality · {data.totalBars.toLocaleString()} trading days · {years}yr sample
          </div>
          <div className="text-[9px] font-mono text-[var(--text-tertiary)] mt-0.5">
            {data.firstDate} → {data.lastDate}
          </div>
        </div>
        <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
          Past patterns ≠ future returns
        </span>
      </div>

      <BucketChart data={data.dow} title="Average Daily Return by Day of Week (log return %)" />
      <BucketChart data={data.moy} title="Average Monthly Return by Month of Year (log return %)" />

      <div className="text-[10px] font-mono text-[var(--text-tertiary)] leading-relaxed px-1">
        Log returns computed from adjusted close prices. Bars show the mean; whiskers show ±1σ.
        Hit rate = % of periods that closed positive. Patterns are statistical summaries of history only —
        they do not account for regime changes, macro shifts, or survivorship bias.
      </div>
    </div>
  );
}
