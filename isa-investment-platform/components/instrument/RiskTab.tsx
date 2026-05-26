'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BASELINE_SNAPSHOT, HOLDINGS_DEFINITION, ISA_ALLOWANCE_GBP } from '@/lib/constants';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { fetchJson } from '@/lib/fetchJson';

interface Props { ticker: string; yfSymbol: string; }

const STRESS_SCENARIOS: { name: string; label: string; shocks: Record<string, number> }[] = [
  { name: '2008 GFC',        label: '−40% broad',  shocks: { EQQQ: -0.42, VWRP: -0.40, VUAG: -0.40, 'BRK.A': -0.35, NVDA: -0.55, GOOGL: -0.38, AAPL: -0.50, SGLN: 0.05, ASML: -0.45, MSTR: -0.65, PLTR: -0.65 } },
  { name: '2020 COVID',      label: '−34% peak',   shocks: { EQQQ: -0.28, VWRP: -0.32, VUAG: -0.31, 'BRK.A': -0.25, NVDA: -0.30, GOOGL: -0.25, AAPL: -0.25, SGLN: 0.08, ASML: -0.30, MSTR: -0.50, PLTR: -0.50 } },
  { name: '2022 Inflation',  label: '−20% tech',   shocks: { EQQQ: -0.33, VWRP: -0.18, VUAG: -0.20, 'BRK.A': -0.04, NVDA: -0.60, GOOGL: -0.39, AAPL: -0.27, SGLN: -0.02, ASML: -0.42, MSTR: -0.74, PLTR: -0.65 } },
  { name: '2000 Dotcom',     label: '−78% Nasdaq', shocks: { EQQQ: -0.65, VWRP: -0.45, VUAG: -0.48, 'BRK.A': 0.05,  NVDA: -0.75, GOOGL: -0.70, AAPL: -0.70, SGLN: 0.12, ASML: -0.70, MSTR: -0.80, PLTR: -0.80 } },
  { name: 'Brexit Vote',     label: '2016 GBP+5%', shocks: { EQQQ: -0.05, VWRP: -0.03, VUAG: -0.03, 'BRK.A': 0.04,  NVDA: 0.04,  GOOGL: 0.04,  AAPL: 0.04,  SGLN: 0.08, ASML: 0.02,  MSTR: -0.05, PLTR: -0.05 } },
];

export function RiskTab({ ticker, yfSymbol }: Props) {
  const { data: corrRaw } = useQuery({
    queryKey: ['analytics', 'correlation'],
    queryFn: () => fetchJson('/api/analytics/correlation'),
    staleTime: 3_600_000,
  });
  const { data: riskRaw, isLoading } = useQuery({
    queryKey: ['analytics', 'risk'],
    queryFn: () => fetchJson('/api/analytics/risk'),
    staleTime: 60_000,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const corr: { tickers: string[]; matrix: number[][] } | null = (corrRaw as any)?.correlation ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const risk = (riskRaw as any)?.metrics ?? null;

  // Position data from baseline
  const totalValue = BASELINE_SNAPSHOT.totalValueGBP;
  const pos = BASELINE_SNAPSHOT.positions.find(p => p.ticker === ticker);
  const posValue = pos?.valueGBP ?? 0;
  const weight = totalValue > 0 ? posValue / totalValue : 0;

  // Marginal VaR: position weight × portfolio VaR (simplified linear approximation)
  const portfolioVar95 = risk?.var95_1d ?? null;
  const marginalVaR = portfolioVar95 != null ? portfolioVar95 * weight : null;

  // Stress scenarios for this position
  const scenarios = STRESS_SCENARIOS.map(s => ({
    name: s.name,
    label: s.label,
    shock: s.shocks[ticker] ?? 0,
    impactGBP: posValue * (s.shocks[ticker] ?? 0),
  }));

  // Correlation row for this ticker
  const tickerIdx = corr?.tickers.findIndex(t => t === ticker) ?? -1;
  const corrRow = tickerIdx >= 0 && corr ? corr.tickers.map((t, j) => ({ ticker: t, corr: corr.matrix[tickerIdx][j] })).filter(x => x.ticker !== ticker) : [];

  // Conviction sizer state
  const [conviction, setConviction] = useState(3);
  const [targetVol, setTargetVol] = useState(15);

  // Estimated per-position vol from stress scenarios (rough proxy)
  const gfcShock = Math.abs(STRESS_SCENARIOS[0].shocks[ticker] ?? 0.4);
  const impliedAnnualVol = gfcShock * 100 / 2.33; // GFC shock ≈ 2.33σ tail event

  // Inverse-volatility weight × conviction scalar (1=half, 3=neutral, 5=double)
  const convictionScalar = [0.5, 0.75, 1.0, 1.5, 2.0][conviction - 1];
  const isaRemaining = ISA_ALLOWANCE_GBP - BASELINE_SNAPSHOT.isaAllowanceUsedGBP;
  const suggestedPct = Math.min((targetVol / Math.max(impliedAnnualVol, 5)) * 100 * convictionScalar, 25);
  const suggestedGBP = (suggestedPct / 100) * totalValue;
  const suggestedOfRemaining = isaRemaining > 0 ? (suggestedGBP / isaRemaining) * 100 : 0;
  const sizeStatus = suggestedPct > 20 ? 'neg' : suggestedPct > 12 ? 'warn' : 'ok';

  if (isLoading) return <SkeletonCard className="h-48" />;

  return (
    <div className="space-y-4">
      {/* Position sizing */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Portfolio Weight</div>
          <div className="text-sm font-bold font-mono tabular-nums text-[var(--text-primary)]">{(weight * 100).toFixed(2)}%</div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">£{posValue.toFixed(0)} of £{totalValue.toFixed(0)}</div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Marginal VaR (95%)</div>
          <div className="text-sm font-bold font-mono tabular-nums text-[var(--negative)]">
            {marginalVaR != null ? `£${marginalVaR.toFixed(2)}` : '—'}
          </div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">Weight × portfolio VaR</div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Portfolio VaR (95%)</div>
          <div className="text-sm font-bold font-mono tabular-nums text-[var(--negative)]">
            {risk?.var95_1d != null ? `£${risk.var95_1d.toFixed(2)}` : '—'}
          </div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">1-day historical</div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Holding</div>
          <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
            {HOLDINGS_DEFINITION.find(h => h.ticker === ticker)?.type ?? '—'}
          </div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">{HOLDINGS_DEFINITION.find(h => h.ticker === ticker)?.exchange}</div>
        </div>
      </div>

      {/* Stress scenarios */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Stress Scenarios — Position Impact</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['Scenario', 'Context', 'Shock', 'Impact (£)'].map(h => (
                  <th key={h} className="pb-1.5 pr-4 text-left text-[10px] text-[var(--text-tertiary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarios.map(s => (
                <tr key={s.name} className="border-b border-[var(--border-subtle)]">
                  <td className="py-1.5 pr-4 text-[var(--text-secondary)]">{s.name}</td>
                  <td className="py-1.5 pr-4 text-[var(--text-tertiary)]">{s.label}</td>
                  <td className={`py-1.5 pr-4 tabular-nums ${s.shock >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {s.shock >= 0 ? '+' : ''}{(s.shock * 100).toFixed(0)}%
                  </td>
                  <td className={`py-1.5 tabular-nums font-semibold ${s.impactGBP >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {s.impactGBP >= 0 ? '+' : ''}£{s.impactGBP.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correlation to other holdings */}
      {corrRow.length > 0 && (
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Correlation to Portfolio</div>
          <div className="flex flex-wrap gap-2">
            {corrRow.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr)).map(({ ticker: t, corr: c }) => {
              const bg = c >= 0.7 ? 'bg-[#f05252]/20 border-[#f05252]/30 text-[#f05252]'
                : c >= 0.4 ? 'bg-[#fb923c]/20 border-[#fb923c]/30 text-[#fb923c]'
                : c <= -0.4 ? 'bg-[#3d7eff]/20 border-[#3d7eff]/30 text-[#3d7eff]'
                : 'bg-[var(--bg-overlay)] border-[var(--border-subtle)] text-[var(--text-secondary)]';
              return (
                <div key={t} className={`px-2 py-1 rounded border text-[11px] font-mono tabular-nums ${bg}`}>
                  {t}: {c.toFixed(2)}
                </div>
              );
            })}
          </div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-2">
            Red ≥0.7 (high correlation) · Orange ≥0.4 · Blue ≤−0.4 (negative)
          </div>
        </div>
      )}
      {corrRow.length === 0 && (
        <div className="text-[11px] font-mono text-[var(--text-tertiary)]">Correlation data requires 10+ daily snapshots.</div>
      )}

      {/* Conviction Sizer */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Conviction Sizer</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">Conviction</label>
                <span className="text-[11px] font-mono text-[var(--text-primary)]">
                  {['Low', 'Below avg', 'Average', 'High', 'Very high'][conviction - 1]}
                </span>
              </div>
              <input
                type="range" min={1} max={5} step={1} value={conviction}
                onChange={e => setConviction(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[9px] font-mono text-[var(--text-tertiary)] mt-0.5">
                <span>½× size</span><span>¾×</span><span>1×</span><span>1.5×</span><span>2×</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">Target Volatility</label>
                <span className="text-[11px] font-mono text-[var(--text-primary)]">{targetVol}% p.a.</span>
              </div>
              <input
                type="range" min={5} max={30} step={1} value={targetVol}
                onChange={e => setTargetVol(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[9px] font-mono text-[var(--text-tertiary)] mt-0.5">
                <span>5% (conservative)</span><span>30% (aggressive)</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="rounded bg-[var(--bg-raised)] border border-[var(--border-subtle)] p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Implied vol (GFC proxy)</span>
                <span className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">{impliedAnnualVol.toFixed(1)}% p.a.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Suggested weight</span>
                <span className={`text-sm font-bold font-mono tabular-nums ${sizeStatus === 'neg' ? 'text-[var(--negative)]' : sizeStatus === 'warn' ? 'text-amber-400' : 'text-[var(--positive)]'}`}>
                  {suggestedPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Suggested £</span>
                <span className="text-sm font-bold font-mono tabular-nums text-[var(--text-primary)]">£{suggestedGBP.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">% of ISA remaining</span>
                <span className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">{suggestedOfRemaining.toFixed(1)}%</span>
              </div>
            </div>
            {sizeStatus === 'neg' && (
              <div className="text-[10px] font-mono text-[var(--negative)] bg-[var(--negative)]/10 border border-[var(--negative)]/30 px-2 py-1.5 rounded">
                ⚠ Exceeds 20% single-position guideline — consider reducing
              </div>
            )}
            {sizeStatus === 'warn' && (
              <div className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-1.5 rounded">
                Approaching concentration threshold
              </div>
            )}
            <div className="text-[9px] font-mono text-[var(--text-tertiary)] leading-relaxed">
              Inverse-vol sizing: target_vol / implied_vol × conviction scalar. GFC shock used as implied vol proxy. Capped at 25%. Not investment advice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
