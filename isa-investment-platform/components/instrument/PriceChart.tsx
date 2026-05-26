'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Line, ResponsiveContainer,
} from 'recharts';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import type { OHLCVBar } from '@/types/market';

const RANGES = ['1D', '5D', '1M', '3M', '6M', '1Y', '2Y'] as const;
type Range = (typeof RANGES)[number];

const RANGE_TO_PARAMS: Record<Range, { interval: string; range: string }> = {
  '1D':  { interval: '2m',  range: '1d'  },
  '5D':  { interval: '15m', range: '5d'  },
  '1M':  { interval: '1d',  range: '1mo' },
  '3M':  { interval: '1d',  range: '3mo' },
  '6M':  { interval: '1d',  range: '6mo' },
  '1Y':  { interval: '1d',  range: '1y'  },
  '2Y':  { interval: '1wk', range: '2y'  },
};

interface Props { ticker: string; yfSymbol: string; }

export function PriceChart({ ticker, yfSymbol }: Props) {
  const [range, setRange] = useState<Range>('1M');
  const [showMA20, setShowMA20] = useState(false);
  const [showMA50, setShowMA50] = useState(false);
  const [showMA200, setShowMA200] = useState(false);

  const { interval, range: yRange } = RANGE_TO_PARAMS[range];
  const { data, isLoading } = useQuery<OHLCVBar[]>({
    queryKey: ['history', ticker, range],
    queryFn: () =>
      fetch(`/api/history/${encodeURIComponent(yfSymbol)}?interval=${interval}&range=${yRange}`)
        .then((r) => r.json()),
    staleTime: range === '1D' ? 60_000 : 4 * 3_600_000,
  });

  // Compute MAs
  function calcMA(bars: OHLCVBar[], window: number): (number | null)[] {
    return bars.map((_, i) => {
      if (i < window - 1) return null;
      const slice = bars.slice(i - window + 1, i + 1);
      return slice.reduce((s, b) => s + b.close, 0) / window;
    });
  }

  const bars: OHLCVBar[] = Array.isArray(data) ? data : ((data as unknown as { bars?: OHLCVBar[] } | null)?.bars ?? []);
  const ma20 = calcMA(bars, 20);
  const ma50 = calcMA(bars, 50);
  const ma200 = calcMA(bars, 200);

  const chartData = bars.map((b, i) => ({
    date: new Date(b.timestamp * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    close: b.close,
    volume: b.volume,
    ma20: ma20[i],
    ma50: ma50[i],
    ma200: ma200[i],
  }));

  const isPositive = bars.length >= 2 && bars[bars.length - 1].close >= bars[0].close;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded border flex-shrink-0 transition-colors ${
                range === r
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-normal)]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          {[{ label: '20D', show: showMA20, set: setShowMA20, color: '#f5a623' },
            { label: '50D', show: showMA50, set: setShowMA50, color: '#3d7eff' },
            { label: '200D', show: showMA200, set: setShowMA200, color: '#bc8cff' }].map(({ label, show, set, color }) => (
            <label key={label} className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-secondary)] cursor-pointer">
              <input type="checkbox" checked={show} onChange={(e) => set(e.target.checked)} className="w-3 h-3" />
              <span style={{ color }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {isLoading ? (
        <SkeletonCard className="h-52" />
      ) : chartData.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-[var(--text-tertiary)] text-sm">No data</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? 'var(--positive)' : 'var(--negative)'} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={isPositive ? 'var(--positive)' : 'var(--negative)'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-ibm-plex-mono)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-ibm-plex-mono)' }} axisLine={false} tickLine={false} width={55} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-normal)', borderRadius: 8, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11 }}
                labelStyle={{ color: 'var(--text-secondary)' }}
              />
              <Area type="monotone" dataKey="close" name="Price" stroke={isPositive ? 'var(--positive)' : 'var(--negative)'} strokeWidth={2} fill="url(#priceGrad)" dot={false} />
              {showMA20 && <Line type="monotone" dataKey="ma20" stroke="#f5a623" strokeWidth={1} dot={false} name="MA20" />}
              {showMA50 && <Line type="monotone" dataKey="ma50" stroke="#3d7eff" strokeWidth={1} dot={false} name="MA50" />}
              {showMA200 && <Line type="monotone" dataKey="ma200" stroke="#bc8cff" strokeWidth={1} dot={false} name="MA200" />}
            </ComposedChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={40}>
            <ComposedChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
              <YAxis tick={false} axisLine={false} tickLine={false} width={55} />
              <Bar dataKey="volume" fill="var(--text-tertiary)" fillOpacity={0.4} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
