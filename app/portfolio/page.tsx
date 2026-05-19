'use client';
import { useQuery } from '@tanstack/react-query';
import { SectorBreakdown } from '@/components/portfolio/SectorBreakdown';
import { GeographyBreakdown } from '@/components/portfolio/GeographyBreakdown';
import { ThemeGrid } from '@/components/portfolio/ThemeGrid';
import { HoldingThesisList } from '@/components/portfolio/HoldingThesisList';
import { ConcentrationMetrics } from '@/components/portfolio/ConcentrationMetrics';
import { AIOverviewPanel } from '@/components/portfolio/AIOverviewPanel';
import { ForwardProjectionPanel } from '@/components/portfolio/ForwardProjectionPanel';
import { BASELINE_SNAPSHOT } from '@/lib/constants';

interface OverviewData {
  sectors: { name: string; weight: number }[];
  geography: { name: string; weight: number }[];
  themes: { name: string; weight: number }[];
  holdings: {
    ticker: string;
    name: string;
    weight: number;
    category: string;
    thesis: string;
    riskLevel: string;
    beta: number;
    themes: string[];
    exchange: string | null;
    type: string;
  }[];
  concentration: {
    top3Weight: number;
    top5Weight: number;
    hhi: number;
    usWeight: number;
    techWeight: number;
    weightedBeta: number;
    riskProfile: Record<string, number>;
  };
  performance: {
    return1y: number | null;
    return3m: number | null;
    totalValueGBP: number;
    totalReturnPct: number;
    totalReturnGBP: number;
  };
}

function pct(v: number | null, decimals = 1) {
  if (v === null) return '—';
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(decimals)}%`;
}

function gbp(v: number) {
  return `£${v.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function PortfolioPage() {
  const { data, isLoading, error } = useQuery<OverviewData>({
    queryKey: ['portfolio-overview'],
    queryFn: async () => {
      const r = await fetch('/api/portfolio/overview');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const snap = BASELINE_SNAPSHOT;

  return (
    <div className="px-4 lg:px-6 py-5 max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight">Portfolio</h1>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
            What you actually own — sector, geography, themes & outlook
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-[var(--text-tertiary)] font-mono">ISA 2025/26</div>
          <div className="text-[11px] font-mono text-[var(--text-tertiary)]">
            {gbp(snap.isaAllowanceUsedGBP)} / {gbp(snap.isaYearAllowanceGBP)} used
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Value", value: gbp(snap.totalValueGBP), sub: null },
          { label: "Total P&L (Unrealised)", value: `+${gbp(snap.totalUnrealisedGBP)}`, sub: `+${snap.totalUnrealisedPct.toFixed(2)}% on cost`, positive: true },
          {
            label: "3-Month (VWRP proxy)",
            value: isLoading ? "—" : pct(data?.performance.return3m ?? null),
            sub: "~60 trading days",
            positive: (data?.performance.return3m ?? 0) >= 0,
          },
          {
            label: "1-Year (VWRP proxy)",
            value: isLoading ? "—" : pct(data?.performance.return1y ?? null),
            sub: "~252 trading days",
            positive: (data?.performance.return1y ?? 0) >= 0,
          },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">{k.label}</div>
            <div className={`text-[18px] font-mono font-semibold ${k.positive ? "text-emerald-400" : "text-[var(--text-primary)]"}`}>
              {k.value}
            </div>
            {k.sub && <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Forward projection */}
      <ForwardProjectionPanel />

      {/* AI Overview — full width, auto-streams */}
      <AIOverviewPanel />

      {/* Sector + Geography + Concentration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Sector Exposure</div>
          {isLoading ? (
            <div className="h-40 animate-pulse rounded bg-[var(--bg-raised)]" />
          ) : error || !data ? (
            <div className="text-[11px] text-rose-400">Failed to load</div>
          ) : (
            <SectorBreakdown sectors={data.sectors} />
          )}
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Geographic Exposure</div>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-5 animate-pulse rounded bg-[var(--bg-raised)]" />)}
            </div>
          ) : error || !data ? (
            <div className="text-[11px] text-rose-400">Failed to load</div>
          ) : (
            <GeographyBreakdown geography={data.geography} />
          )}
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Concentration & Risk</div>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-5 animate-pulse rounded bg-[var(--bg-raised)]" />)}
            </div>
          ) : error || !data ? (
            <div className="text-[11px] text-rose-400">Failed to load</div>
          ) : (
            <ConcentrationMetrics concentration={data.concentration} />
          )}
        </div>
      </div>

      {/* Investment Themes */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Investment Themes</div>
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-14 animate-pulse rounded bg-[var(--bg-raised)]" />)}
          </div>
        ) : error || !data ? (
          <div className="text-[11px] text-rose-400">Failed to load</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {data.themes.slice(0, 8).map((t, i) => {
              const all = data.themes;
              const maxW = all[0]?.weight ?? 1;
              return (
                <div key={i} className="relative rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-3 overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-[0.05] bg-[var(--accent)]"
                    style={{ width: `${(t.weight / maxW) * 100}%` }}
                  />
                  <div className="relative flex items-center justify-between gap-2 mb-1">
                    <span className="text-[12px] font-medium text-[var(--text-primary)]">{t.name}</span>
                    <span className="text-[10px] font-mono text-[var(--accent)] flex-shrink-0">{(t.weight * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Holdings — two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Investment Themes — Detail</div>
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse rounded bg-[var(--bg-raised)]" />)}
            </div>
          ) : data ? (
            <ThemeGrid themes={data.themes} />
          ) : null}
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
            Position Theses — click to expand
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-12 animate-pulse rounded bg-[var(--bg-raised)]" />)}
            </div>
          ) : data ? (
            <HoldingThesisList holdings={data.holdings} />
          ) : null}
        </div>
      </div>

      <div className="text-[10px] text-[var(--text-tertiary)] font-mono text-center pb-4">
        Sector and geographic allocations are estimates based on ETF factsheets and stock classifications. Not investment advice.
      </div>
    </div>
  );
}
