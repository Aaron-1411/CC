'use client';
import { useMemo } from 'react';
import { BASELINE_SNAPSHOT, HOLDINGS_DEFINITION, ISA_ALLOWANCE_GBP, ISA_YEAR } from '@/lib/constants';

// Acquisition dates per position (cost basis comes from BASELINE_SNAPSHOT.positions[].costGBP)
const ACQUISITION_DATES: Record<string, { date: string; dividendYTD: number }> = {
  EQQQ:    { date: '2024-04-06', dividendYTD: 0 },
  VWRP:    { date: '2024-06-15', dividendYTD: 0 },
  VUAG:    { date: '2024-09-03', dividendYTD: 0 },
  'BRK.A': { date: '2024-11-20', dividendYTD: 0 },
  NVDA:    { date: '2025-01-08', dividendYTD: 0 },
  GOOGL:   { date: '2025-01-08', dividendYTD: 0 },
  AAPL:    { date: '2025-02-14', dividendYTD: 0 },
  SGLN:    { date: '2024-08-01', dividendYTD: 0 },
  ASML:    { date: '2025-03-01', dividendYTD: 0 },
  PLTR:    { date: '2025-02-28', dividendYTD: 0 },
  MSTR:    { date: '2025-01-15', dividendYTD: 0 },
};

function daysHeld(dateStr: string): number {
  const acquired = new Date(dateStr).getTime();
  const now = BASELINE_SNAPSHOT.date.getTime();
  return Math.floor((now - acquired) / 86_400_000);
}

function daysToNextApril5(): number {
  const now = BASELINE_SNAPSHOT.date;
  const year = now.getMonth() >= 3 && !(now.getMonth() === 3 && now.getDate() <= 5)
    ? now.getFullYear() + 1 : now.getFullYear();
  const next = new Date(year, 3, 5); // April 5
  return Math.floor((next.getTime() - now.getTime()) / 86_400_000);
}

export function TaxLotView() {
  const { lots, totalCost, totalUnrealisedGL, totalDividendYTD } = useMemo(() => {
    const lots = BASELINE_SNAPSHOT.positions.map(p => {
      const acq = ACQUISITION_DATES[p.ticker];
      // Use costGBP from snapshot (derived from T212 cost basis); fallback to valueGBP
      const costGBP = p.costGBP ?? p.valueGBP;
      const unrealisedGL = p.unrealisedGBP ?? (p.valueGBP - costGBP);
      const unrealisedPct = p.unrealisedPct ?? (costGBP > 0 ? (unrealisedGL / costGBP) * 100 : 0);
      return {
        ...p,
        date: acq?.date ?? '—',
        daysHeld: acq ? daysHeld(acq.date) : 0,
        costGBP,
        unrealisedGL,
        unrealisedPct,
        dividendYTD: acq?.dividendYTD ?? 0,
        name: HOLDINGS_DEFINITION.find(h => h.ticker === p.ticker)?.name ?? p.ticker,
      };
    }).sort((a, b) => b.unrealisedGL - a.unrealisedGL);

    const totalCost = lots.reduce((s, l) => s + l.costGBP, 0);
    const totalUnrealisedGL = lots.reduce((s, l) => s + l.unrealisedGL, 0);
    const totalDividendYTD = lots.reduce((s, l) => s + l.dividendYTD, 0);
    return { lots, totalCost, totalUnrealisedGL, totalDividendYTD };
  }, []);

  const isaUsed = BASELINE_SNAPSHOT.isaAllowanceUsedGBP;
  const isaRemaining = ISA_ALLOWANCE_GBP - isaUsed;
  const daysLeft = daysToNextApril5();
  const totalReturn = BASELINE_SNAPSHOT.totalUnrealisedPct;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Cost Basis</div>
          <div className="text-sm font-bold font-mono tabular-nums text-[var(--text-primary)]">£{BASELINE_SNAPSHOT.totalCostGBP.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Unrealised G/L</div>
          <div className={`text-sm font-bold font-mono tabular-nums ${BASELINE_SNAPSHOT.totalUnrealisedGBP >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
            {BASELINE_SNAPSHOT.totalUnrealisedGBP >= 0 ? '+' : ''}£{BASELINE_SNAPSHOT.totalUnrealisedGBP.toFixed(2)} ({totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%)
          </div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Dividends YTD</div>
          <div className="text-sm font-bold font-mono tabular-nums text-[var(--text-primary)]">£{totalDividendYTD.toFixed(2)}</div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">ISA Remaining {ISA_YEAR}</div>
          <div className="text-sm font-bold font-mono tabular-nums text-[var(--text-primary)]">£{isaRemaining.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</div>
          <div className="text-[10px] font-mono text-amber-400 mt-0.5">{daysLeft}d to Apr 5</div>
        </div>
      </div>

      {/* ISA usage bar */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">ISA Allowance {ISA_YEAR}</span>
          <span className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">£{isaUsed.toLocaleString()} / £{ISA_ALLOWANCE_GBP.toLocaleString()}</span>
        </div>
        <div className="bg-[var(--bg-overlay)] rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${Math.min((isaUsed / ISA_ALLOWANCE_GBP) * 100, 100)}%` }}
          />
        </div>
        <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
          {((isaUsed / ISA_ALLOWANCE_GBP) * 100).toFixed(1)}% used · {daysLeft} days until tax year end (April 5)
        </div>
      </div>

      {/* Tax lot table */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Position Detail</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['Ticker', 'Acquired', 'Days Held', 'Cost Basis', 'Market Value', 'Unrealised G/L', 'Return', 'Div YTD'].map(h => (
                  <th key={h} className="pb-1.5 pr-3 text-left text-[10px] text-[var(--text-tertiary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lots.map(l => (
                <tr key={l.ticker} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="py-1.5 pr-3 font-semibold text-[var(--text-primary)]">{l.ticker}</td>
                  <td className="py-1.5 pr-3 text-[var(--text-secondary)]">{l.date}</td>
                  <td className="py-1.5 pr-3 tabular-nums text-[var(--text-secondary)]">{l.daysHeld}</td>
                  <td className="py-1.5 pr-3 tabular-nums text-[var(--text-secondary)]">£{l.costGBP.toFixed(0)}</td>
                  <td className="py-1.5 pr-3 tabular-nums text-[var(--text-primary)]">£{l.valueGBP.toFixed(0)}</td>
                  <td className={`py-1.5 pr-3 tabular-nums font-semibold ${l.unrealisedGL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {l.unrealisedGL >= 0 ? '+' : ''}£{l.unrealisedGL.toFixed(0)}
                  </td>
                  <td className={`py-1.5 pr-3 tabular-nums ${l.unrealisedPct >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {l.unrealisedPct >= 0 ? '+' : ''}{l.unrealisedPct.toFixed(1)}%
                  </td>
                  <td className="py-1.5 tabular-nums text-[var(--text-secondary)]">
                    {l.dividendYTD > 0 ? `£${l.dividendYTD.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--border-subtle)]">
                <td colSpan={3} className="pt-2 text-[var(--text-tertiary)]">Total</td>
                <td className="pt-2 tabular-nums font-semibold text-[var(--text-primary)]">£{BASELINE_SNAPSHOT.totalCostGBP.toFixed(2)}</td>
                <td className="pt-2 tabular-nums font-semibold text-[var(--text-primary)]">£{BASELINE_SNAPSHOT.totalValueGBP.toFixed(2)}</td>
                <td className={`pt-2 tabular-nums font-semibold ${BASELINE_SNAPSHOT.totalUnrealisedGBP >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  +£{BASELINE_SNAPSHOT.totalUnrealisedGBP.toFixed(2)}
                </td>
                <td className={`pt-2 tabular-nums font-semibold text-[var(--positive)]`}>
                  +{BASELINE_SNAPSHOT.totalUnrealisedPct.toFixed(2)}%
                </td>
                <td className="pt-2 tabular-nums text-[var(--text-primary)]">£{totalDividendYTD.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-2">
          All holdings within ISA wrapper — gains and dividends are tax-free. Cost basis is estimated; connect a broker API for exact lot-level data.
        </div>
      </div>
    </div>
  );
}
