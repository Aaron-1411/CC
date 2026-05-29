import { NextResponse } from "next/server";
import { BASELINE_SNAPSHOT, HOLDINGS_DEFINITION } from "@/lib/constants";
import { PORTFOLIO_META, type SectorName, type RegionName } from "@/lib/portfolioMeta";
import { prisma } from "@/lib/db";
import { getHistory } from "@/lib/priceHistory";


async function getWeights(): Promise<Record<string, number>> {
  try {
    const snap = await prisma.dailySnapshot.findFirst({
      orderBy: { date: "desc" },
      include: { positions: { include: { holding: true } } },
    });
    if (snap?.positions.length) {
      const total = snap.totalValueGBP;
      return Object.fromEntries(snap.positions.map(p => [p.holding.ticker, p.valueGBP / total]));
    }
  } catch { /* fall through */ }

  const total = BASELINE_SNAPSHOT.totalValueGBP;
  return Object.fromEntries(BASELINE_SNAPSHOT.positions.map(p => [p.ticker, p.valueGBP / total]));
}

function hhi(weights: number[]): number {
  return weights.reduce((s, w) => s + w * w, 0);
}

export async function GET() {
  try {
    const weights = await getWeights();

    // --- Sector exposure ---
    const sectorTotals: Record<string, number> = {};
    for (const meta of PORTFOLIO_META) {
      const w = weights[meta.ticker] ?? 0;
      for (const [sector, pct] of Object.entries(meta.sectors)) {
        sectorTotals[sector] = (sectorTotals[sector] ?? 0) + w * (pct as number);
      }
    }
    const sectors = Object.entries(sectorTotals)
      .map(([name, weight]) => ({ name: name as SectorName, weight }))
      .sort((a, b) => b.weight - a.weight);

    // --- Geographic exposure ---
    const geoTotals: Record<string, number> = {};
    for (const meta of PORTFOLIO_META) {
      const w = weights[meta.ticker] ?? 0;
      for (const [region, pct] of Object.entries(meta.geography)) {
        geoTotals[region] = (geoTotals[region] ?? 0) + w * (pct as number);
      }
    }
    const geography = Object.entries(geoTotals)
      .map(([name, weight]) => ({ name: name as RegionName, weight }))
      .sort((a, b) => b.weight - a.weight);

    // --- Theme exposure ---
    const themeTotals: Record<string, number> = {};
    for (const meta of PORTFOLIO_META) {
      const w = weights[meta.ticker] ?? 0;
      for (const theme of meta.themes) {
        themeTotals[theme] = (themeTotals[theme] ?? 0) + w;
      }
    }
    const themes = Object.entries(themeTotals)
      .map(([name, weight]) => ({ name, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    // --- Concentration metrics ---
    const allWeights = HOLDINGS_DEFINITION.map(h => weights[h.ticker] ?? 0);
    const sorted = [...allWeights].sort((a, b) => b - a);
    const top3 = sorted.slice(0, 3).reduce((s, w) => s + w, 0);
    const top5 = sorted.slice(0, 5).reduce((s, w) => s + w, 0);
    const hhiScore = hhi(allWeights);
    const usWeight = geoTotals["United States"] ?? 0;
    const itWeight = sectorTotals["Information Technology"] ?? 0;
    const commWeight = sectorTotals["Communication Services"] ?? 0;
    const techTotal = itWeight + commWeight;

    // --- Weighted beta ---
    const weightedBeta = PORTFOLIO_META.reduce(
      (s, m) => s + (weights[m.ticker] ?? 0) * m.beta, 0
    );

    // --- Risk level distribution ---
    const riskCounts: Record<string, number> = { Low: 0, Moderate: 0, High: 0, "Very High": 0 };
    for (const meta of PORTFOLIO_META) {
      const w = weights[meta.ticker] ?? 0;
      riskCounts[meta.riskLevel] = (riskCounts[meta.riskLevel] ?? 0) + w;
    }

    // --- Portfolio performance from price history ---
    let portfolioReturn1y: number | null = null;
    let portfolioReturn3m: number | null = null;
    try {
      // Use the ETF core (VWRP) as a proxy for overall portfolio trajectory
      const vwrpBars = await getHistory("VWRP", 252);
      if (vwrpBars.length >= 60) {
        const first = vwrpBars[0].adjClose;
        const last = vwrpBars[vwrpBars.length - 1].adjClose;
        portfolioReturn1y = (last - first) / first;
        const q3 = vwrpBars[Math.max(0, vwrpBars.length - 63)].adjClose;
        portfolioReturn3m = (last - q3) / q3;
      }
    } catch { /* optional */ }

    // --- Holdings breakdown for display ---
    const holdings = PORTFOLIO_META.map(m => ({
      ticker: m.ticker,
      name: HOLDINGS_DEFINITION.find(h => h.ticker === m.ticker)?.name ?? m.ticker,
      weight: weights[m.ticker] ?? 0,
      category: m.category,
      thesis: m.thesis,
      riskLevel: m.riskLevel,
      beta: m.beta,
      themes: m.themes,
      exchange: HOLDINGS_DEFINITION.find(h => h.ticker === m.ticker)?.exchange ?? null,
      type: HOLDINGS_DEFINITION.find(h => h.ticker === m.ticker)?.type ?? "Stock",
    })).sort((a, b) => b.weight - a.weight);

    return NextResponse.json({
      sectors,
      geography,
      themes,
      holdings,
      concentration: {
        top3Weight: top3,
        top5Weight: top5,
        hhi: hhiScore,
        usWeight,
        techWeight: techTotal,
        weightedBeta,
        riskProfile: riskCounts,
      },
      performance: {
        return1y: portfolioReturn1y,
        return3m: portfolioReturn3m,
        totalValueGBP: BASELINE_SNAPSHOT.totalValueGBP,
        totalReturnPct: BASELINE_SNAPSHOT.totalUnrealisedPct,
        totalReturnGBP: BASELINE_SNAPSHOT.totalUnrealisedGBP,
      },
    });
  } catch (err) {
    console.error("[portfolio/overview]", err);
    return NextResponse.json({ error: "Failed to compute overview" }, { status: 500 });
  }
}
