'use client';

interface Concentration {
  top3Weight: number;
  top5Weight: number;
  hhi: number;
  usWeight: number;
  techWeight: number;
  weightedBeta: number;
  riskProfile: Record<string, number>;
}

function Gauge({ value, max, warn, danger, label, fmt }: {
  value: number; max: number; warn: number; danger: number;
  label: string; fmt: (v: number) => string;
}) {
  const pct = Math.min(value / max, 1);
  const color = value >= danger ? "#f05252" : value >= warn ? "#f5a623" : "#23d18b";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{label}</span>
        <span className="text-[13px] font-mono font-semibold" style={{ color }}>{fmt(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--bg-raised)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function ConcentrationMetrics({ concentration }: { concentration: Concentration }) {
  const { top3Weight, top5Weight, hhi, usWeight, techWeight, weightedBeta, riskProfile } = concentration;

  const riskEntries = Object.entries(riskProfile).sort((a, b) => {
    const order = ["Very High", "High", "Moderate", "Low"];
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });

  const riskColors: Record<string, string> = {
    Low: "#23d18b",
    Moderate: "#38bdf8",
    High: "#f5a623",
    "Very High": "#f05252",
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Gauge value={top3Weight * 100} max={100} warn={60} danger={75} label="Top 3 Weight" fmt={v => `${v.toFixed(0)}%`} />
        <Gauge value={top5Weight * 100} max={100} warn={75} danger={90} label="Top 5 Weight" fmt={v => `${v.toFixed(0)}%`} />
        <Gauge value={usWeight * 100} max={100} warn={75} danger={90} label="US Exposure" fmt={v => `${v.toFixed(0)}%`} />
        <Gauge value={techWeight * 100} max={100} warn={55} danger={70} label="Tech + Comms" fmt={v => `${v.toFixed(0)}%`} />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="rounded-lg bg-[var(--bg-raised)] border border-[var(--border-subtle)] p-3 text-center">
          <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Portfolio Beta</div>
          <div className="text-[22px] font-mono font-semibold text-[var(--text-primary)]">{weightedBeta.toFixed(2)}</div>
          <div className="text-[10px] text-[var(--text-tertiary)]">vs global equities</div>
        </div>
        <div className="rounded-lg bg-[var(--bg-raised)] border border-[var(--border-subtle)] p-3 text-center">
          <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">HHI Score</div>
          <div className="text-[22px] font-mono font-semibold text-[var(--text-primary)]">{(hhi * 100).toFixed(1)}</div>
          <div className="text-[10px] text-[var(--text-tertiary)]">concentration index</div>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Risk Profile by Weight</div>
        <div className="space-y-1.5">
          {riskEntries.map(([level, w]) => (
            <div key={level} className="flex items-center gap-3">
              <span className="text-[10px] w-16 text-[var(--text-tertiary)] flex-shrink-0">{level}</span>
              <div className="flex-1 h-3 rounded bg-[var(--bg-raised)] overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{ width: `${w * 100}%`, background: riskColors[level] ?? "#8896b0" }}
                />
              </div>
              <span className="text-[10px] font-mono text-[var(--text-primary)] w-8 text-right">{(w * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
