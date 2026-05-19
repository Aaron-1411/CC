'use client';
import { create } from 'zustand';
import { BASELINE_SNAPSHOT, HOLDINGS_DEFINITION } from '@/lib/constants';
import type { Quote } from '@/types/market';

export interface LivePosition {
  ticker: string;
  name: string;
  type: 'ETF' | 'Stock';
  yfSymbol: string;
  nativeCcy: string;
  isin: string | null;
  ter: number | null;
  exchange: string;
  // Snapshot baseline
  snapshotValueGBP: number;
  snapshotDailyChangeGBP: number;
  snapshotDailyPct: number;
  prevCloseValueGBP: number;
  // Total cost basis from BASELINE_SNAPSHOT — always populated, updated live
  snapCostGBP: number;
  // Live values (updated from quotes)
  currentValueGBP: number;
  dailyChangeGBP: number;
  dailyPct: number;
  weight: number;
  // User-set per-unit cost (optional — set via Settings)
  units: number | null;
  avgCostGBP: number | null;
  // Unrealised P&L — always populated from snapCostGBP, upgraded to per-unit when user sets units
  unrealisedPnLGBP: number | null;
  unrealisedPnLPct: number | null;
}

interface PortfolioState {
  positions: LivePosition[];
  totalValueGBP: number;
  totalDailyChangeGBP: number;
  totalDailyPct: number;
  isaUsedGBP: number;
  isaAllowanceGBP: number;
  applyQuotes: (quotes: Record<string, Quote>, gbpUsd: number) => void;
  setUnits: (ticker: string, units: number, avgCostGBP?: number) => void;
}

function buildBasePositions(): LivePosition[] {
  return HOLDINGS_DEFINITION.map((h) => {
    const snap = BASELINE_SNAPSHOT.positions.find((p) => p.ticker === h.ticker)!;
    const prevClose = snap.valueGBP - snap.dailyChangeGBP;
    return {
      ticker: h.ticker,
      name: h.name,
      type: h.type,
      yfSymbol: h.yfSymbol,
      nativeCcy: h.nativeCcy,
      isin: h.isin ?? null,
      ter: h.ter ?? null,
      exchange: h.exchange,
      snapshotValueGBP: snap.valueGBP,
      snapshotDailyChangeGBP: snap.dailyChangeGBP,
      snapshotDailyPct: snap.dailyPct,
      prevCloseValueGBP: prevClose,
      snapCostGBP: snap.costGBP,
      currentValueGBP: snap.valueGBP,
      dailyChangeGBP: snap.dailyChangeGBP,
      dailyPct: snap.dailyPct,
      weight: snap.valueGBP / BASELINE_SNAPSHOT.totalValueGBP,
      units: null,
      avgCostGBP: null,
      unrealisedPnLGBP: snap.unrealisedGBP,
      unrealisedPnLPct: snap.unrealisedPct,
    };
  });
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  positions: buildBasePositions(),
  totalValueGBP: BASELINE_SNAPSHOT.totalValueGBP,
  totalDailyChangeGBP: BASELINE_SNAPSHOT.positions.reduce((s, p) => s + p.dailyChangeGBP, 0),
  totalDailyPct: 0,
  isaUsedGBP: BASELINE_SNAPSHOT.isaAllowanceUsedGBP,
  isaAllowanceGBP: BASELINE_SNAPSHOT.isaYearAllowanceGBP,

  applyQuotes: (quotes, _gbpUsd) => {
    const positions = get().positions.map((pos) => {
      const q = quotes[pos.ticker] ?? quotes[pos.yfSymbol];
      if (!q) return pos;

      const dailyPct = q.changePercent;
      const newValue = pos.prevCloseValueGBP * (1 + dailyPct / 100);
      const dailyChange = newValue - pos.prevCloseValueGBP;

      let unrealisedPnLGBP: number | null = null;
      let unrealisedPnLPct: number | null = null;

      if (pos.units !== null && pos.avgCostGBP !== null) {
        // User-set per-unit cost — compute from current price × units
        const currentPriceGBP = q.priceGBP;
        unrealisedPnLGBP = (currentPriceGBP - pos.avgCostGBP) * pos.units;
        unrealisedPnLPct = pos.avgCostGBP > 0
          ? (currentPriceGBP - pos.avgCostGBP) / pos.avgCostGBP * 100
          : null;
      } else {
        // Fall back to total cost basis from BASELINE_SNAPSHOT
        unrealisedPnLGBP = newValue - pos.snapCostGBP;
        unrealisedPnLPct = pos.snapCostGBP > 0
          ? (newValue - pos.snapCostGBP) / pos.snapCostGBP * 100
          : null;
      }

      return { ...pos, currentValueGBP: newValue, dailyChangeGBP: dailyChange, dailyPct, unrealisedPnLGBP, unrealisedPnLPct };
    });

    const totalValueGBP = positions.reduce((s, p) => s + p.currentValueGBP, 0);
    const totalDailyChangeGBP = positions.reduce((s, p) => s + p.dailyChangeGBP, 0);
    const prevTotal = positions.reduce((s, p) => s + p.prevCloseValueGBP, 0);
    const totalDailyPct = prevTotal > 0 ? (totalDailyChangeGBP / prevTotal) * 100 : 0;

    const withWeights = positions.map((p) => ({
      ...p,
      weight: totalValueGBP > 0 ? p.currentValueGBP / totalValueGBP : 0,
    }));

    set({ positions: withWeights, totalValueGBP, totalDailyChangeGBP, totalDailyPct });
  },

  setUnits: (ticker, units, avgCostGBP) => {
    set((state) => ({
      positions: state.positions.map((p) =>
        p.ticker === ticker ? { ...p, units, avgCostGBP: avgCostGBP ?? p.avgCostGBP } : p
      ),
    }));
  },
}));
