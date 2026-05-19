'use client';

import type { BenchmarkComparison } from '@/lib/analytics/benchmark';

interface MetricCardProps {
  label: string;
  value: string;
  tooltip: string;
}

function MetricCard({ label, value, tooltip }: MetricCardProps) {
  return (
    <div
      className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3"
      title={tooltip}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
        {label}
      </div>
      <div className="font-mono tabular-nums text-sm text-[var(--text-primary)]">
        {value}
      </div>
    </div>
  );
}

interface BenchmarkMetricsProps {
  data: BenchmarkComparison | null;
  isLoading: boolean;
  riskFreeRate: number;
  benchmarkName: string;
}

function fmt(v: number, decimals = 2): string {
  return v.toFixed(decimals);
}

function fmtPct(v: number, decimals = 2): string {
  return `${(v * 100).toFixed(decimals)}%`;
}

function fmtCapture(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export function BenchmarkMetrics({
  data,
  isLoading,
  riskFreeRate,
  benchmarkName,
}: BenchmarkMetricsProps) {
  const dash = '-- ';

  const cards = [
    {
      label: 'Beta',
      value: data ? fmt(data.beta) : dash,
      tooltip: 'Sensitivity of portfolio returns to benchmark movements. Beta > 1 means more volatile than benchmark.',
    },
    {
      label: 'Alpha (Ann.)',
      value: data ? fmtPct(data.alpha) : dash,
      tooltip: 'Annualised excess return over what beta would predict. Positive = outperformance on a risk-adjusted basis.',
    },
    {
      label: 'R²',
      value: data ? fmt(data.rSquared, 3) : dash,
      tooltip: 'Proportion of portfolio variance explained by benchmark. R² = 1 means perfect correlation.',
    },
    {
      label: 'Tracking Error',
      value: data ? fmtPct(data.trackingError) : dash,
      tooltip: 'Annualised standard deviation of active returns (portfolio minus benchmark). Lower = closer tracking.',
    },
    {
      label: 'Info Ratio',
      value: data ? fmt(data.informationRatio) : dash,
      tooltip: 'Active return divided by tracking error. Measures consistency of outperformance.',
    },
    {
      label: 'Treynor',
      value: data ? fmt(data.treynorRatio) : dash,
      tooltip: 'Excess return per unit of systematic (beta) risk. (Portfolio Return − Risk-Free) / Beta.',
    },
    {
      label: 'Upside Capture',
      value: data ? fmtCapture(data.upsideCapture) : dash,
      tooltip: 'Portfolio average return on benchmark up-days vs benchmark average return on those days.',
    },
    {
      label: 'Downside Capture',
      value: data ? fmtCapture(data.downsideCapture) : dash,
      tooltip: 'Portfolio average return on benchmark down-days vs benchmark average return on those days. Lower is better.',
    },
  ];

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="text-[var(--text-tertiary)] text-sm font-mono">
          Loading benchmark metrics…
        </div>
      ) : (
        <>
          {!data && (
            <div className="text-[11px] font-mono text-amber-400 mb-2">
              Insufficient data — need 30+ aligned data points
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {cards.map((c) => (
              <MetricCard key={c.label} label={c.label} value={c.value} tooltip={c.tooltip} />
            ))}
          </div>
        </>
      )}
      <div className="flex flex-wrap gap-3 text-[10px] font-mono text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-subtle)]">
        <span>Risk-free rate: {(riskFreeRate * 100).toFixed(1)}% p.a.</span>
        <span>Return type: Simple (price)</span>
        <span>Benchmark: {benchmarkName}</span>
      </div>
    </div>
  );
}
