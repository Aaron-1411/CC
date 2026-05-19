'use client';
import { usePortfolio } from '@/hooks/usePortfolio';
import { BASELINE_SNAPSHOT, ISA_ALLOWANCE_GBP } from '@/lib/constants';

export default function PositionsPage() {
  const { positions, totalValueGBP } = usePortfolio();

  const isaUsed = BASELINE_SNAPSHOT.isaAllowanceUsedGBP;
  const usedPct = (isaUsed / ISA_ALLOWANCE_GBP) * 100;
  const remaining = ISA_ALLOWANCE_GBP - isaUsed;
  const totalCost = BASELINE_SNAPSHOT.totalCostGBP;
  const totalUnrealised = totalValueGBP - totalCost;
  const totalUnrealisedPct = (totalUnrealised / totalCost) * 100;

  // Days until 5 April (ISA year end)
  const now = new Date();
  const yearEnd = new Date(now.getFullYear() + (now.getMonth() >= 3 ? 1 : 0), 3, 5);
  const daysLeft = Math.ceil((yearEnd.getTime() - now.getTime()) / 86_400_000);
  const daysColor = daysLeft > 90 ? 'text-[var(--positive)]' : daysLeft > 30 ? 'text-amber-400' : 'text-[var(--negative)]';

  // Equal-weight rebalancing scenario
  const targetWeight = positions.length > 0 ? 1 / positions.length : 0;
  const rebalTrades = positions.map((p) => {
    const targetValue = totalValueGBP * targetWeight;
    const diff = targetValue - p.currentValueGBP;
    return {
      ticker: p.ticker,
      currentWeight: p.weight * 100,
      targetWeight: targetWeight * 100,
      deviation: (p.weight - targetWeight) * 100,
      tradeGBP: diff,
      action: diff > 50 ? 'BUY' : diff < -50 ? 'SELL' : 'HOLD',
    };
  }).sort((a, b) => Math.abs(b.tradeGBP) - Math.abs(a.tradeGBP));

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 max-w-[1200px]">
      <h1 className="text-lg font-bold text-[var(--text-primary)]">Positions</h1>

      {/* ISA allowance + portfolio summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">ISA Used</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[var(--accent)]">£{isaUsed.toLocaleString('en-GB')}</div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">{usedPct.toFixed(1)}% of £20,000</div>
          <div className="mt-2 w-full h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${Math.min(usedPct, 100)}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Remaining Allowance</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[var(--positive)]">£{remaining.toLocaleString('en-GB')}</div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">{daysLeft}d until 5 Apr</div>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Total Unrealised P&L</div>
          <div className={`text-xl font-bold font-mono tabular-nums ${totalUnrealised >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
            {totalUnrealised >= 0 ? '+' : '−'}£{Math.abs(totalUnrealised).toFixed(0)}
          </div>
          <div className={`text-[10px] font-mono mt-0.5 ${totalUnrealised >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
            {totalUnrealisedPct >= 0 ? '+' : ''}{totalUnrealisedPct.toFixed(2)}% on cost
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">ISA Year End</div>
          <div className={`text-xl font-bold font-mono tabular-nums ${daysColor}`}>{daysLeft}d</div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">
            {daysLeft > 90 ? 'Plenty of time' : daysLeft > 30 ? 'Use it or lose it' : 'Deadline approaching'}
          </div>
        </div>
      </div>

      {/* Position detail table */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Position Detail</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['Holding', 'Value', 'Weight', 'Cost Basis', 'Unrealised £', 'Unrealised %', 'Day %', 'Day £'].map((h) => (
                  <th key={h} className="pb-2 pr-4 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...positions].sort((a, b) => b.currentValueGBP - a.currentValueGBP).map((p) => {
                const dayPos = p.dailyChangeGBP >= 0;
                const pnlPos = (p.unrealisedPnLGBP ?? 0) >= 0;
                return (
                  <tr key={p.ticker} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-raised)] transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-[var(--text-primary)] text-xs">{p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name}</div>
                      <div className="font-mono text-[10px] text-[var(--text-tertiary)]">{p.ticker}</div>
                    </td>
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-sm text-[var(--text-primary)]">
                      £{p.currentValueGBP.toFixed(2)}
                    </td>
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-xs text-[var(--text-secondary)]">
                      {(p.weight * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-xs text-[var(--text-tertiary)]">
                      £{p.snapCostGBP.toFixed(2)}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono tabular-nums text-sm font-semibold ${pnlPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                      {p.unrealisedPnLGBP != null
                        ? `${pnlPos ? '+' : '−'}£${Math.abs(p.unrealisedPnLGBP).toFixed(2)}`
                        : '—'}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono tabular-nums text-xs font-semibold ${pnlPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                      {p.unrealisedPnLPct != null
                        ? `${p.unrealisedPnLPct >= 0 ? '+' : ''}${p.unrealisedPnLPct.toFixed(2)}%`
                        : '—'}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono tabular-nums text-xs ${dayPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                      {dayPos ? '+' : ''}{p.dailyPct.toFixed(2)}%
                    </td>
                    <td className={`py-2.5 font-mono tabular-nums text-xs ${dayPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                      {dayPos ? '+' : '−'}£{Math.abs(p.dailyChangeGBP).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--border-normal)]">
                <td className="pt-2 pr-4 text-[10px] font-mono text-[var(--text-tertiary)] font-semibold">TOTAL</td>
                <td className="pt-2 pr-4 font-mono tabular-nums text-sm font-bold text-[var(--text-primary)]">
                  £{totalValueGBP.toFixed(2)}
                </td>
                <td className="pt-2 pr-4 font-mono text-xs text-[var(--text-secondary)]">100%</td>
                <td className="pt-2 pr-4 font-mono tabular-nums text-xs text-[var(--text-tertiary)]">
                  £{totalCost.toFixed(2)}
                </td>
                <td className={`pt-2 pr-4 font-mono tabular-nums text-sm font-bold ${totalUnrealised >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {totalUnrealised >= 0 ? '+' : '−'}£{Math.abs(totalUnrealised).toFixed(2)}
                </td>
                <td className={`pt-2 pr-4 font-mono tabular-nums text-xs font-bold ${totalUnrealised >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {totalUnrealisedPct >= 0 ? '+' : ''}{totalUnrealisedPct.toFixed(2)}%
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Rebalancing workbench */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Equal-Weight Rebalancing Scenario</div>
        <div className="text-xs text-[var(--text-secondary)] mb-3">
          Target: 1/{positions.length} = {(targetWeight * 100).toFixed(1)}% each · Tolerance: ±2%
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['Holding', 'Current', 'Target', 'Drift', 'Trade £', 'Action'].map((h) => (
                  <th key={h} className="pb-2 pr-4 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rebalTrades.map((r) => (
                <tr key={r.ticker} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2 pr-4 font-mono text-xs text-[var(--text-secondary)]">{r.ticker}</td>
                  <td className="py-2 pr-4 font-mono tabular-nums text-xs text-[var(--text-secondary)]">{r.currentWeight.toFixed(1)}%</td>
                  <td className="py-2 pr-4 font-mono tabular-nums text-xs text-[var(--text-secondary)]">{r.targetWeight.toFixed(1)}%</td>
                  <td className={`py-2 pr-4 font-mono tabular-nums text-xs ${Math.abs(r.deviation) <= 2 ? 'text-[var(--positive)]' : Math.abs(r.deviation) <= 5 ? 'text-amber-400' : 'text-[var(--negative)]'}`}>
                    {r.deviation >= 0 ? '+' : ''}{r.deviation.toFixed(1)}%
                  </td>
                  <td className={`py-2 pr-4 font-mono tabular-nums text-xs ${r.tradeGBP >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {r.tradeGBP >= 0 ? '+' : ''}£{r.tradeGBP.toFixed(0)}
                  </td>
                  <td className="py-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      r.action === 'BUY' ? 'bg-[var(--positive)]/10 text-[var(--positive)] border-[var(--positive)]/30'
                      : r.action === 'SELL' ? 'bg-[var(--negative)]/10 text-[var(--negative)] border-[var(--negative)]/30'
                      : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                    }`}>
                      {r.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
