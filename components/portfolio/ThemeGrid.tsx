'use client';
import { THEME_DESCRIPTIONS } from "@/lib/portfolioMeta";

interface Theme { name: string; weight: number; }

const THEME_ICONS: Record<string, string> = {
  "AI & Semiconductors": "⬡",
  "US Tech Dominance": "🇺🇸",
  "Mega-Cap Growth": "📈",
  "Global Diversification": "🌍",
  "Value & Quality": "🏛",
  "Capital Allocation": "♻",
  "Inflation Hedge": "🛡",
  "Tail Risk Protection": "⚡",
  "Digital Assets / Bitcoin": "₿",
  "Consumer Tech Ecosystem": "📱",
  "Cloud Infrastructure": "☁",
  "Emerging Market Optionality": "🌏",
  "Government & Defence Tech": "🔒",
  "Industrial Moat": "🏭",
  "European Tech": "🇪🇺",
  "Services Revenue": "💳",
  "AI Device Upgrade Cycle": "🤖",
  "Store of Value": "🪙",
};

export function ThemeGrid({ themes }: { themes: Theme[] }) {
  const maxWeight = themes[0]?.weight ?? 1;

  return (
    <div className="grid grid-cols-1 gap-2">
      {themes.slice(0, 8).map((t) => {
        const pct = t.weight * 100;
        const intensity = t.weight / maxWeight;
        const desc = THEME_DESCRIPTIONS[t.name];
        const icon = THEME_ICONS[t.name] ?? "◆";

        return (
          <div
            key={t.name}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-3 relative overflow-hidden"
          >
            {/* background fill bar */}
            <div
              className="absolute inset-0 opacity-[0.06] bg-[var(--accent)]"
              style={{ width: `${intensity * 100}%` }}
            />
            <div className="relative flex items-start gap-3">
              <span className="text-base mt-0.5 flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[12px] font-medium text-[var(--text-primary)] leading-tight">{t.name}</span>
                  <span className="text-[10px] font-mono text-[var(--accent)] flex-shrink-0">{pct.toFixed(0)}%</span>
                </div>
                {desc && (
                  <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed line-clamp-2">{desc}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
