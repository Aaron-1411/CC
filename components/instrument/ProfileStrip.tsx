'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { usePriceStore } from '@/store/priceStore';
import { fetchJson } from '@/lib/fetchJson';

interface Props { ticker: string; yfSymbol: string; type: string; }

type YV = { raw?: number; fmt?: string } | number | null | undefined;
function raw(v: YV): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  return v.raw ?? null;
}
function fmt2(v: YV, dp = 2): string {
  const n = raw(v);
  if (n == null || !isFinite(n)) return '—';
  return n.toFixed(dp);
}
function fmtPct(v: YV): string {
  const n = raw(v);
  if (n == null || !isFinite(n)) return '—';
  return `${(n * 100).toFixed(1)}%`;
}
function fmtCap(n: number | null | undefined): string {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

function Pill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col min-w-[60px]">
      <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] leading-none mb-0.5">{label}</span>
      <span className={`text-[11px] font-mono tabular-nums font-semibold ${color ?? 'text-[var(--text-primary)]'}`}>{value}</span>
    </div>
  );
}

export function ProfileStrip({ ticker, yfSymbol, type }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { quotes } = usePriceStore();
  const q = quotes[ticker] ?? quotes[yfSymbol];

  const { data } = useQuery({
    queryKey: ['quote-summary', yfSymbol],
    queryFn: () => fetchJson(`/api/quote-summary/${encodeURIComponent(yfSymbol)}`),
    staleTime: 3_600_000,
  });

  const hasQS = data && !data.error;
  const ap  = hasQS ? data.assetProfile : null;
  const ks  = hasQS ? data.defaultKeyStatistics : null;
  const fd  = hasQS ? data.financialData : null;
  const sd  = hasQS ? data.summaryDetail : null;
  const isETF = type === 'ETF';

  // Always-available from live quote
  const mktCap52     = q ? `${q.fiftyTwoWeekLow.toFixed(2)} – ${q.fiftyTwoWeekHigh.toFixed(2)}` : '—';
  const mktCapVal    = fmtCap(q?.marketCap ?? (sd ? raw(sd.marketCap) : null));
  const volStr       = q && q.volume > 0 ? `${(q.volume / 1e6).toFixed(1)}M` : '—';

  // quoteSummary-derived (richer)
  const sector    = ap?.sector ?? null;
  const industry  = ap?.industry ?? null;
  const country   = ap?.country ?? null;
  const employees = ap?.fullTimeEmployees ?? null;
  const website   = ap?.website ?? null;
  const bio       = ap?.longBusinessSummary ?? null;

  const pe       = fmt2(ks?.trailingPE);
  const fwdPE    = fmt2(ks?.forwardPE);
  const evEbitda = fmt2(ks?.enterpriseToEbitda);
  const pb       = fmt2(ks?.priceToBook);
  const beta     = fmt2(ks?.beta);
  const shortPct = ks?.shortPercentOfFloat != null ? fmtPct(ks.shortPercentOfFloat) : '—';
  const divYield = fmtPct(sd?.dividendYield);
  const grossM   = fmtPct(fd?.grossMargins);
  const netM     = fmtPct(fd?.profitMargins);
  const roe      = fmtPct(fd?.returnOnEquity);
  const recKey   = fd?.recommendationKey ? String(fd.recommendationKey).toUpperCase() : null;
  const targetMean = raw(fd?.targetMeanPrice);
  const numAnalysts = fd?.numberOfAnalystOpinions ? String(raw(fd.numberOfAnalystOpinions)) : null;

  const recColor =
    recKey === 'BUY' || recKey === 'STRONG_BUY' ? 'text-[var(--positive)]' :
    recKey === 'SELL' || recKey === 'STRONG_SELL' ? 'text-[var(--negative)]' :
    'text-[var(--neutral)]';

  const hasAnything = q || hasQS;
  if (!hasAnything) return null;

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Sector / meta tags — only when quoteSummary loaded */}
      {(sector || industry || country || website) && (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-2 border-b border-[var(--border-subtle)]">
          {sector   && <span className="text-[10px] font-mono bg-[#1e2a1e] text-[#4ade80] border border-[#4ade80]/30 px-2 py-0.5 rounded">{sector}</span>}
          {industry && <span className="text-[10px] font-mono bg-[var(--bg-overlay)] text-[var(--text-secondary)] border border-[var(--border-subtle)] px-2 py-0.5 rounded">{industry}</span>}
          {country  && <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{country}</span>}
          {employees && <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{employees.toLocaleString()} employees</span>}
          {website  && (
            <a href={website} target="_blank" rel="noopener noreferrer"
               className="text-[10px] font-mono text-[var(--accent)] hover:underline ml-auto">
              {website.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
            </a>
          )}
        </div>
      )}

      {/* Stat pills — always render the price-derived ones, add QS ones when available */}
      <div className="flex flex-wrap gap-x-5 gap-y-3 px-4 py-3">
        {/* Always available from live price stream */}
        <Pill label="52W Range" value={mktCap52} />
        <Pill label="Mkt Cap"   value={mktCapVal} />
        <Pill label="Volume"    value={volStr} />

        {/* From quoteSummary — shown when available */}
        {!isETF && hasQS && <>
          <Pill label="Trailing P/E"  value={pe} />
          <Pill label="Forward P/E"   value={fwdPE} />
          <Pill label="EV/EBITDA"     value={evEbitda} />
          <Pill label="P/Book"        value={pb} />
          <Pill label="Beta"          value={beta} />
          <Pill label="Div Yield"     value={divYield} />
          <Pill label="Short Float"   value={shortPct} />
          <Pill label="Gross Margin"  value={grossM} />
          <Pill label="Net Margin"    value={netM} />
          <Pill label="ROE"           value={roe} />
          {recKey && (
            <Pill label={`Consensus${numAnalysts ? ` (${numAnalysts})` : ''}`}
                  value={recKey.replace('_', ' ')} color={recColor} />
          )}
          {targetMean != null && (
            <Pill label="Mean Target" value={`$${targetMean.toFixed(2)}`} />
          )}
          {(() => {
            const price = q?.price ?? null;
            if (targetMean == null || price == null || price === 0) return null;
            const upside = (targetMean - price) / price * 100;
            const color = upside >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]';
            return <Pill label="Implied Upside" value={`${upside >= 0 ? '+' : ''}${upside.toFixed(1)}%`} color={color} />;
          })()}
        </>}
        {isETF && hasQS && <>
          <Pill label="Beta"      value={beta} />
          <Pill label="Div Yield" value={divYield} />
        </>}
      </div>

      {/* Business description */}
      {bio && (
        <div className="px-4 pb-3 border-t border-[var(--border-subtle)] pt-2">
          <p className={`text-[11px] font-mono text-[var(--text-secondary)] leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
            {bio}
          </p>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[10px] font-mono text-[var(--accent)] hover:underline mt-0.5"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        </div>
      )}
    </div>
  );
}
