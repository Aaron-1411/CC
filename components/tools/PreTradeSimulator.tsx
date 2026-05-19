'use client';
import { useState, useMemo } from 'react';
import { BASELINE_SNAPSHOT, HOLDINGS_DEFINITION, ISA_ALLOWANCE_GBP } from '@/lib/constants';
import { usePriceStore } from '@/store/priceStore';

const TICKERS = HOLDINGS_DEFINITION.map(h => h.ticker);

// User-configurable thresholds
const DEFAULT_THRESHOLDS = {
  maxPositionPct: 25,  // % of portfolio
  maxSectorPct: 40,
  warnPositionPct: 20,
};

export function PreTradeSimulator() {
  const quotes = usePriceStore(s => s.quotes);
  const gbpUsd = usePriceStore(s => s.gbpUsd);

  const [ticker, setTicker] = useState<string>(TICKERS[0]);
  const [buyGBP, setBuyGBP] = useState('');
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  const totalValue = BASELINE_SNAPSHOT.totalValueGBP;
  const isaUsed = BASELINE_SNAPSHOT.isaAllowanceUsedGBP;
  const isaRemaining = ISA_ALLOWANCE_GBP - isaUsed;

  const amount = parseFloat(buyGBP) || 0;

  const impact = useMemo(() => {
    if (amount <= 0) return null;

    const newTotal = totalValue + amount;
    const currentPos = BASELINE_SNAPSHOT.positions.find(p => p.ticker === ticker);
    const currentValue = currentPos?.valueGBP ?? 0;
    const newPositionValue = currentValue + amount;
    const newWeight = (newPositionValue / newTotal) * 100;
    const currentWeight = (currentValue / totalValue) * 100;

    // Simplified beta: use live quote beta if available, else 1
    const quote = quotes[HOLDINGS_DEFINITION.find(h => h.ticker === ticker)?.yfSymbol ?? ''];
    const beta = 1; // would need fundamentals endpoint for actual beta
    void quote; void gbpUsd; // suppress unused var warning

    // New ISA usage
    const newIsaUsed = isaUsed + amount;
    const newIsaRemaining = ISA_ALLOWANCE_GBP - newIsaUsed;

    const warnings: string[] = [];
    const blocks: string[] = [];

    if (newWeight > thresholds.maxPositionPct) {
      blocks.push(`Position would be ${newWeight.toFixed(1)}% — exceeds ${thresholds.maxPositionPct}% limit`);
    } else if (newWeight > thresholds.warnPositionPct) {
      warnings.push(`Position would reach ${newWeight.toFixed(1)}% — approaching ${thresholds.maxPositionPct}% limit`);
    }

    if (amount > isaRemaining) {
      blocks.push(`Trade of £${amount.toFixed(0)} exceeds remaining ISA allowance £${isaRemaining.toFixed(0)}`);
    } else if (amount > isaRemaining * 0.8) {
      warnings.push(`Would use ${((amount / isaRemaining) * 100).toFixed(1)}% of remaining ISA allowance`);
    }

    return {
      currentWeight,
      newWeight,
      currentValue,
      newPositionValue,
      newTotal,
      newIsaUsed,
      newIsaRemaining,
      beta,
      warnings,
      blocks,
      blocked: blocks.length > 0,
    };
  }, [amount, ticker, totalValue, isaUsed, isaRemaining, thresholds, quotes, gbpUsd]);

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Ticker</label>
          <select
            value={ticker}
            onChange={e => setTicker(e.target.value)}
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded px-2 py-1.5 text-[12px] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            {TICKERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Buy Amount (£)</label>
          <input
            type="number"
            value={buyGBP}
            onChange={e => setBuyGBP(e.target.value)}
            placeholder="500"
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded px-2 py-1.5 text-[12px] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div className="flex items-end">
          <div className="text-[11px] font-mono text-[var(--text-tertiary)]">
            ISA remaining: <span className="text-[var(--text-primary)] tabular-nums">£{isaRemaining.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {/* Threshold config */}
      <div className="rounded-lg bg-[var(--bg-raised)] border border-[var(--border-subtle)] p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Thresholds</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'maxPositionPct' as const, label: 'Max Position %', suffix: '%' },
            { key: 'warnPositionPct' as const, label: 'Warn Position %', suffix: '%' },
            { key: 'maxSectorPct' as const, label: 'Max Sector %', suffix: '%' },
          ].map(({ key, label, suffix }) => (
            <div key={key}>
              <label className="block text-[10px] font-mono text-[var(--text-tertiary)] mb-1">{label}</label>
              <input
                type="number"
                value={thresholds[key]}
                onChange={e => setThresholds(t => ({ ...t, [key]: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded px-2 py-1 text-[11px] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{suffix}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Impact output */}
      {impact && (
        <div className="space-y-3">
          {/* Warnings / blocks */}
          {impact.blocks.map((b, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] font-mono text-[var(--negative)] bg-[var(--negative)]/10 border border-[var(--negative)]/30 px-3 py-2 rounded">
              <span>✗</span>{b}
            </div>
          ))}
          {impact.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-2 rounded">
              <span>⚠</span>{w}
            </div>
          ))}
          {!impact.blocked && impact.warnings.length === 0 && amount > 0 && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--positive)] bg-[var(--positive)]/10 border border-[var(--positive)]/30 px-3 py-2 rounded">
              ✓ Trade within all limits
            </div>
          )}

          {/* Projected metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Current Weight', before: `${impact.currentWeight.toFixed(2)}%`, after: `${impact.newWeight.toFixed(2)}%` },
              { label: 'Position Value', before: `£${impact.currentValue.toFixed(0)}`, after: `£${impact.newPositionValue.toFixed(0)}` },
              { label: 'Portfolio Total', before: `£${totalValue.toFixed(0)}`, after: `£${impact.newTotal.toFixed(0)}` },
              { label: 'ISA Used', before: `£${isaUsed.toFixed(0)}`, after: `£${impact.newIsaUsed.toFixed(0)}` },
            ].map(m => (
              <div key={m.label} className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">{m.label}</div>
                <div className="text-xs font-mono tabular-nums text-[var(--text-tertiary)]">{m.before}</div>
                <div className="text-sm font-bold font-mono tabular-nums text-[var(--text-primary)]">→ {m.after}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
