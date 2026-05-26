'use client';

const GEO_COLORS: Record<string, string> = {
  "United States": "#3d7eff",
  "Europe ex-UK": "#23d18b",
  "Japan": "#f5a623",
  "United Kingdom": "#a78bfa",
  "Emerging Markets": "#fb923c",
  "Other Developed": "#8896b0",
  "Global Commodity": "#fbbf24",
};

const GEO_FLAGS: Record<string, string> = {
  "United States": "🇺🇸",
  "Europe ex-UK": "🇪🇺",
  "Japan": "🇯🇵",
  "United Kingdom": "🇬🇧",
  "Emerging Markets": "🌏",
  "Other Developed": "🌍",
  "Global Commodity": "🪙",
};

interface Region { name: string; weight: number; }

export function GeographyBreakdown({ geography }: { geography: Region[] }) {
  const max = geography[0]?.weight ?? 1;

  return (
    <div className="space-y-3">
      {geography.map((r) => {
        const pct = r.weight * 100;
        const barWidth = (r.weight / max) * 100;
        const color = GEO_COLORS[r.name] ?? "#8896b0";
        const flag = GEO_FLAGS[r.name] ?? "🌐";

        return (
          <div key={r.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">{flag}</span>
                <span className="text-[11px] text-[var(--text-secondary)]">{r.name}</span>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-primary)]">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-raised)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
