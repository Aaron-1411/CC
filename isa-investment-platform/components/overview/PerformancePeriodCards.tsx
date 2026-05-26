'use client';
import { useQuery } from '@tanstack/react-query';
import { useUiStore } from '@/store/uiStore';
import { SkeletonCard } from '@/components/shared/SkeletonCard';

const PERIODS = ['1D', '5D', '1M', '3M', 'YTD', 'ITD'] as const;
type Period = (typeof PERIODS)[number];

interface PeriodResult {
  period: string;
  portfolioReturn: number;
  benchmarkReturn: number | null;
  alpha: number | null;
  absoluteGainGBP: number;
  startValue: number;
  endValue: number;
}

export function PerformancePeriodCards() {
  const { selectedPeriod, setPeriod } = useUiStore();

  const { data, isLoading } = useQuery<{ rollingPerformance?: PeriodResult[]; message?: string } | PeriodResult[]>({
    queryKey: ['analytics', 'returns'],
    queryFn: () => fetch('/api/analytics/returns').then((r) => r.json()),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {PERIODS.map((p) => <SkeletonCard key={p} className="min-w-[120px]" />)}
      </div>
    );
  }

  const rows: PeriodResult[] = Array.isArray(data)
    ? data
    : (data as { rollingPerformance?: PeriodResult[] })?.rollingPerformance ?? [];
  const results: Record<string, PeriodResult> = {};
  rows.forEach((r) => { results[r.period] = r; });

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
      {PERIODS.map((period) => {
        const r = results[period];
        const active = selectedPeriod === period;
        const isPos = (r?.portfolioReturn ?? 0) >= 0;

        return (
          <button
            key={period}
            onClick={() => setPeriod(period as Period)}
            className={`min-w-[120px] flex-shrink-0 rounded-lg border p-3 text-left transition-all cursor-pointer ${
              active
                ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-normal)]'
            }`}
          >
            <div className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{period}</div>
            {r ? (
              <>
                <div className={`text-base font-bold font-mono tabular-nums ${isPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {isPos ? '+' : ''}{r.portfolioReturn.toFixed(2)}%
                </div>
                <div className={`text-[11px] font-mono tabular-nums ${isPos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {isPos ? '+' : ''}£{Math.abs(r.absoluteGainGBP).toFixed(0)}
                </div>
                {r.alpha !== null && (
                  <div className={`text-[10px] font-mono mt-0.5 ${r.alpha >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    α {r.alpha >= 0 ? '+' : ''}{r.alpha.toFixed(2)}%
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-[var(--text-tertiary)] font-mono">--</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
