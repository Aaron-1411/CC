/**
 * Portfolio-level calculations: P&L, rebalancing, concentration
 */
import type { RebalanceTarget } from "@/types/portfolio";
import type { ConcentrationMetrics, CurrencyExposure, SectorExposure } from "@/types/analytics";

/**
 * Derive units from trade history using FIFO cost basis
 */
export interface TradeRecord {
  type: "BUY" | "SELL" | "DIVIDEND" | "SPLIT";
  date: Date;
  units: number;
  priceGBP: number;
  fees: number;
}

export interface CostBasisResult {
  units: number;
  avgCostGBP: number;
  totalCostGBP: number;
  realizedGBP: number;
  lots: { units: number; costGBP: number; date: Date }[];
}

/**
 * FIFO cost basis calculation
 */
export function calcFIFOCostBasis(trades: TradeRecord[]): CostBasisResult {
  const sorted = [...trades].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Lots: [units, costPerUnit]
  const lots: { units: number; costGBP: number; date: Date }[] = [];
  let realizedGBP = 0;

  for (const trade of sorted) {
    if (trade.type === "BUY") {
      const costPerUnit = (trade.priceGBP * trade.units + trade.fees) / trade.units;
      lots.push({ units: trade.units, costGBP: costPerUnit, date: trade.date });
    } else if (trade.type === "SELL") {
      let remainingSell = trade.units;
      const proceeds = trade.priceGBP * trade.units - trade.fees;

      while (remainingSell > 0 && lots.length > 0) {
        const lot = lots[0];
        if (lot.units <= remainingSell) {
          // Consume entire lot
          realizedGBP += (trade.priceGBP - lot.costGBP) * lot.units;
          remainingSell -= lot.units;
          lots.shift();
        } else {
          // Partial lot
          realizedGBP += (trade.priceGBP - lot.costGBP) * remainingSell;
          lot.units -= remainingSell;
          remainingSell = 0;
        }
      }
      void proceeds;
    } else if (trade.type === "SPLIT") {
      // Stock split: multiply units, divide cost basis
      for (const lot of lots) {
        lot.costGBP = lot.costGBP / trade.units;
        lot.units = lot.units * trade.units;
      }
    }
  }

  const totalUnits = lots.reduce((s, l) => s + l.units, 0);
  const totalCost = lots.reduce((s, l) => s + l.units * l.costGBP, 0);

  return {
    units: totalUnits,
    avgCostGBP: totalUnits > 0 ? totalCost / totalUnits : 0,
    totalCostGBP: totalCost,
    realizedGBP,
    lots,
  };
}

/**
 * Rebalancing workbench
 */
export function calcRebalance(
  positions: {
    ticker: string;
    currentValueGBP: number;
    currentPriceGBP: number;
    units: number | null;
  }[],
  targetWeights: Record<string, number>, // ticker → weight (0–1, sum = 1)
  totalPortfolioGBP?: number
): RebalanceTarget[] {
  const total =
    totalPortfolioGBP ??
    positions.reduce((s, p) => s + p.currentValueGBP, 0);

  if (total === 0) return [];

  return positions.map((pos) => {
    const currentWeight = pos.currentValueGBP / total;
    const targetWeight = targetWeights[pos.ticker] ?? 0;
    const targetValueGBP = targetWeight * total;
    const tradeAmountGBP = targetValueGBP - pos.currentValueGBP;
    const tradeUnits =
      pos.currentPriceGBP > 0
        ? tradeAmountGBP / pos.currentPriceGBP
        : null;

    return {
      ticker: pos.ticker,
      targetWeight,
      currentWeight,
      currentValueGBP: pos.currentValueGBP,
      targetValueGBP,
      tradeAmountGBP,
      tradeUnits,
    };
  });
}

/**
 * Herfindahl-Hirschman Index (HHI) — concentration measure
 * Range: 0 (perfectly diversified) to 1 (fully concentrated)
 */
export function calcHHI(weights: number[]): number {
  return weights.reduce((s, w) => s + w * w, 0);
}

/**
 * Full concentration metrics
 */
export function calcConcentration(
  positions: {
    ticker: string;
    name: string;
    weight: number;
    valueGBP: number;
    nativeCcy: string;
    sector?: string;
  }[]
): ConcentrationMetrics {
  const sorted = [...positions].sort((a, b) => b.weight - a.weight);
  const weights = sorted.map((p) => p.weight);

  const hhi = calcHHI(weights);
  const effectiveN = hhi > 0 ? 1 / hhi : positions.length;

  const top3Weight = weights.slice(0, 3).reduce((s, w) => s + w, 0);
  const top5Weight = weights.slice(0, 5).reduce((s, w) => s + w, 0);
  const top10Weight = weights.slice(0, 10).reduce((s, w) => s + w, 0);

  // Sector exposures
  const sectorMap = new Map<string, { weight: number; value: number; holdings: string[] }>();
  for (const pos of positions) {
    const sector = pos.sector ?? "Other";
    const existing = sectorMap.get(sector) ?? { weight: 0, value: 0, holdings: [] };
    sectorMap.set(sector, {
      weight: existing.weight + pos.weight,
      value: existing.value + pos.valueGBP,
      holdings: [...existing.holdings, pos.ticker],
    });
  }

  const sectorExposures: SectorExposure[] = Array.from(sectorMap.entries())
    .map(([sector, data]) => ({
      sector,
      weightPct: data.weight * 100,
      valueGBP: data.value,
      holdings: data.holdings,
    }))
    .sort((a, b) => b.weightPct - a.weightPct);

  // Currency exposures
  const ccyMap = new Map<string, { weight: number; value: number; holdings: string[] }>();
  for (const pos of positions) {
    const ccy = pos.nativeCcy;
    const existing = ccyMap.get(ccy) ?? { weight: 0, value: 0, holdings: [] };
    ccyMap.set(ccy, {
      weight: existing.weight + pos.weight,
      value: existing.value + pos.valueGBP,
      holdings: [...existing.holdings, pos.ticker],
    });
  }

  const currencyExposures: CurrencyExposure[] = Array.from(ccyMap.entries())
    .map(([currency, data]) => ({
      currency,
      weightPct: data.weight * 100,
      valueGBP: data.value,
      holdings: data.holdings,
    }))
    .sort((a, b) => b.weightPct - a.weightPct);

  return {
    hhi,
    effectiveN,
    top3Weight,
    top5Weight,
    top10Weight,
    sectorExposures,
    currencyExposures,
  };
}

/**
 * Calculate P&L summary for a position
 */
export function calcPositionPL(
  units: number,
  avgCostGBP: number,
  currentPriceGBP: number,
  dailyChangePct: number
): {
  unrealisedGBP: number;
  unrealisedPct: number;
  dailyChangeGBP: number;
  currentValueGBP: number;
  totalCostGBP: number;
} {
  const currentValueGBP = units * currentPriceGBP;
  const totalCostGBP = units * avgCostGBP;
  const unrealisedGBP = currentValueGBP - totalCostGBP;
  const unrealisedPct = totalCostGBP > 0 ? unrealisedGBP / totalCostGBP : 0;
  const previousValueGBP = currentValueGBP / (1 + dailyChangePct / 100);
  const dailyChangeGBP = currentValueGBP - previousValueGBP;

  return {
    unrealisedGBP,
    unrealisedPct,
    dailyChangeGBP,
    currentValueGBP,
    totalCostGBP,
  };
}
