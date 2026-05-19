'use client';
import { useState } from "react";
import { HOLDING_COLORS } from "@/lib/constants";

interface Holding {
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
}

const RISK_BADGE: Record<string, string> = {
  Low: "text-emerald-400 bg-emerald-400/10",
  Moderate: "text-sky-400 bg-sky-400/10",
  High: "text-amber-400 bg-amber-400/10",
  "Very High": "text-rose-400 bg-rose-400/10",
};

export function HoldingThesisList({ holdings }: { holdings: Holding[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {holdings.map(h => {
        const color = HOLDING_COLORS[h.ticker] ?? "#8896b0";
        const isOpen = expanded === h.ticker;

        return (
          <div
            key={h.ticker}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)] overflow-hidden"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : h.ticker)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-surface)] transition-colors"
            >
              {/* Weight bar indicator */}
              <div
                className="w-1 h-8 rounded-full flex-shrink-0"
                style={{ background: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[13px] font-semibold text-[var(--text-primary)]">{h.ticker}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)] truncate">{h.category}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${RISK_BADGE[h.riskLevel] ?? ""}`}>
                    β {h.beta.toFixed(2)}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] truncate">{h.name}</div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-[13px] font-mono font-semibold text-[var(--text-primary)]">
                  {(h.weight * 100).toFixed(1)}%
                </div>
                <div className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${RISK_BADGE[h.riskLevel] ?? ""}`}>
                  {h.riskLevel}
                </div>
              </div>
              <span className="text-[var(--text-tertiary)] text-xs ml-1 flex-shrink-0">
                {isOpen ? "▲" : "▼"}
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-[var(--border-subtle)] pt-3 space-y-2">
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{h.thesis}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {h.themes.map(t => (
                    <span
                      key={t}
                      className="text-[9px] px-2 py-0.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-tertiary)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
