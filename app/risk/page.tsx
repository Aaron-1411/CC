'use client';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { usePortfolio } from '@/hooks/usePortfolio';

interface RiskMetrics {
  var95_1d: number; var95pct: number;
  var99_1d: number; var99pct: number;
  cvar95_1d: number; cvar95pct: number;
  sharpe30d: number; sortino30d: number;
  maxDrawdown: number; currentDrawdown: number;
  currentPeak: number;
  volatility30d: number;
  drawdownSeries?: { date: string; drawdown: number }[];
}

interface MacroResponse {
  vixHistory?: { date: string; value: number }[];
}

function correlationColor(v: number): string {
  if (v >= 0.8) return '#f05252';
  if (v >= 0.5) return '#fb923c';
  if (v >= 0.2) return '#f5a623';
  if (v >= -0.2) return '#8896b0';
  if (v >= -0.5) return '#7b61ff';
  return '#3d7eff';
}

export default function RiskPage() {
  const { positions, totalValueGBP } = usePortfolio();

  const { data: riskRaw, isLoading: riskLoading } = useQuery<{ metrics: RiskMetrics | null }>({
    queryKey: ['analytics', 'risk'],
    queryFn: () => fetch('/api/analytics/risk').then((r) => r.json()),
    staleTime: 60_000,
  });
  const risk = riskRaw?.metrics ?? null;

  const { data: macro } = useQuery<MacroResponse>({
    queryKey: ['macro'],
    queryFn: () => fetch('/api/macro').then((r) => r.json()),
    staleTime: 3_600_000,
  });

  const { data: corrRaw } = useQuery<{ correlation: { tickers: string[]; matrix: number[][] } | null }>({
    queryKey: ['analytics', 'correlation'],
    queryFn: () => fetch('/api/analytics/correlation').then((r) => r.json()),
    staleTime: 3_600_000,
  });
  const corr = corrRaw?.correlation ?? null;

  const vixHistory = macro?.vixHistory ?? [];
  const vix = vixHistory.length > 0
    ? { value: vixHistory[vixHistory.length - 1].value, date: vixHistory[vixHistory.length - 1].date, series: vixHistory }
    : null;
  const vixRegime = vix
    ? vix.value < 15 ? { label: 'Low Volatility', color: 'text-[var(--positive)]', desc: 'Risk-on regime' }
      : vix.value < 25 ? { label: 'Normal', color: 'text-[var(--neutral)]', desc: 'Standard conditions' }
      : { label: 'High Volatility', color: 'text-[var(--negative)]', desc: 'Risk-off — review positions' }
    : null;

  // Scenario stress tests
  const scenariosBase = [
    { name: 'Tech selloff -20%', shocks: { EQQQ: -0.20, NVDA: -0.20, GOOGL: -0.15, AAPL: -0.15, ASML: -0.18 } },
    { name: 'GFC crash -40%', shocks: { EQQQ: -0.40, VWRP: -0.40, VUAG: -0.40, BRK_A: -0.35, NVDA: -0.45, GOOGL: -0.38, AAPL: -0.35, SGLN: 0.05, ASML: -0.42, MSTR: -0.60, PLTR: -0.55 } },
    { name: 'US recession SPX -30%', shocks: { EQQQ: -0.30, VWRP: -0.25, VUAG: -0.30, BRK_A: -0.22, NVDA: -0.35, GOOGL: -0.28, AAPL: -0.25, SGLN: 0.08, ASML: -0.30, MSTR: -0.45, PLTR: -0.40 } },
    { name: 'Gold crisis -25%', shocks: { SGLN: -0.25 } },
    { name: 'GBP strengthens 10%', shocks: { BRK_A: -0.10, NVDA: -0.10, GOOGL: -0.10, AAPL: -0.10, ASML: -0.10, MSTR: -0.10, PLTR: -0.10 } },
    { name: 'GBP weakens 10%', shocks: { BRK_A: 0.10, NVDA: 0.10, GOOGL: 0.10, AAPL: 0.10, ASML: 0.10, MSTR: 0.10, PLTR: 0.10 } },
    { name: 'Bitcoin crash MSTR -50%', shocks: { MSTR: -0.50 } },
  ];

  const scenarios = scenariosBase.map((s) => {
    let impact = 0;
    let worst = { ticker: '', loss: 0 };
    positions.forEach((p) => {
      const key = p.ticker.replace('.', '_');
      const shock = (s.shocks as Record<string, number>)[key] ?? (s.shocks as Record<string, number>)[p.ticker] ?? 0;
      const loss = p.currentValueGBP * shock;
      impact += loss;
      if (loss < worst.loss) worst = { ticker: p.ticker, loss };
    });
    return { ...s, impact, impactPct: totalValueGBP > 0 ? (impact / totalValueGBP) * 100 : 0, worst };
  });

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 max-w-[1200px]">
      <h1 className="text-lg font-bold text-[var(--text-primary)]">Risk</h1>

      {/* VaR headline cards */}
      {riskLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { label: 'VaR (95%, 1D)',   v: risk ? `£${Math.abs(risk.var95_1d).toFixed(0)}`  : '--', sub: risk ? `${(risk.var95pct * 100).toFixed(2)}%`  : '--', note: 'Historical sim.',   color: 'text-[var(--negative)]' },
            { label: 'VaR (99%, 1D)',   v: risk ? `£${Math.abs(risk.var99_1d).toFixed(0)}`  : '--', sub: risk ? `${(risk.var99pct * 100).toFixed(2)}%`  : '--', note: 'Historical sim.',   color: 'text-[var(--negative)]' },
            { label: 'CVaR (95%, 1D)',  v: risk ? `£${Math.abs(risk.cvar95_1d).toFixed(0)}` : '--', sub: risk ? `${(risk.cvar95pct * 100).toFixed(2)}%` : '--', note: 'Expected shortfall', color: 'text-[var(--negative)]' },
            { label: 'Current Drawdown',v: risk ? `${(risk.currentDrawdown * 100).toFixed(2)}%` : '--', sub: risk ? `Peak: £${risk.currentPeak.toFixed(0)}` : '--', note: 'From peak', color: 'text-[var(--negative)]' },
          ] as { label: string; v: string; sub: string; note: string; color: string }[]).map((c) => (
            <div key={c.label} className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">{c.label}</div>
              <div className={`text-xl font-bold font-mono tabular-nums ${c.color}`}>{c.v}</div>
              <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">{c.sub}</div>
              <div className="text-[10px] text-[var(--text-tertiary)] mt-1">{c.note}</div>
            </div>
          ))}
        </div>
      )}

      {/* VIX regime */}
      {vix && (
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Market Volatility Regime (VIX)</div>
            {vixRegime && (
              <div className={`text-sm font-bold font-mono ${vixRegime.color}`}>
                {vix.value.toFixed(2)} · {vixRegime.label} — {vixRegime.desc}
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={vix.series} margin={{ top: 2, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 9, fontFamily: 'var(--font-ibm-plex-mono)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
              <ReferenceLine y={15} stroke="var(--positive)" strokeDasharray="3 3" strokeWidth={1} />
              <ReferenceLine y={25} stroke="var(--negative)" strokeDasharray="3 3" strokeWidth={1} />
              <Area type="monotone" dataKey="value" stroke="var(--neutral)" strokeWidth={1.5} fill="var(--neutral-bg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Correlation matrix */}
      {corr && corr.tickers.length > 0 && (
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Correlation Matrix (90-day)</div>
          <div className="overflow-x-auto">
            <div className="inline-block">
              <div className="flex">
                <div className="w-14" />
                {corr.tickers.map((t) => (
                  <div key={t} className="w-10 text-[9px] font-mono text-[var(--text-tertiary)] text-center px-0.5 truncate">{t}</div>
                ))}
              </div>
              {corr.matrix.map((row, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-14 text-[9px] font-mono text-[var(--text-secondary)] truncate pr-1">{corr.tickers[i]}</div>
                  {row.map((v, j) => (
                    <div
                      key={j}
                      className="w-10 h-8 flex items-center justify-center text-[9px] font-mono tabular-nums rounded-sm m-0.5"
                      style={{ background: correlationColor(v) + '40', color: correlationColor(v) }}
                      title={`${corr.tickers[i]} × ${corr.tickers[j]}: ${v.toFixed(2)}`}
                    >
                      {v.toFixed(2)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stress testing */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Stress Test Scenarios</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['Scenario', 'Impact (£)', 'Impact (%)', 'Worst position'].map((h) => (
                  <th key={h} className="pb-2 pr-6 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.name} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2 pr-6 text-[var(--text-secondary)] text-xs">{s.name}</td>
                  <td className={`py-2 pr-6 font-mono tabular-nums text-xs ${s.impact >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {s.impact >= 0 ? '+' : ''}£{s.impact.toFixed(0)}
                  </td>
                  <td className={`py-2 pr-6 font-mono tabular-nums text-xs ${s.impactPct >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {s.impactPct >= 0 ? '+' : ''}{s.impactPct.toFixed(1)}%
                  </td>
                  <td className="py-2 font-mono text-xs text-[var(--text-secondary)]">
                    {s.worst.ticker ? `${s.worst.ticker} £${s.worst.loss.toFixed(0)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Concentration */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Concentration</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {positions.slice(0, 3).map((p, i) => (
            <div key={p.ticker} className="rounded-lg bg-[var(--bg-raised)] border border-[var(--border-subtle)] p-3">
              <div className="text-[10px] font-mono text-[var(--text-tertiary)]">#{i + 1} Position</div>
              <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1">{p.ticker}</div>
              <div className="text-[11px] font-mono text-[var(--accent)] mt-0.5">{(p.weight * 100).toFixed(1)}% of ISA</div>
            </div>
          ))}
          <div className="rounded-lg bg-[var(--bg-raised)] border border-[var(--border-subtle)] p-3">
            <div className="text-[10px] font-mono text-[var(--text-tertiary)]">GBP exposure</div>
            <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1">
              {(positions.filter((p) => p.nativeCcy === 'GBP').reduce((s, p) => s + p.currentValueGBP, 0) / totalValueGBP * 100).toFixed(1)}%
            </div>
            <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">rest USD</div>
          </div>
        </div>
      </section>
    </div>
  );
}
