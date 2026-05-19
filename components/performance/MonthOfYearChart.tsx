'use client';

import { useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { calcMonthOfYearPerformance } from '@/lib/analytics/benchmark';
import type { MonthStats } from '@/lib/analytics/benchmark';

interface MonthOfYearChartProps {
  dailyValues: { date: Date; value: number }[];
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(3)}%`;
}

function fmtWin(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export function MonthOfYearChart({ dailyValues }: MonthOfYearChartProps) {
  const stats: MonthStats[] = useMemo(() => {
    if (dailyValues.length < 20) return [];
    return calcMonthOfYearPerformance(dailyValues);
  }, [dailyValues]);

  const handleExportCSV = useCallback(() => {
    if (stats.length === 0) return;
    const header = 'Month,Avg Return,Median Return,Win Rate,Std Dev,N';
    const rows = stats.map((s) =>
      [
        s.month,
        (s.avgReturn * 100).toFixed(4),
        (s.medianReturn * 100).toFixed(4),
        (s.winRate * 100).toFixed(2),
        (s.stdDev * 100).toFixed(4),
        s.n,
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'month-of-year-performance.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [stats]);

  if (dailyValues.length < 20) {
    return (
      <div className="h-24 flex items-center justify-center text-[var(--text-tertiary)] text-sm font-mono">
        Need at least 20 daily data points
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleExportCSV}
          className="px-2.5 py-1 text-[11px] font-mono rounded border transition-colors bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-normal)]"
        >
          Export CSV
        </button>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={stats} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-ibm-plex-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: unknown) => `${(Number(v) * 100).toFixed(2)}%`}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-ibm-plex-mono)' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-normal)',
              borderRadius: 8,
              fontFamily: 'var(--font-ibm-plex-mono)',
              fontSize: 11,
            }}
            formatter={(v: unknown, name: unknown) => [
              `${(Number(v) * 100).toFixed(3)}%`,
              String(name),
            ] as [string, string]}
          />
          <Bar dataKey="avgReturn" name="Avg Return" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {stats.map((s) => (
              <Cell
                key={s.month}
                fill={s.avgReturn >= 0 ? 'var(--positive)' : 'var(--negative)'}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              {['Month', 'Avg Return', 'Median', 'Win Rate', 'Std Dev', 'n'].map((h) => (
                <th
                  key={h}
                  className="pb-2 pr-4 text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.month} className="border-b border-[var(--border-subtle)]">
                <td className="py-1.5 pr-4 text-[var(--text-secondary)]">{s.month}</td>
                <td
                  className={`py-1.5 pr-4 tabular-nums ${
                    s.avgReturn >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'
                  }`}
                >
                  {fmtPct(s.avgReturn)}
                </td>
                <td
                  className={`py-1.5 pr-4 tabular-nums ${
                    s.medianReturn >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'
                  }`}
                >
                  {fmtPct(s.medianReturn)}
                </td>
                <td className="py-1.5 pr-4 tabular-nums text-[var(--text-primary)]">
                  {fmtWin(s.winRate)}
                </td>
                <td className="py-1.5 pr-4 tabular-nums text-[var(--text-tertiary)]">
                  {fmtPct(s.stdDev)}
                </td>
                <td className="py-1.5 tabular-nums text-[var(--text-tertiary)]">{s.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
