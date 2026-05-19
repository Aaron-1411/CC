'use client';

interface BenchmarkOption {
  symbol: string;
  label: string;
}

const BENCHMARKS: BenchmarkOption[] = [
  { symbol: '^FTAS', label: 'FTSE All-Share' },
  { symbol: '^FTSE', label: 'FTSE 100' },
  { symbol: 'VWRL.L', label: 'MSCI ACWI' },
];

interface BenchmarkSelectorProps {
  value: string;
  onChange: (symbol: string) => void;
}

export function BenchmarkSelector({ value, onChange }: BenchmarkSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {BENCHMARKS.map((b) => (
        <div key={b.symbol} className="flex items-center gap-1.5">
          <button
            onClick={() => onChange(b.symbol)}
            className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors ${
              value === b.symbol
                ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-normal)]'
            }`}
          >
            {b.label}
          </button>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
            Price-only (no dividends)
          </span>
        </div>
      ))}
    </div>
  );
}
