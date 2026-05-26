/**
 * Brinson-Hood-Beebower (BHB) Attribution Analysis
 */
import type { AttributionItem } from "@/types/analytics";

export interface BHBInput {
  ticker: string;
  name: string;
  color: string;
  portfolioWeight: number; // portfolio weight at period start
  benchmarkWeight: number; // benchmark weight at period start (0 if not in benchmark)
  portfolioReturn: number; // holding's return over period
  benchmarkSectorReturn: number; // benchmark sector/asset class return
  benchmarkTotalReturn: number; // total benchmark return
}

export interface BHBResult {
  items: AttributionItem[];
  totalAllocationEffect: number;
  totalSelectionEffect: number;
  totalInteractionEffect: number;
  totalActiveReturn: number;
  portfolioReturn: number;
  benchmarkReturn: number;
}

/**
 * BHB Attribution decomposition:
 * Allocation Effect = (wp - wb) × (Rb_sector - Rb_total)
 * Selection Effect = wb × (Rp - Rb_sector)
 * Interaction Effect = (wp - wb) × (Rp - Rb_sector)
 */
export function calcBHBAttribution(inputs: BHBInput[]): BHBResult {
  const benchmarkReturn = inputs.reduce(
    (sum, h) => sum + h.benchmarkWeight * h.benchmarkSectorReturn,
    0
  );
  const portfolioReturn = inputs.reduce(
    (sum, h) => sum + h.portfolioWeight * h.portfolioReturn,
    0
  );

  const items: AttributionItem[] = inputs.map((h) => {
    const allocationEffect =
      (h.portfolioWeight - h.benchmarkWeight) *
      (h.benchmarkSectorReturn - benchmarkReturn);

    const selectionEffect =
      h.benchmarkWeight * (h.portfolioReturn - h.benchmarkSectorReturn);

    const interactionEffect =
      (h.portfolioWeight - h.benchmarkWeight) *
      (h.portfolioReturn - h.benchmarkSectorReturn);

    const totalEffect = allocationEffect + selectionEffect + interactionEffect;
    const contribution = h.portfolioWeight * h.portfolioReturn;

    return {
      ticker: h.ticker,
      name: h.name,
      startWeight: h.portfolioWeight,
      endWeight: h.portfolioWeight, // simplified; would need end-of-period weight
      avgWeight: h.portfolioWeight,
      holdingReturn: h.portfolioReturn,
      portfolioReturn,
      benchmarkReturn: h.benchmarkSectorReturn,
      allocationEffect,
      selectionEffect,
      interactionEffect,
      totalEffect,
      contribution,
      color: h.color,
    };
  });

  return {
    items,
    totalAllocationEffect: items.reduce((s, i) => s + i.allocationEffect, 0),
    totalSelectionEffect: items.reduce((s, i) => s + i.selectionEffect, 0),
    totalInteractionEffect: items.reduce((s, i) => s + i.interactionEffect, 0),
    totalActiveReturn: portfolioReturn - benchmarkReturn,
    portfolioReturn,
    benchmarkReturn,
  };
}

/**
 * Simple contribution analysis (weight × return for each holding)
 */
export function calcContributionTable(
  holdings: {
    ticker: string;
    name: string;
    color: string;
    weight: number;
    periodReturn: number;
  }[]
): {
  ticker: string;
  name: string;
  color: string;
  weight: number;
  periodReturn: number;
  contribution: number;
  contributionPct: number;
}[] {
  const totalContribution = holdings.reduce(
    (s, h) => s + h.weight * h.periodReturn,
    0
  );

  return holdings
    .map((h) => {
      const contribution = h.weight * h.periodReturn;
      return {
        ticker: h.ticker,
        name: h.name,
        color: h.color,
        weight: h.weight,
        periodReturn: h.periodReturn,
        contribution,
        contributionPct:
          totalContribution !== 0
            ? contribution / Math.abs(totalContribution)
            : 0,
      };
    })
    .sort((a, b) => b.contribution - a.contribution);
}
