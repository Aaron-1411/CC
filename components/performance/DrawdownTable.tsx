'use client';

import type { DrawdownPeriod } from '@/lib/analytics/benchmark';

interface DrawdownTableProps {
  topDrawdowns: DrawdownPeriod[];
  ulcerIndex: number;
  pctTimeBelowHWM: number;
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

export function DrawdownTable({
  topDrawdowns,
  ulcerIndex,
  pctTimeBelowHWM,
}: DrawdownTableProps) {
  if (topDrawdowns.length === 0) {
    return (
      <div className="text-[var(--text-tertiary)] text-sm font-mono py-4 text-center">
        No significant drawdown periods found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
            Ulcer Index
          </div>
          <div className="font-mono tabular-nums text-sm text-[var(--text-primary)]">
            {fmtPct(ulcerIndex)}
          </div>
          <div className="text-[9px] font-mono text-[var(--text-tertiary)] mt-0.5">
            RMS of drawdown depths
          </div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
            % Time Below HWM
          </div>
          <div className="font-mono tabular-nums text-sm text-[var(--text-primary)]">
            {fmtPct(pctTimeBelowHWM)}
          </div>
          <div className="text-[9px] font-mono text-[var(--text-tertiary)] mt-0.5">
            Days under high-water mark
          </div>
        </div>
      </div>

      {/* Drawdown table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              {['Rank', 'Start', 'Trough', 'End', 'Depth', 'Duration', 'Recovery', 'Status'].map((h) => (
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
            {topDrawdowns.map((dd) => (
              <tr key={dd.rank} className="border-b border-[var(--border-subtle)]">
                <td className="py-1.5 pr-4 text-[var(--text-tertiary)]">#{dd.rank}</td>
                <td className="py-1.5 pr-4 tabular-nums text-[var(--text-secondary)]">
                  {dd.startDate}
                </td>
                <td className="py-1.5 pr-4 tabular-nums text-[var(--text-secondary)]">
                  {dd.troughDate}
                </td>
                <td className="py-1.5 pr-4 tabular-nums text-[var(--text-secondary)]">
                  {dd.endDate ?? '—'}
                </td>
                <td className="py-1.5 pr-4 tabular-nums text-[var(--negative)] font-semibold">
                  {fmtPct(dd.depth)}
                </td>
                <td className="py-1.5 pr-4 tabular-nums text-[var(--text-primary)]">
                  {dd.durationDays}d
                </td>
                <td className="py-1.5 pr-4 tabular-nums text-[var(--text-secondary)]">
                  {dd.recoveryDays !== null ? `${dd.recoveryDays}d` : '—'}
                </td>
                <td className="py-1.5">
                  {dd.isActive ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--negative)]/20 text-[var(--negative)] border border-[var(--negative)]/30">
                      Active
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--positive)]/20 text-[var(--positive)] border border-[var(--positive)]/30">
                      Recovered
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
