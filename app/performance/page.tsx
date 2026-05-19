'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
  AreaChart, Area,
} from 'recharts';
import { ForwardProjectionPanel } from '@/components/portfolio/ForwardProjectionPanel';
import { usePortfolio } from '@/hooks/usePortfolio';
import { BenchmarkSelector } from '@/components/performance/BenchmarkSelector';
import { BenchmarkMetrics } from '@/components/performance/BenchmarkMetrics';
import { RollingCharts } from '@/components/performance/RollingCharts';
import { DayOfWeekChart } from '@/components/performance/DayOfWeekChart';
import { MonthOfYearChart } from '@/components/performance/MonthOfYearChart';
import { DrawdownTable } from '@/components/performance/DrawdownTable';
import { VaRTable } from '@/components/performance/VaRTable';
import type { BenchmarkComparison, DrawdownPeriod } from '@/lib/analytics/benchmark';

interface MonthlyCalendarRow { year: number; months: (number | null)[]; annual: number | null; }

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function cellBg(v: number | null) {
  if (v === null) return 'bg-[var(--bg-overlay)] text-[var(--text-tertiary)]';
  if (v >= 5) return 'bg-[#0d3d1a] text-[var(--positive)]';
  if (v >= 2) return 'bg-[#0a2e14] text-[var(--positive)]';
  if (v > 0) return 'bg-[#071f0d] text-[#47c77a]';
  if (v >= -2) return 'bg-[#2d0f0f] text-[var(--negative)]';
  if (v >= -5) return 'bg-[#3d1010] text-[var(--negative)]';
  return 'bg-[#4a1515] text-[var(--negative)]';
}

interface RiskMetrics {
  volatility30d: number;
  volatility90d: number;
  sharpe30d: number;
  sortino30d: number;
  maxDrawdown: number;
  currentDrawdown: number;
  currentPeak: number;
  var95_1d: number;
  var99_1d: number;
  cvar95_1d: number;
  var95pct: number;
  var99pct: number;
  calmar?: number;
  parametricVar95?: { varPct: number; varGBP: number };
  parametricVar99?: { varPct: number; varGBP: number };
  var10d_95?: { varPct: number; varGBP: number };
  var10d_99?: { varPct: number; varGBP: number };
  cvar10d_95?: { varPct: number; varGBP: number };
  ulcerIndex?: number;
  pctTimeBelowHWM?: number;
  topDrawdowns?: DrawdownPeriod[];
  lookbackDays?: number;
  returnType?: string;
  riskFreeRate?: number;
  riskFreeRateLabel?: string;
  drawdownSeries?: { date: string; drawdown: number }[];
}

interface BenchmarkResponse {
  insufficientData: boolean;
  metrics: BenchmarkComparison | null;
  benchmarkName: string;
  isTotalReturn: boolean;
}

export default function PerformancePage() {
  const { positions, totalValueGBP, totalDailyChangeGBP } = usePortfolio();
  const [selectedBenchmark, setSelectedBenchmark] = useState('^FTSE');

  const { data: returnsRaw, isLoading: retLoading } = useQuery<{ rollingPerformance?: unknown[]; monthlyCalendar?: unknown[] }>({
    queryKey: ['analytics', 'returns'],
    queryFn: () => fetch('/api/analytics/returns').then((r) => r.json()),
    staleTime: 60_000,
  });
  const returnData = Array.isArray(returnsRaw) ? returnsRaw : (returnsRaw?.rollingPerformance ?? []) as { period: string; portfolioReturn: number; benchmarkReturn: number | null; alpha: number | null; absoluteGainGBP: number }[];
  const calendarData = (returnsRaw?.monthlyCalendar ?? []) as MonthlyCalendarRow[];
  const calLoading = retLoading;

  const { data: riskRaw, isLoading: riskLoading } = useQuery<{ metrics: RiskMetrics | null }>({
    queryKey: ['analytics', 'risk'],
    queryFn: () => fetch('/api/analytics/risk').then((r) => r.json()),
    staleTime: 5 * 60_000,
  });
  const riskMetrics = riskRaw?.metrics ?? null;

  const { data: historyData } = useQuery<{ date: string; valueGBP: number }[]>({
    queryKey: ['portfolio', 'history', 'All'],
    queryFn: () => fetch('/api/portfolio/history?range=All').then((r) => r.json()),
    staleTime: 5 * 60_000,
  });
  const portfolioValues = (Array.isArray(historyData) ? historyData : []).map((d) => ({
    date: new Date(d.date),
    value: d.valueGBP,
  }));

  const { data: benchmarkRaw, isLoading: benchLoading } = useQuery<BenchmarkResponse>({
    queryKey: ['analytics', 'benchmark', selectedBenchmark],
    queryFn: () => fetch(`/api/analytics/benchmark?symbol=${encodeURIComponent(selectedBenchmark)}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  // Attribution data derived from positions
  const prevTotal = positions.reduce((s, p) => s + p.prevCloseValueGBP, 0);
  const attrData = [...positions]
    .map((p) => ({
      ticker: p.ticker,
      contribution: prevTotal > 0 ? (p.dailyChangeGBP / prevTotal) * 100 : 0,
      contributionGBP: p.dailyChangeGBP,
      returnPct: p.dailyPct,
      weight: (p.weight * 100).toFixed(2),
    }))
    .sort((a, b) => b.contributionGBP - a.contributionGBP);

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 max-w-[1200px]">
      <h1 className="text-lg font-bold text-[var(--text-primary)]">Performance</h1>

      {/* Tax-Year KPI strip */}
      {(() => {
        const ytd = (Array.isArray(returnData) ? returnData : []).find(r => r.period === 'YTD');
        const isPos = (ytd?.portfolioReturn ?? 0) >= 0;
        const isDayPos = totalDailyChangeGBP >= 0;
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 col-span-2 md:col-span-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Portfolio Value</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[var(--text-primary)]">
                £{totalValueGBP.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-[12px] font-mono tabular-nums mt-0.5 ${isDayPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                {isDayPos ? '+' : ''}£{totalDailyChangeGBP.toFixed(2)} today
              </div>
            </div>
            {ytd ? (
              <>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Tax Year Return</div>
                  <div className={`text-2xl font-bold font-mono tabular-nums ${isPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {isPos ? '+' : ''}{ytd.portfolioReturn.toFixed(2)}%
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">Since 6 Apr 2025 (2025/26)</div>
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Tax-Free Gain</div>
                  <div className={`text-2xl font-bold font-mono tabular-nums ${ytd.absoluteGainGBP >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {ytd.absoluteGainGBP >= 0 ? '+' : ''}£{Math.abs(ytd.absoluteGainGBP).toFixed(2)}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">ISA — no CGT</div>
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">ITD Return</div>
                  {(() => {
                    const itd = (Array.isArray(returnData) ? returnData : []).find(r => r.period === 'ITD');
                    if (!itd) return <div className="text-[var(--text-tertiary)] text-sm font-mono">—</div>;
                    const itdPos = itd.portfolioReturn >= 0;
                    return (
                      <>
                        <div className={`text-2xl font-bold font-mono tabular-nums ${itdPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                          {itdPos ? '+' : ''}{itd.portfolioReturn.toFixed(2)}%
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">Since first investment</div>
                      </>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="col-span-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex items-center">
                <span className="text-[var(--text-tertiary)] text-sm font-mono">Loading return data…</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Rolling performance table */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Rolling Returns</div>
        {retLoading ? (
          <SkeletonCard />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Period','Portfolio','Benchmark','Alpha','Gain (£)'].map((h) => (
                    <th key={h} className="pb-2 pr-6 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(returnData) ? returnData : []).map((r) => {
                  const isPos = r.portfolioReturn >= 0;
                  const isAlphaPos = (r.alpha ?? 0) >= 0;
                  return (
                    <tr key={r.period} className="border-b border-[var(--border-subtle)]">
                      <td className="py-2 pr-6 font-mono text-[var(--text-secondary)]">{r.period}</td>
                      <td className={`py-2 pr-6 font-mono tabular-nums font-semibold ${isPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                        {isPos ? '+' : ''}{r.portfolioReturn.toFixed(2)}%
                      </td>
                      <td className="py-2 pr-6 font-mono tabular-nums text-[var(--text-secondary)]">
                        {r.benchmarkReturn !== null ? `${r.benchmarkReturn >= 0 ? '+' : ''}${r.benchmarkReturn.toFixed(2)}%` : '—'}
                      </td>
                      <td className={`py-2 pr-6 font-mono tabular-nums ${isAlphaPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                        {r.alpha !== null ? `${isAlphaPos ? '+' : ''}${r.alpha.toFixed(2)}%` : '—'}
                      </td>
                      <td className={`py-2 font-mono tabular-nums ${r.absoluteGainGBP >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                        {r.absoluteGainGBP >= 0 ? '+' : ''}£{Math.abs(r.absoluteGainGBP).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Monthly return calendar */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Monthly Return Calendar</div>
        {calLoading ? (
          <SkeletonCard className="h-32" />
        ) : (
          <div className="overflow-x-auto">
            <table className="text-[11px] font-mono w-full">
              <thead>
                <tr>
                  <th className="pr-3 pb-2 text-left text-[var(--text-tertiary)]">Year</th>
                  {MONTH_LABELS.map((m) => (
                    <th key={m} className="pb-2 px-1 text-center text-[var(--text-tertiary)] min-w-[42px]">{m}</th>
                  ))}
                  <th className="pb-2 px-1 text-center text-[var(--text-tertiary)]">Ann.</th>
                </tr>
              </thead>
              <tbody>
                {(calendarData ?? []).map((row) => (
                  <tr key={row.year}>
                    <td className="pr-3 py-1 text-[var(--text-secondary)]">{row.year}</td>
                    {row.months.map((v, i) => (
                      <td key={i} className="py-0.5 px-0.5">
                        <div className={`text-center py-1 px-0.5 rounded text-[10px] tabular-nums ${cellBg(v)}`}>
                          {v !== null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}` : '—'}
                        </div>
                      </td>
                    ))}
                    <td className="py-0.5 px-0.5">
                      <div className={`text-center py-1 px-0.5 rounded text-[10px] tabular-nums font-bold ${cellBg(row.annual)}`}>
                        {row.annual !== null ? `${row.annual >= 0 ? '+' : ''}${row.annual.toFixed(1)}` : '—'}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!calendarData || calendarData.length === 0) && (
                  <tr>
                    <td colSpan={14} className="py-6 text-center text-[var(--text-tertiary)]">
                      Calendar populates after 2 months of daily snapshots
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Attribution table */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Today&apos;s Attribution</div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Holding','Weight','Return','Contribution'].map((h) => (
                    <th key={h} className="pb-2 pr-4 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attrData.map((row) => {
                  const isPos = row.contributionGBP >= 0;
                  return (
                    <tr key={row.ticker} className="border-b border-[var(--border-subtle)]">
                      <td className="py-2 pr-4 font-mono text-xs text-[var(--text-secondary)]">{row.ticker}</td>
                      <td className="py-2 pr-4 font-mono tabular-nums text-xs text-[var(--text-tertiary)]">{row.weight}%</td>
                      <td className={`py-2 pr-4 font-mono tabular-nums text-xs ${row.returnPct >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                        {row.returnPct >= 0 ? '+' : ''}{row.returnPct.toFixed(2)}%
                      </td>
                      <td className={`py-2 font-mono tabular-nums text-xs font-semibold ${isPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                        {isPos ? '+' : ''}{row.contribution.toFixed(3)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attrData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v: unknown) => `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(1)}%`} tick={{ fill: 'var(--text-tertiary)', fontSize: 9, fontFamily: 'var(--font-ibm-plex-mono)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="ticker" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-ibm-plex-mono)' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-normal)', borderRadius: 8, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11 }} />
              <ReferenceLine x={0} stroke="var(--border-normal)" />
              <Bar dataKey="contribution" radius={[0, 3, 3, 0]} isAnimationActive={false}>
                {attrData.map((entry) => (
                  <Cell key={entry.ticker} fill={entry.contribution >= 0 ? 'var(--positive)' : 'var(--negative)'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* VaR Table */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
          Value at Risk (VaR)
        </div>
        {riskLoading ? (
          <SkeletonCard className="h-24" />
        ) : (
          <VaRTable metrics={riskMetrics} />
        )}
      </section>

      {/* Drawdown Table */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
          Top Drawdown Periods
        </div>
        {riskLoading ? (
          <SkeletonCard className="h-24" />
        ) : riskMetrics ? (
          <DrawdownTable
            topDrawdowns={riskMetrics.topDrawdowns ?? []}
            ulcerIndex={riskMetrics.ulcerIndex ?? 0}
            pctTimeBelowHWM={riskMetrics.pctTimeBelowHWM ?? 0}
          />
        ) : (
          <div className="text-[var(--text-tertiary)] text-sm font-mono py-4 text-center">
            Insufficient data
          </div>
        )}
      </section>

      {/* Underwater equity curve */}
      {riskMetrics?.drawdownSeries && riskMetrics.drawdownSeries.length > 2 && (
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Underwater Equity Curve</div>
            {riskMetrics.currentDrawdown !== 0 && (
              <div className="text-[11px] font-mono text-[var(--negative)]">
                Currently {riskMetrics.currentDrawdown.toFixed(1)}% below peak
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={riskMetrics.drawdownSeries} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 9, fontFamily: 'var(--font-ibm-plex-mono)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v: unknown) => `${Number(v).toFixed(0)}%`} tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-normal)', borderRadius: 8, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11 }}
                formatter={(v: unknown) => [`${Number(v).toFixed(2)}%`, 'Drawdown']}
              />
              <ReferenceLine y={0} stroke="var(--border-normal)" strokeWidth={1} />
              <Area type="monotone" dataKey="drawdown" stroke="var(--negative)" strokeWidth={1.5} fill="var(--negative)" fillOpacity={0.15} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Benchmark Selector + Metrics */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
          Benchmark Comparison
        </div>
        <BenchmarkSelector value={selectedBenchmark} onChange={setSelectedBenchmark} />
        <BenchmarkMetrics
          data={benchmarkRaw?.insufficientData ? null : (benchmarkRaw?.metrics ?? null)}
          isLoading={benchLoading}
          riskFreeRate={riskMetrics?.riskFreeRate ?? 0.04}
          benchmarkName={benchmarkRaw?.benchmarkName ?? selectedBenchmark}
        />
      </section>

      {/* Rolling Charts */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
          Rolling Risk Metrics
        </div>
        <RollingCharts
          portfolioValues={portfolioValues}
          riskFreeRate={riskMetrics?.riskFreeRate ?? 0.04}
        />
      </section>

      {/* Day of Week Chart */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
          Day-of-Week Performance
        </div>
        <DayOfWeekChart dailyValues={portfolioValues} />
      </section>

      {/* Month of Year Chart */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
          Month-of-Year Performance
        </div>
        <MonthOfYearChart dailyValues={portfolioValues} />
      </section>

      {/* Compounding projection */}
      <ForwardProjectionPanel />
    </div>
  );
}
