'use client';
import { useState } from 'react';

const SECTOR_COLORS: Record<string, string> = {
  "Information Technology": "#3d7eff",
  "Communication Services": "#38bdf8",
  "Consumer Discretionary": "#a78bfa",
  "Consumer Staples": "#34d399",
  "Financials": "#f5a623",
  "Healthcare": "#23d18b",
  "Industrials": "#7b61ff",
  "Energy": "#fb923c",
  "Materials": "#fbbf24",
  "Real Estate": "#e879f9",
  "Utilities": "#6ee7b7",
  "Commodities": "#fcd34d",
};

interface Sector { name: string; weight: number; }

function DonutChart({ sectors }: { sectors: Sector[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const size = 148;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 60;
  const innerR = 37;
  const gap = 0.025; // radians gap between segments

  // Build arc paths
  let cumAngle = -Math.PI / 2;
  const arcs = sectors.map(s => {
    const span = s.weight * 2 * Math.PI - gap;
    const start = cumAngle + gap / 2;
    const end = start + span;
    cumAngle += s.weight * 2 * Math.PI;
    return { ...s, start, end };
  });

  function arc(start: number, end: number, r: number) {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  function segmentPath(start: number, end: number) {
    const x1o = cx + outerR * Math.cos(start), y1o = cy + outerR * Math.sin(start);
    const x2o = cx + outerR * Math.cos(end), y2o = cy + outerR * Math.sin(end);
    const x1i = cx + innerR * Math.cos(end), y1i = cy + innerR * Math.sin(end);
    const x2i = cx + innerR * Math.cos(start), y2i = cy + innerR * Math.sin(start);
    const large = end - start > Math.PI ? 1 : 0;
    return [
      `M ${x1o} ${y1o}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${x2i} ${y2i}`,
      "Z",
    ].join(" ");
  }

  void arc; // suppress unused warning

  const hoveredSector = hovered ? sectors.find(s => s.name === hovered) : null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map(a => (
        <path
          key={a.name}
          d={segmentPath(a.start, a.end)}
          fill={SECTOR_COLORS[a.name] ?? "#8896b0"}
          opacity={hovered && hovered !== a.name ? 0.35 : 1}
          onMouseEnter={() => setHovered(a.name)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: "pointer", transition: "opacity 0.15s" }}
        />
      ))}
      {/* Centre label */}
      {hoveredSector ? (
        <>
          <text x={cx} y={cy - 7} textAnchor="middle" fontSize={13} fontWeight="600" fill="var(--text-primary)" fontFamily="var(--font-ibm-plex-mono)">
            {(hoveredSector.weight * 100).toFixed(1)}%
          </text>
          <text x={cx} y={cy + 9} textAnchor="middle" fontSize={7.5} fill="var(--text-tertiary)" fontFamily="var(--font-ibm-plex-sans)">
            {hoveredSector.name.replace("Information Technology", "IT").replace("Communication Services", "Comms")}
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 5} textAnchor="middle" fontSize={11} fontWeight="600" fill="var(--text-primary)" fontFamily="var(--font-ibm-plex-mono)">
            {sectors.length}
          </text>
          <text x={cx} y={cy + 9} textAnchor="middle" fontSize={8} fill="var(--text-tertiary)" fontFamily="var(--font-ibm-plex-sans)">
            sectors
          </text>
        </>
      )}
    </svg>
  );
}

export function SectorBreakdown({ sectors }: { sectors: Sector[] }) {
  return (
    <div className="flex gap-5 items-center">
      <div className="flex-shrink-0">
        <DonutChart sectors={sectors} />
      </div>
      <div className="flex-1 space-y-1.5">
        {sectors.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SECTOR_COLORS[s.name] ?? "#8896b0" }} />
            <span className="text-[11px] text-[var(--text-secondary)] flex-1 truncate">{s.name}</span>
            <span className="text-[11px] font-mono text-[var(--text-primary)] w-10 text-right">{(s.weight * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
