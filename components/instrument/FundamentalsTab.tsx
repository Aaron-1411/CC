'use client';
import { useQuery } from '@tanstack/react-query';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { fetchJson } from '@/lib/fetchJson';
import { usePriceStore } from '@/store/priceStore';

interface Props { yfSymbol: string; ticker: string; type: string; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YahooVal = { raw?: number; fmt?: string } | number | null | undefined;
function raw(v: YahooVal): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  return v.raw ?? null;
}
function fmt(v: YahooVal, decimals = 2, suffix = ''): string {
  const n = raw(v);
  if (n == null || !isFinite(n)) return '—';
  return `${n.toFixed(decimals)}${suffix}`;
}
function fmtPct(v: YahooVal): string {
  const n = raw(v);
  if (n == null || !isFinite(n)) return '—';
  return `${(n * 100).toFixed(2)}%`;
}
function fmtB(v: YahooVal): string {
  const n = raw(v);
  if (n == null || !isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  return n.toFixed(0);
}

function StatRow({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-subtle)] last:border-0" title={tooltip}>
      <span className="text-[11px] font-mono text-[var(--text-tertiary)]">{label}</span>
      <span className="text-[11px] font-mono tabular-nums text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function StatGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">{title}</div>
      {children}
    </div>
  );
}

export function FundamentalsTab({ yfSymbol, ticker, type }: Props) {
  const { quotes } = usePriceStore();
  const q = quotes[ticker] ?? quotes[yfSymbol];

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['quote-summary', yfSymbol],
    queryFn: () => fetchJson(`/api/quote-summary/${encodeURIComponent(yfSymbol)}`),
    staleTime: 3_600_000,
    retry: 1,
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  if (isError || data?.error) return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-semibold text-amber-400 mb-0.5">Fundamental data temporarily unavailable</div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)]">Yahoo Finance is rate-limiting this server. Detailed ratios will return automatically.</div>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="shrink-0 text-[10px] font-mono px-2.5 py-1 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-normal)] transition-colors disabled:opacity-40"
        >
          {isFetching ? 'Retrying…' : 'Retry'}
        </button>
      </div>
      {q && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Live Price', value: q.price != null ? (type === 'ETF' && yfSymbol.endsWith('.L') ? `${(q.price / 100).toFixed(2)} GBP` : `${q.price.toFixed(2)}`) : '—' },
            { label: 'Mkt Cap', value: q.marketCap != null ? (q.marketCap >= 1e12 ? `$${(q.marketCap/1e12).toFixed(2)}T` : q.marketCap >= 1e9 ? `$${(q.marketCap/1e9).toFixed(1)}B` : `$${(q.marketCap/1e6).toFixed(0)}M`) : '—' },
            { label: '52W High', value: q.fiftyTwoWeekHigh != null ? q.fiftyTwoWeekHigh.toFixed(2) : '—' },
            { label: '52W Low', value: q.fiftyTwoWeekLow != null ? q.fiftyTwoWeekLow.toFixed(2) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
              <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">{label}</div>
              <div className="text-[13px] font-mono font-semibold tabular-nums text-[var(--text-primary)]">{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ks = data?.defaultKeyStatistics;
  const fd = data?.financialData;
  const sd = data?.summaryDetail;
  const income = Array.isArray(data?.incomeStatementHistory) ? data.incomeStatementHistory : [];
  const cashflow = Array.isArray(data?.cashflowStatementHistory) ? data.cashflowStatementHistory : [];

  // Most-recent annual figures
  const latestIncome = income[0] ?? null;
  const latestCF = cashflow[0] ?? null;

  // FCF = operating cash flow − capex
  const ocf = raw(latestCF?.totalCashFromOperatingActivities);
  const capex = raw(latestCF?.capitalExpenditures);
  const fcf = ocf != null && capex != null ? ocf + capex : null; // capex is typically negative in Yahoo
  const revenue = raw(latestIncome?.totalRevenue);
  const ps = revenue != null && raw(sd?.marketCap) != null ? (raw(sd?.marketCap)! / revenue) : null;
  const pfcf = fcf != null && fcf > 0 && raw(sd?.marketCap) != null ? raw(sd?.marketCap)! / fcf : null;

  const isETF = type === 'ETF';

  return (
    <div className="space-y-4">
      {isETF && (
        <div className="text-[11px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-2 rounded">
          ETF — per-share ratios not applicable. Showing fund-level data where available.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Valuation */}
        <StatGroup title="Valuation">
          <StatRow label="Trailing P/E" value={fmt(ks?.trailingEps && sd?.regularMarketPrice ? raw(sd.regularMarketPrice)! / raw(ks.trailingEps)! : ks?.trailingPE)} tooltip="Market price / trailing 12-month EPS" />
          <StatRow label="Forward P/E" value={fmt(ks?.forwardPE)} tooltip="Market price / estimated next-year EPS" />
          <StatRow label="EV / EBITDA" value={fmt(ks?.enterpriseToEbitda)} tooltip="Enterprise value divided by EBITDA" />
          <StatRow label="Price / Book" value={fmt(ks?.priceToBook)} tooltip="Market price / book value per share" />
          <StatRow label="Price / Sales" value={ps != null ? ps.toFixed(2) : '—'} tooltip="Market cap / annual revenue" />
          <StatRow label="Price / FCF" value={pfcf != null ? pfcf.toFixed(2) : '—'} tooltip="Market cap / free cash flow" />
        </StatGroup>

        {/* Income & Returns */}
        <StatGroup title="Profitability">
          <StatRow label="Gross Margin" value={fmtPct(fd?.grossMargins)} />
          <StatRow label="Operating Margin" value={fmtPct(fd?.operatingMargins)} />
          <StatRow label="Net Margin" value={fmtPct(fd?.profitMargins)} />
          <StatRow label="ROE" value={fmtPct(fd?.returnOnEquity)} tooltip="Return on equity" />
          <StatRow label="ROA" value={fmtPct(fd?.returnOnAssets)} tooltip="Return on assets" />
          <StatRow label="Revenue" value={fmtB(fd?.totalRevenue)} />
        </StatGroup>

        {/* Dividends */}
        <StatGroup title="Dividends & Capital">
          <StatRow label="Div Yield" value={fmtPct(sd?.dividendYield)} />
          <StatRow label="Div Rate" value={sd?.dividendRate ? `$${fmt(sd.dividendRate)}` : '—'} />
          <StatRow label="Payout Ratio" value={fmtPct(sd?.payoutRatio)} />
          <StatRow label="Market Cap" value={fmtB(sd?.marketCap)} />
          <StatRow label="Beta" value={fmt(ks?.beta)} />
          <StatRow label="52W High" value={fmt(sd?.fiftyTwoWeekHigh)} />
          <StatRow label="52W Low" value={fmt(sd?.fiftyTwoWeekLow)} />
        </StatGroup>

        {/* Balance sheet proxies */}
        <StatGroup title="Balance Sheet">
          <StatRow label="Total Debt" value={fmtB(fd?.totalDebt)} />
          <StatRow label="Cash" value={fmtB(fd?.totalCash)} />
          <StatRow label="Net Debt/EBITDA" value={
            (() => {
              const debt = raw(fd?.totalDebt);
              const cash = raw(fd?.totalCash);
              const ebitda = raw(fd?.ebitda);
              if (debt != null && cash != null && ebitda != null && ebitda !== 0) {
                return ((debt - cash) / ebitda).toFixed(2);
              }
              return '—';
            })()
          } tooltip="(Total debt − cash) / EBITDA" />
          <StatRow label="Current Ratio" value={fmt(fd?.currentRatio)} />
          <StatRow label="Quick Ratio" value={fmt(fd?.quickRatio)} />
          <StatRow label="Debt/Equity" value={fmt(fd?.debtToEquity)} />
        </StatGroup>

        {/* Growth */}
        <StatGroup title="Growth">
          <StatRow label="Revenue Growth" value={fmtPct(fd?.revenueGrowth)} tooltip="YoY revenue growth" />
          <StatRow label="Earnings Growth" value={fmtPct(fd?.earningsGrowth)} />
          <StatRow label="EPS (TTM)" value={fmt(ks?.trailingEps)} />
          <StatRow label="EPS (Fwd)" value={fmt(ks?.forwardEps)} />
          <StatRow label="FCF" value={fcf != null ? fmtB(fcf) : '—'} tooltip="Operating cash flow − capex" />
        </StatGroup>

        {/* Analyst targets */}
        <StatGroup title="Analyst Targets">
          <StatRow label="Target Mean" value={fd?.targetMeanPrice ? `$${fmt(fd.targetMeanPrice)}` : '—'} />
          <StatRow label="Target High" value={fd?.targetHighPrice ? `$${fmt(fd.targetHighPrice)}` : '—'} />
          <StatRow label="Target Low" value={fd?.targetLowPrice ? `$${fmt(fd.targetLowPrice)}` : '—'} />
          <StatRow label="Recommendation" value={fd?.recommendationKey ? String(fd.recommendationKey).toUpperCase() : '—'} />
          <StatRow label="# Analysts" value={fd?.numberOfAnalystOpinions ? String(raw(fd.numberOfAnalystOpinions)) : '—'} />
        </StatGroup>
      </div>

      {/* Annual income history */}
      {income.length > 0 && (
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Annual Income History</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Year', 'Revenue', 'Gross Profit', 'EBIT', 'Net Income'].map(h => (
                    <th key={h} className="pb-1.5 pr-4 text-left text-[10px] text-[var(--text-tertiary)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {income.slice(0, 4).map((row: YahooVal & { endDate?: { fmt?: string }; totalRevenue?: YahooVal; grossProfit?: YahooVal; ebit?: YahooVal; netIncome?: YahooVal }, i: number) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0">
                    <td className="py-1 pr-4 text-[var(--text-secondary)]">{(row as { endDate?: { fmt?: string } }).endDate?.fmt?.slice(0, 4) ?? '—'}</td>
                    <td className="py-1 pr-4 tabular-nums text-[var(--text-primary)]">{fmtB((row as { totalRevenue?: YahooVal }).totalRevenue)}</td>
                    <td className="py-1 pr-4 tabular-nums text-[var(--text-primary)]">{fmtB((row as { grossProfit?: YahooVal }).grossProfit)}</td>
                    <td className="py-1 pr-4 tabular-nums text-[var(--text-primary)]">{fmtB((row as { ebit?: YahooVal }).ebit)}</td>
                    <td className="py-1 tabular-nums text-[var(--text-primary)]">{fmtB((row as { netIncome?: YahooVal }).netIncome)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Annual cashflow history */}
      {cashflow.length > 0 && (
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Annual Cash Flow History</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Year', 'Operating CF', 'Capex', 'Free Cash Flow', 'Depreciation'].map(h => (
                    <th key={h} className="pb-1.5 pr-4 text-left text-[10px] text-[var(--text-tertiary)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashflow.slice(0, 4).map((row: {
                  endDate?: { fmt?: string };
                  totalCashFromOperatingActivities?: YahooVal;
                  capitalExpenditures?: YahooVal;
                  depreciation?: YahooVal;
                }, i: number) => {
                  const ocfVal = raw(row.totalCashFromOperatingActivities);
                  const capexVal = raw(row.capitalExpenditures);
                  const fcfVal = ocfVal != null && capexVal != null ? ocfVal + capexVal : null;
                  return (
                    <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0">
                      <td className="py-1 pr-4 text-[var(--text-secondary)]">{row.endDate?.fmt?.slice(0, 4) ?? '—'}</td>
                      <td className="py-1 pr-4 tabular-nums text-[var(--text-primary)]">{fmtB(row.totalCashFromOperatingActivities)}</td>
                      <td className="py-1 pr-4 tabular-nums text-[var(--negative)]">{fmtB(row.capitalExpenditures)}</td>
                      <td className={`py-1 pr-4 tabular-nums font-semibold ${fcfVal != null && fcfVal >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                        {fcfVal != null ? fmtB(fcfVal) : '—'}
                      </td>
                      <td className="py-1 tabular-nums text-[var(--text-primary)]">{fmtB(row.depreciation)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
