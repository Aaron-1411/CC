'use client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { fetchJson } from '@/lib/fetchJson';
import { usePriceStore } from '@/store/priceStore';

interface Props { yfSymbol: string; ticker: string; }

function fmtDate(ts: number | undefined | null): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const RATING_COLOR: Record<string, string> = {
  buy: 'text-[var(--positive)]', strongbuy: 'text-[var(--positive)]',
  hold: 'text-[var(--neutral)]', neutral: 'text-[var(--neutral)]',
  sell: 'text-[var(--negative)]', strongsell: 'text-[var(--negative)]',
  underperform: 'text-[var(--negative)]', outperform: 'text-[var(--positive)]',
  overweight: 'text-[var(--positive)]', underweight: 'text-[var(--negative)]',
};

type YV = { raw?: number; fmt?: string } | number | null | undefined;
function raw(v: YV): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  return v.raw ?? null;
}

export function CatalystsTab({ yfSymbol, ticker }: Props) {
  const { quotes } = usePriceStore();
  const livePrice = quotes[ticker]?.price ?? quotes[yfSymbol]?.price ?? null;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['quote-summary', yfSymbol],
    queryFn: () => fetchJson(`/api/quote-summary/${encodeURIComponent(yfSymbol)}`),
    staleTime: 3_600_000,
    retry: 1,
  });

  const earningsChartData = useMemo(() => {
    if (!data?.earningsHistory) return [];
    const hist = Array.isArray(data.earningsHistory) ? data.earningsHistory : [];
    return hist.slice(-4).map((e: { quarter?: { fmt?: string }; epsActual?: YV; epsEstimate?: YV; surprisePercent?: YV }) => {
      const actual = raw(e.epsActual);
      const est = raw(e.epsEstimate);
      const surprise = raw(e.surprisePercent);
      const beat = actual != null && est != null ? actual >= est : null;
      return {
        quarter: e.quarter?.fmt ?? '—',
        actual: actual != null ? +actual.toFixed(2) : null,
        estimate: est != null ? +est.toFixed(2) : null,
        surprise: surprise != null ? +(surprise * 100).toFixed(1) : null,
        beat,
      };
    });
  }, [data]);

  if (isLoading) return <SkeletonCard className="h-48" />;
  if (!data || data.error) return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-semibold text-amber-400 mb-0.5">Catalyst data temporarily unavailable</div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)]">Yahoo Finance is rate-limiting this server. Earnings, analyst targets and rating changes will return automatically.</div>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="shrink-0 text-[10px] font-mono px-2.5 py-1 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-normal)] transition-colors disabled:opacity-40"
        >
          {isFetching ? 'Retrying…' : 'Retry'}
        </button>
      </div>
      {livePrice != null && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Live Price</div>
            <div className="text-[18px] font-mono font-bold tabular-nums text-[var(--text-primary)]">
              {livePrice.toFixed(2)}
            </div>
          </div>
          {(() => {
            const q = quotes[ticker] ?? quotes[yfSymbol];
            if (!q) return null;
            return (<>
              <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
                <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">52W Range</div>
                <div className="text-[12px] font-mono tabular-nums text-[var(--text-primary)]">
                  {q.fiftyTwoWeekLow.toFixed(2)} – {q.fiftyTwoWeekHigh.toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
                <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Volume</div>
                <div className="text-[12px] font-mono tabular-nums text-[var(--text-primary)]">
                  {q.volume > 0 ? `${(q.volume / 1e6).toFixed(1)}M` : '—'}
                </div>
              </div>
            </>);
          })()}
        </div>
      )}
    </div>
  );

  const cal = data.calendarEvents;
  const earnings = cal?.earnings;
  const nextEarnings = earnings?.earningsDate?.[0]?.raw;
  const epsEst = earnings?.epsEstimate?.raw;

  const upgrades: { date?: { raw?: number }; toGrade?: string; fromGrade?: string; firm?: string; action?: string }[] = Array.isArray(data.upgradeDowngradeHistory) ? data.upgradeDowngradeHistory : [];

  const fd = data.financialData;
  const recKey = fd?.recommendationKey ? String(fd.recommendationKey) : null;
  const targetMean = raw(fd?.targetMeanPrice);
  const targetHigh = raw(fd?.targetHighPrice);
  const targetLow = raw(fd?.targetLowPrice);
  const numAnalysts = fd?.numberOfAnalystOpinions?.raw ?? fd?.numberOfAnalystOpinions;

  // Implied upside from analyst mean target vs live price
  const impliedUpside = targetMean != null && livePrice != null && livePrice > 0
    ? (targetMean - livePrice) / livePrice * 100
    : null;

  // Dividend info
  const sd = data.summaryDetail;
  const divYield = raw(sd?.dividendYield);
  const divRate = raw(sd?.dividendRate);
  const exDivDate = raw(sd?.exDividendDate);
  const payoutRatio = raw(sd?.payoutRatio);

  const tooltipStyle = { background: 'var(--bg-overlay)', border: '1px solid var(--border-normal)', borderRadius: 8, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10 };

  return (
    <div className="space-y-4">
      {/* Analyst consensus + implied upside */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Consensus rating */}
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Analyst Consensus</div>
          {recKey ? (
            <div className="space-y-1.5">
              <div className={`text-base font-bold font-mono uppercase ${RATING_COLOR[recKey.toLowerCase()] ?? 'text-[var(--text-primary)]'}`}>
                {recKey.replace('_', ' ')}
              </div>
              {numAnalysts != null && (
                <div className="text-[10px] font-mono text-[var(--text-tertiary)]">{numAnalysts} analysts</div>
              )}
            </div>
          ) : (
            <div className="text-[11px] font-mono text-[var(--text-tertiary)]">No data</div>
          )}
        </div>

        {/* Price targets */}
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Price Targets</div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Mean</span>
              <span className="tabular-nums text-[var(--text-primary)]">{targetMean != null ? `$${targetMean.toFixed(2)}` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">High</span>
              <span className="tabular-nums text-[var(--positive)]">{targetHigh != null ? `$${targetHigh.toFixed(2)}` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Low</span>
              <span className="tabular-nums text-[var(--negative)]">{targetLow != null ? `$${targetLow.toFixed(2)}` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Implied upside */}
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Implied Upside</div>
          {impliedUpside != null ? (
            <div>
              <div className={`text-base font-bold font-mono tabular-nums ${impliedUpside >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                {impliedUpside >= 0 ? '+' : ''}{impliedUpside.toFixed(1)}%
              </div>
              <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">
                vs current ${livePrice?.toFixed(2)}
              </div>
              {/* Visual bar */}
              <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-overlay)] overflow-hidden">
                {targetLow != null && targetHigh != null && livePrice != null && (
                  <div
                    className={`h-full rounded-full ${impliedUpside >= 0 ? 'bg-[var(--positive)]' : 'bg-[var(--negative)]'}`}
                    style={{ width: `${Math.min(100, Math.abs(impliedUpside))}%` }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="text-[11px] font-mono text-[var(--text-tertiary)]">
              {livePrice == null ? 'Awaiting live price' : targetMean == null ? 'No target data' : '—'}
            </div>
          )}
        </div>
      </div>

      {/* Earnings beat/miss chart */}
      {earningsChartData.length > 0 && (
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
            Earnings History — EPS Actual vs Estimate (last 4 quarters)
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {earningsChartData.map((e: { quarter: string; actual: number | null; estimate: number | null; surprise: number | null; beat: boolean | null }, i: number) => (
              <div key={i} className="text-center">
                <div className="text-[9px] font-mono text-[var(--text-tertiary)] mb-1">{e.quarter}</div>
                <div className={`text-[11px] font-bold font-mono tabular-nums ${e.beat === true ? 'text-[var(--positive)]' : e.beat === false ? 'text-[var(--negative)]' : 'text-[var(--text-primary)]'}`}>
                  {e.actual != null ? `$${e.actual}` : '—'}
                </div>
                <div className="text-[9px] font-mono text-[var(--text-tertiary)]">
                  est ${e.estimate ?? '—'}
                </div>
                {e.surprise != null && (
                  <div className={`text-[9px] font-mono mt-0.5 ${e.beat ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {e.surprise >= 0 ? '+' : ''}{e.surprise}%
                  </div>
                )}
                <div className={`mt-1 text-[8px] font-mono px-1.5 py-0.5 rounded ${e.beat === true ? 'bg-[var(--positive)]/10 text-[var(--positive)]' : e.beat === false ? 'bg-[var(--negative)]/10 text-[var(--negative)]' : 'bg-[var(--bg-overlay)] text-[var(--text-tertiary)]'}`}>
                  {e.beat === true ? 'BEAT' : e.beat === false ? 'MISS' : '—'}
                </div>
              </div>
            ))}
          </div>
          {/* Surprise % bar chart */}
          {earningsChartData.some((e: { surprise: number | null }) => e.surprise != null) && (
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={earningsChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="quarter" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: unknown) => [`${typeof v === 'number' && v >= 0 ? '+' : ''}${v}%`, 'EPS Surprise']}
                />
                <ReferenceLine y={0} stroke="var(--border-normal)" />
                <Bar dataKey="surprise" radius={2}>
                  {earningsChartData.map((e: { beat: boolean | null }, i: number) => (
                    <Cell key={i} fill={e.beat !== false ? 'var(--positive)' : 'var(--negative)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Next earnings + dividend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Next Earnings</div>
          <div className="text-sm font-bold font-mono text-[var(--text-primary)]">{fmtDate(nextEarnings)}</div>
          {epsEst != null && (
            <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-1">
              Consensus EPS est: <span className="tabular-nums">${typeof epsEst === 'number' ? epsEst.toFixed(2) : '—'}</span>
            </div>
          )}
          {!nextEarnings && <div className="text-[11px] font-mono text-[var(--text-tertiary)] mt-1">No upcoming date available</div>}
        </div>

        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Dividend</div>
          {divRate != null && divRate > 0 ? (
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Annual Rate</span>
                <span className="tabular-nums text-[var(--text-primary)]">${divRate.toFixed(2)}</span>
              </div>
              {divYield != null && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Yield</span>
                  <span className="tabular-nums text-[var(--positive)]">{(divYield * 100).toFixed(2)}%</span>
                </div>
              )}
              {payoutRatio != null && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Payout Ratio</span>
                  <span className="tabular-nums text-[var(--text-primary)]">{(payoutRatio * 100).toFixed(1)}%</span>
                </div>
              )}
              {exDivDate != null && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Ex-Div Date</span>
                  <span className="tabular-nums text-[var(--text-secondary)]">{fmtDate(exDivDate)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[11px] font-mono text-[var(--text-tertiary)]">No dividend</div>
          )}
        </div>
      </div>

      {/* Recent upgrades/downgrades */}
      {upgrades.length > 0 && (
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Rating Changes</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Date', 'Firm', 'Action', 'From', 'To'].map(h => (
                    <th key={h} className="pb-1.5 pr-4 text-left text-[10px] text-[var(--text-tertiary)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upgrades.slice(0, 8).map((u, i) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0">
                    <td className="py-1.5 pr-4 text-[var(--text-secondary)]">{fmtDate(u.date?.raw)}</td>
                    <td className="py-1.5 pr-4 text-[var(--text-primary)]">{u.firm ?? '—'}</td>
                    <td className={`py-1.5 pr-4 font-semibold ${u.action === 'up' ? 'text-[var(--positive)]' : u.action === 'down' ? 'text-[var(--negative)]' : 'text-[var(--text-secondary)]'}`}>
                      {u.action === 'up' ? '▲ Up' : u.action === 'down' ? '▼ Down' : u.action ?? '—'}
                    </td>
                    <td className="py-1.5 pr-4 text-[var(--text-tertiary)]">{u.fromGrade ?? '—'}</td>
                    <td className={`py-1.5 ${RATING_COLOR[(u.toGrade ?? '').toLowerCase()] ?? 'text-[var(--text-primary)]'}`}>{u.toGrade ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-[10px] font-mono text-[var(--text-tertiary)]">
        Source: Yahoo Finance. Short interest &amp; insider flows require FMP_API_KEY in .env.local.
      </div>
    </div>
  );
}
