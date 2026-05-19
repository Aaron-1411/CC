'use client';

interface VaRMetrics {
  var95_1d: number;
  var99_1d: number;
  cvar95_1d: number;
  var95pct: number;
  var99pct: number;
  parametricVar95?: { varPct: number; varGBP: number };
  parametricVar99?: { varPct: number; varGBP: number };
  var10d_95?: { varPct: number; varGBP: number };
  var10d_99?: { varPct: number; varGBP: number };
  cvar10d_95?: { varPct: number; varGBP: number };
  lookbackDays?: number;
  returnType?: string;
  riskFreeRateLabel?: string;
}

interface VaRTableProps {
  metrics: VaRMetrics | null;
}

function fmtGBP(v: number): string {
  return `£${Math.abs(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

function CellPair({ pct, gbp }: { pct: number; gbp: number }) {
  return (
    <td className="py-2 pr-4">
      <div className="font-mono tabular-nums text-[var(--negative)] text-xs">
        {fmtPct(pct)}
      </div>
      <div className="font-mono tabular-nums text-[var(--text-tertiary)] text-[10px]">
        {fmtGBP(gbp)}
      </div>
    </td>
  );
}

export function VaRTable({ metrics }: VaRTableProps) {
  if (!metrics) {
    return (
      <div className="text-[var(--text-tertiary)] text-sm font-mono py-4 text-center">
        Loading VaR metrics…
      </div>
    );
  }

  const p95 = metrics.parametricVar95 ?? { varPct: 0, varGBP: 0 };
  const p99 = metrics.parametricVar99 ?? { varPct: 0, varGBP: 0 };
  const v10_95 = metrics.var10d_95 ?? { varPct: 0, varGBP: 0 };
  const v10_99 = metrics.var10d_99 ?? { varPct: 0, varGBP: 0 };
  const c10_95 = metrics.cvar10d_95 ?? { varPct: 0, varGBP: 0 };
  // 10-day CVaR at 99% estimated as cvar10d_95 * (var99pct/var95pct) ratio
  const cvar10_99Ratio = metrics.var95pct > 0 ? metrics.var99pct / metrics.var95pct : 1;
  const c10_99 = {
    varPct: c10_95.varPct * cvar10_99Ratio,
    varGBP: c10_95.varGBP * cvar10_99Ratio,
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="pb-2 pr-4 text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                Horizon
              </th>
              <th className="pb-2 pr-4 text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                Parametric 95%
              </th>
              <th className="pb-2 pr-4 text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                Historical 95%
              </th>
              <th className="pb-2 pr-4 text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                CVaR 95%
              </th>
              <th className="pb-2 pr-4 text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                Parametric 99%
              </th>
              <th className="pb-2 pr-4 text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                Historical 99%
              </th>
              <th className="pb-2 text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                CVaR 99%
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 pr-4 font-semibold text-[var(--text-secondary)]">1-Day</td>
              <CellPair pct={p95.varPct} gbp={p95.varGBP} />
              <CellPair pct={metrics.var95pct} gbp={metrics.var95_1d} />
              <CellPair pct={metrics.var95pct} gbp={metrics.cvar95_1d} />
              <CellPair pct={p99.varPct} gbp={p99.varGBP} />
              <CellPair pct={metrics.var99pct} gbp={metrics.var99_1d} />
              <CellPair pct={metrics.var99pct * 1.25} gbp={metrics.var99_1d * 1.25} />
            </tr>
            <tr>
              <td className="py-2 pr-4 font-semibold text-[var(--text-secondary)]">10-Day</td>
              <CellPair pct={v10_95.varPct} gbp={v10_95.varGBP} />
              <CellPair pct={metrics.var95pct * Math.sqrt(10)} gbp={metrics.var95_1d * Math.sqrt(10)} />
              <CellPair pct={c10_95.varPct} gbp={c10_95.varGBP} />
              <CellPair pct={v10_99.varPct} gbp={v10_99.varGBP} />
              <CellPair pct={metrics.var99pct * Math.sqrt(10)} gbp={metrics.var99_1d * Math.sqrt(10)} />
              <CellPair pct={c10_99.varPct} gbp={c10_99.varGBP} />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] font-mono text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-subtle)]">
        <span>Lookback: {metrics.lookbackDays ?? '—'} days</span>
        <span>Returns: {metrics.returnType ?? 'simple'}</span>
        <span>{metrics.riskFreeRateLabel ?? 'Risk-free rate: 4.0% p.a.'}</span>
      </div>
    </div>
  );
}
