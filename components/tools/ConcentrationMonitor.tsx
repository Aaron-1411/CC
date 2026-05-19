'use client';
import { useMemo } from 'react';
import { BASELINE_SNAPSHOT, HOLDINGS_DEFINITION } from '@/lib/constants';

const SECTOR_MAP: Record<string, string> = {
  EQQQ: 'Tech ETF', VWRP: 'Global ETF', VUAG: 'US ETF',
  'BRK.A': 'Financials', NVDA: 'Technology', GOOGL: 'Technology',
  AAPL: 'Technology', SGLN: 'Commodities', ASML: 'Technology',
  MSTR: 'Technology', PLTR: 'Technology',
};

const LIMITS = {
  maxPosition: 25, warnPosition: 20,
  maxSector: 45,   warnSector: 35,
};

type Status = 'OK' | 'Warning' | 'Breach';

function StatusBadge({ status }: { status: Status }) {
  const cls = status === 'OK'
    ? 'bg-[var(--positive)]/10 text-[var(--positive)] border-[var(--positive)]/30'
    : status === 'Warning'
    ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
    : 'bg-[var(--negative)]/10 text-[var(--negative)] border-[var(--negative)]/30';
  return <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${cls}`}>{status}</span>;
}

export function ConcentrationMonitor() {
  const totalValue = BASELINE_SNAPSHOT.totalValueGBP;

  const { positions, sectorWeights, hhi } = useMemo(() => {
    const positions = BASELINE_SNAPSHOT.positions.map(p => {
      const weight = (p.valueGBP / totalValue) * 100;
      const status: Status = weight >= LIMITS.maxPosition ? 'Breach' : weight >= LIMITS.warnPosition ? 'Warning' : 'OK';
      return { ...p, weight, status, sector: SECTOR_MAP[p.ticker] ?? 'Other' };
    }).sort((a, b) => b.weight - a.weight);

    // Sector aggregation
    const sectorMap = new Map<string, number>();
    for (const p of positions) {
      sectorMap.set(p.sector, (sectorMap.get(p.sector) ?? 0) + p.weight);
    }
    const sectorWeights = Array.from(sectorMap.entries())
      .map(([sector, weight]) => ({
        sector, weight,
        status: (weight >= LIMITS.maxSector ? 'Breach' : weight >= LIMITS.warnSector ? 'Warning' : 'OK') as Status,
      }))
      .sort((a, b) => b.weight - a.weight);

    // HHI = sum of squared weights (in %)
    const hhi = positions.reduce((s, p) => s + Math.pow(p.weight, 2), 0);

    return { positions, sectorWeights, hhi };
  }, [totalValue]);

  const hhiStatus: Status = hhi > 2500 ? 'Breach' : hhi > 1500 ? 'Warning' : 'OK';

  return (
    <div className="space-y-4">
      {/* HHI score */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">HHI Score</div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-[var(--text-primary)]">{hhi.toFixed(0)}</span>
            <StatusBadge status={hhiStatus} />
          </div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">
            &lt;1500 = OK · 1500–2500 = Warning · &gt;2500 = Concentrated
          </div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Position Limits</div>
          <div className="text-[11px] font-mono text-[var(--text-secondary)] space-y-0.5">
            <div>Warn: &gt;{LIMITS.warnPosition}% · Block: &gt;{LIMITS.maxPosition}%</div>
          </div>
        </div>
        <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Sector Limits</div>
          <div className="text-[11px] font-mono text-[var(--text-secondary)] space-y-0.5">
            <div>Warn: &gt;{LIMITS.warnSector}% · Block: &gt;{LIMITS.maxSector}%</div>
          </div>
        </div>
      </div>

      {/* Position table */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Position Weights</div>
        <div className="space-y-1">
          {positions.map(p => (
            <div key={p.ticker} className="flex items-center gap-3">
              <span className="w-12 font-mono text-[11px] text-[var(--text-secondary)]">{p.ticker}</span>
              <div className="flex-1 bg-[var(--bg-overlay)] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${p.status === 'Breach' ? 'bg-[var(--negative)]' : p.status === 'Warning' ? 'bg-amber-400' : 'bg-[var(--accent)]'}`}
                  style={{ width: `${Math.min(p.weight, 100)}%` }}
                />
              </div>
              <span className="w-12 font-mono text-[11px] tabular-nums text-right text-[var(--text-primary)]">{p.weight.toFixed(1)}%</span>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Sector table */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Sector Weights</div>
        <div className="space-y-1">
          {sectorWeights.map(s => (
            <div key={s.sector} className="flex items-center gap-3">
              <span className="w-28 font-mono text-[11px] text-[var(--text-secondary)] truncate">{s.sector}</span>
              <div className="flex-1 bg-[var(--bg-overlay)] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.status === 'Breach' ? 'bg-[var(--negative)]' : s.status === 'Warning' ? 'bg-amber-400' : 'bg-[#7b61ff]'}`}
                  style={{ width: `${Math.min(s.weight, 100)}%` }}
                />
              </div>
              <span className="w-12 font-mono text-[11px] tabular-nums text-right text-[var(--text-primary)]">{s.weight.toFixed(1)}%</span>
              <StatusBadge status={s.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
