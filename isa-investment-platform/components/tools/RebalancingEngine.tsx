'use client';
import { useState, useMemo } from 'react';
import { BASELINE_SNAPSHOT, HOLDINGS_DEFINITION } from '@/lib/constants';

type TargetMap = Record<string, string>;

const DEFAULT_TARGETS: TargetMap = {
  EQQQ:  '18',
  VWRP:  '18',
  VUAG:  '15',
  'BRK.A': '12',
  NVDA:  '10',
  GOOGL: '8',
  AAPL:  '7',
  SGLN:  '5',
  ASML:  '3',
  MSTR:  '2',
  PLTR:  '2',
};

// Pairs with correlation above 0.7 (high): flag for sizing awareness
const HIGH_CORR_PAIRS = new Set(['EQQQ-VUAG', 'VUAG-EQQQ', 'NVDA-MSTR', 'MSTR-NVDA']);

function corrWarning(ticker: string): boolean {
  return Array.from(HIGH_CORR_PAIRS).some(pair => pair.startsWith(ticker + '-'));
}

export function RebalancingEngine() {
  const [targets, setTargets] = useState<TargetMap>(DEFAULT_TARGETS);

  const totalValue = BASELINE_SNAPSHOT.totalValueGBP;

  const { trades, totalBuys, totalSells, totalSum } = useMemo(() => {
    const trades = BASELINE_SNAPSHOT.positions.map(p => {
      const targetPct = parseFloat(targets[p.ticker] ?? '0') || 0;
      const currentPct = (p.valueGBP / totalValue) * 100;
      const drift = currentPct - targetPct;
      const targetValue = (targetPct / 100) * totalValue;
      const tradeGBP = targetValue - p.valueGBP;

      return {
        ticker: p.ticker,
        name: HOLDINGS_DEFINITION.find(h => h.ticker === p.ticker)?.name ?? p.ticker,
        currentPct,
        targetPct,
        drift,
        currentValue: p.valueGBP,
        targetValue,
        tradeGBP,
        corrFlag: corrWarning(p.ticker),
      };
    }).sort((a, b) => Math.abs(b.tradeGBP) - Math.abs(a.tradeGBP));

    const totalSum = Object.values(targets).reduce((s, v) => s + (parseFloat(v) || 0), 0);
    const totalBuys = trades.filter(t => t.tradeGBP > 0).reduce((s, t) => s + t.tradeGBP, 0);
    const totalSells = trades.filter(t => t.tradeGBP < 0).reduce((s, t) => s + Math.abs(t.tradeGBP), 0);

    return { trades, totalBuys, totalSells, totalSum };
  }, [targets, totalValue]);

  const targetError = Math.abs(totalSum - 100) > 0.5;

  return (
    <div className="space-y-4">
      {/* Target allocation inputs */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Target Weights (%)</span>
          <span className={`text-[10px] font-mono tabular-nums ${targetError ? 'text-[var(--negative)]' : 'text-[var(--positive)]'}`}>
            Total: {totalSum.toFixed(1)}% {targetError ? '⚠ must equal 100%' : '✓'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {BASELINE_SNAPSHOT.positions.map(p => (
            <div key={p.ticker} className="flex items-center gap-2">
              <span className="w-12 font-mono text-[11px] text-[var(--text-secondary)] flex-shrink-0">{p.ticker}</span>
              <input
                type="number"
                value={targets[p.ticker] ?? '0'}
                onChange={e => setTargets(t => ({ ...t, [p.ticker]: e.target.value }))}
                className="w-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded px-2 py-1 text-[11px] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                min="0"
                max="100"
                step="0.5"
              />
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Total Buys</div>
          <div className="text-sm font-bold font-mono tabular-nums text-[var(--positive)]">+£{totalBuys.toFixed(0)}</div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Total Sells</div>
          <div className="text-sm font-bold font-mono tabular-nums text-[var(--negative)]">-£{totalSells.toFixed(0)}</div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Net Cash Flow</div>
          <div className={`text-sm font-bold font-mono tabular-nums ${totalBuys - totalSells >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
            {totalBuys - totalSells >= 0 ? '+' : ''}£{(totalBuys - totalSells).toFixed(0)}
          </div>
        </div>
      </div>

      {/* Proposed trades table */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Proposed Trades</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['Ticker', 'Current', 'Target', 'Drift', 'Current £', 'Target £', 'Trade', ''].map(h => (
                  <th key={h} className="pb-1.5 pr-3 text-left text-[10px] text-[var(--text-tertiary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.ticker} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="py-1.5 pr-3 font-semibold text-[var(--text-primary)]">{t.ticker}</td>
                  <td className="py-1.5 pr-3 tabular-nums text-[var(--text-secondary)]">{t.currentPct.toFixed(1)}%</td>
                  <td className="py-1.5 pr-3 tabular-nums text-[var(--text-secondary)]">{t.targetPct.toFixed(1)}%</td>
                  <td className={`py-1.5 pr-3 tabular-nums ${Math.abs(t.drift) >= 3 ? (t.drift > 0 ? 'text-amber-400' : 'text-[var(--accent)]') : 'text-[var(--text-tertiary)]'}`}>
                    {t.drift >= 0 ? '+' : ''}{t.drift.toFixed(1)}%
                  </td>
                  <td className="py-1.5 pr-3 tabular-nums text-[var(--text-secondary)]">£{t.currentValue.toFixed(0)}</td>
                  <td className="py-1.5 pr-3 tabular-nums text-[var(--text-secondary)]">£{t.targetValue.toFixed(0)}</td>
                  <td className={`py-1.5 pr-3 tabular-nums font-semibold ${t.tradeGBP > 1 ? 'text-[var(--positive)]' : t.tradeGBP < -1 ? 'text-[var(--negative)]' : 'text-[var(--text-tertiary)]'}`}>
                    {Math.abs(t.tradeGBP) < 1 ? '—' : `${t.tradeGBP > 0 ? 'BUY +' : 'SELL '}£${Math.abs(t.tradeGBP).toFixed(0)}`}
                  </td>
                  <td className="py-1.5">
                    {t.corrFlag && (
                      <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1 py-0.5 rounded">
                        HIGH CORR
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-2">
          Drift ≥3% highlighted. HIGH CORR: position has ≥0.7 correlation with another holding — consider sizing down. ISA trades incur no CGT.
        </div>
      </div>
    </div>
  );
}
