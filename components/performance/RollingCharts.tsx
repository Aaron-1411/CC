'use client';

import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { calcRollingSeries } from '@/lib/analytics/benchmark';
import type { RollingPoint } from '@/lib/analytics/benchmark';

type Window = 30 | 90 | 252;
type Metric = 'sharpe' | 'volatility' | 'sortino';

const WINDOW_LABELS: { value: Window; label: string }[] = [
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
  { value: 252, label: '252d' },
];

const METRIC_LABELS: { value: Metric; label: string }[] = [
  { value: 'sharpe', label: 'Sharpe' },
  { value: 'volatility', label: 'Volatility' },
  { value: 'sortino', label: 'Sortino' },
];

interface RollingChartsProps {
  portfolioValues: { date: Date; value: number }[];
  riskFreeRate: number;
}

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return d;
  }
}

export function RollingCharts({ portfolioValues, riskFreeRate }: RollingChartsProps) {
  const [window, setWindow] = useState<Window>(30);
  const [metric, setMetric] = useState<Metric>('sharpe');

  const rolling: RollingPoint[] = useMemo(() => {
    if (portfolioValues.length < 30) return [];
    return calcRollingSeries(portfolioValues, window, metric, riskFreeRate);
  }, [portfolioValues, window, metric, riskFreeRate]);

  const chartData = rolling.filter((p) => p.value !== null);

  if (portfolioValues.length < 30) {
    return (
      <div className="h-32 flex items-center justify-center text-[var(--text-tertiary)] text-sm font-mono">
        Need 30+ daily snapshots
      </div>
    );
  }

  const showRefLine = metric === 'sharpe' || metric === 'sortino';
  const isPctMetric = metric === 'volatility';
  const color = metric === 'volatility' ? 'var(--accent)' : '#23d18b';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {WINDOW_LABELS.map((w) => (
            <button
              key={w.value}
              onClick={() => setWindow(w.value)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors ${
                window === w.value
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-normal)]'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {METRIC_LABELS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMetric(m.value)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors ${
                metric === m.value
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-normal)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-[var(--text-tertiary)] text-sm font-mono">
          Insufficient data for {window}d window
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDate}
              tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-ibm-plex-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: unknown) =>
                isPctMetric ? `${(Number(v) * 100).toFixed(1)}%` : Number(v).toFixed(2)
              }
              tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-ibm-plex-mono)' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-overlay)',
                border: '1px solid var(--border-normal)',
                borderRadius: 8,
                fontFamily: 'var(--font-ibm-plex-mono)',
                fontSize: 11,
              }}
              labelFormatter={(label: unknown) => fmtDate(String(label))}
              formatter={(v: unknown) =>
                [isPctMetric ? `${(Number(v) * 100).toFixed(2)}%` : Number(v).toFixed(3), metric] as [string, string]
              }
            />
            {showRefLine && (
              <ReferenceLine y={0} stroke="var(--border-normal)" strokeDasharray="4 2" />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
