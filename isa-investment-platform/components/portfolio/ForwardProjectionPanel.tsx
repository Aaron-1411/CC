'use client';
import { useState, useMemo } from 'react';
import { BASELINE_SNAPSHOT } from '@/lib/constants';

const V0 = BASELINE_SNAPSHOT.totalValueGBP;
const ANNUAL_CONTRIBUTION = 20_000;
const HORIZON_YEARS = [10, 20, 30];

function projectPortfolio(v0: number, annualReturn: number, contribution: number, years: number) {
  const r = annualReturn / 100;
  // Future value of lump sum + future value of annuity (end-of-year contributions)
  const fvLump = v0 * Math.pow(1 + r, years);
  const fvAnnuity = r !== 0 ? contribution * ((Math.pow(1 + r, years) - 1) / r) : contribution * years;
  return fvLump + fvAnnuity;
}

function formatGBP(v: number): string {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `£${Math.round(v / 1_000)}k`;
  return `£${Math.round(v)}`;
}

function ProjectionChart({
  v0, annualReturn, contribution, vol,
}: { v0: number; annualReturn: number; contribution: number; vol: number }) {
  const years = 30;
  const W = 420; const H = 140; const PADL = 32; const PADB = 20; const PADR = 8; const PADT = 8;
  const chartW = W - PADL - PADR;
  const chartH = H - PADB - PADT;

  const points = Array.from({ length: years + 1 }, (_, i) => ({
    yr: i,
    base: projectPortfolio(v0, annualReturn, contribution, i),
    high: projectPortfolio(v0, annualReturn + vol, contribution, i),
    low: Math.max(0, projectPortfolio(v0, annualReturn - vol, contribution, i)),
  }));

  const maxVal = points[years].high;
  const xScale = (yr: number) => PADL + (yr / years) * chartW;
  const yScale = (v: number) => PADT + chartH - (v / maxVal) * chartH;

  const basePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.yr).toFixed(1)} ${yScale(p.base).toFixed(1)}`).join(' ');
  const bandPath = [
    ...points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.yr).toFixed(1)} ${yScale(p.high).toFixed(1)}`),
    ...points.slice().reverse().map((p) => `L ${xScale(p.yr).toFixed(1)} ${yScale(p.low).toFixed(1)}`),
    'Z',
  ].join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="projBand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d7eff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3d7eff" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {/* Band */}
      <path d={bandPath} fill="url(#projBand)" stroke="none" />
      {/* Base line */}
      <path d={basePath} fill="none" stroke="#3d7eff" strokeWidth={1.5} />
      {/* Horizontal grid + Y labels */}
      {[0.25, 0.5, 0.75, 1].map(frac => {
        const v = maxVal * frac;
        const y = yScale(v);
        return (
          <g key={frac}>
            <line x1={PADL} x2={W - PADR} y1={y} y2={y} stroke="var(--border-subtle)" strokeWidth={0.5} />
            <text x={PADL - 3} y={y + 3} fontSize={8} textAnchor="end" fill="var(--text-tertiary)" fontFamily="var(--font-ibm-plex-mono)">
              {formatGBP(v)}
            </text>
          </g>
        );
      })}
      {/* X axis labels */}
      {[0, 10, 20, 30].map(yr => (
        <text key={yr} x={xScale(yr)} y={H - 4} fontSize={8} textAnchor="middle" fill="var(--text-tertiary)" fontFamily="var(--font-ibm-plex-mono)">
          {yr === 0 ? 'Now' : `${yr}Y`}
        </text>
      ))}
      {/* Milestone dots */}
      {[10, 20, 30].map(yr => {
        const p = points[yr];
        return (
          <circle key={yr} cx={xScale(yr)} cy={yScale(p.base)} r={3} fill="#3d7eff" />
        );
      })}
    </svg>
  );
}

export function ForwardProjectionPanel() {
  const [returnPct, setReturnPct] = useState(10);  // default 10% p.a.
  const [contrib, setContrib] = useState(ANNUAL_CONTRIBUTION);
  const annualVol = 15; // portfolio vol approx — band shows ±1σ annualised

  const milestones = useMemo(
    () => HORIZON_YEARS.map(yr => ({
      yr,
      base: projectPortfolio(V0, returnPct, contrib, yr),
      high: projectPortfolio(V0, returnPct + annualVol, contrib, yr),
      low: Math.max(0, projectPortfolio(V0, returnPct - annualVol, contrib, yr)),
    })),
    [returnPct, contrib]
  );

  const totalInvested = V0 + contrib * 30;
  const gain30 = milestones[2].base - totalInvested;

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">ISA Compounding Projection</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Starting £{Math.round(V0).toLocaleString()} · £{contrib.toLocaleString()}/yr contributions · 30-year horizon
          </div>
        </div>
        <div className="text-[10px] font-mono text-[var(--text-tertiary)] italic">UK tax-free</div>
      </div>

      {/* Controls */}
      <div className="flex gap-6 mb-4 flex-wrap">
        <div>
          <label className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
            Annual return: <span className="text-[var(--accent)]">{returnPct}%</span>
          </label>
          <input
            type="range" min={4} max={20} step={0.5} value={returnPct}
            onChange={e => setReturnPct(Number(e.target.value))}
            className="w-36 accent-[var(--accent)] cursor-pointer"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
            Annual contrib: <span className="text-[var(--accent)]">£{contrib.toLocaleString()}</span>
          </label>
          <input
            type="range" min={0} max={20000} step={1000} value={contrib}
            onChange={e => setContrib(Number(e.target.value))}
            className="w-36 accent-[var(--accent)] cursor-pointer"
          />
        </div>
      </div>

      {/* Chart */}
      <ProjectionChart v0={V0} annualReturn={returnPct} contribution={contrib} vol={annualVol} />

      {/* Milestone cards */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        {milestones.map(({ yr, base, high, low }) => (
          <div key={yr} className="rounded-lg bg-[var(--bg-raised)] border border-[var(--border-subtle)] p-3 text-center">
            <div className="text-[10px] font-mono text-[var(--text-tertiary)] mb-1">{yr} years</div>
            <div className="text-[16px] font-mono font-semibold text-[var(--accent)]">{formatGBP(base)}</div>
            <div className="text-[9px] font-mono text-[var(--text-tertiary)] mt-0.5">
              {formatGBP(low)} – {formatGBP(high)}
            </div>
          </div>
        ))}
      </div>

      {/* Summary line */}
      <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-[var(--text-tertiary)] flex-wrap gap-1">
        <span>Total invested over 30Y: £{Math.round(totalInvested).toLocaleString()}</span>
        <span className={gain30 >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
          Est. tax-free gain: {formatGBP(gain30)} at {returnPct}% p.a.
        </span>
        <span className="italic">Band = ±{annualVol}% vol · not a forecast</span>
      </div>
    </div>
  );
}
