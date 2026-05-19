import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HOLDINGS_DEFINITION, HOLDING_COLORS, BASELINE_SNAPSHOT } from "@/lib/constants";
import type { PortfolioState, Position } from "@/types/portfolio";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get all holdings from DB
    const holdings = await prisma.holding.findMany({
      orderBy: { ticker: "asc" },
    });

    // Get latest snapshot
    const latestSnapshot = await prisma.dailySnapshot.findFirst({
      orderBy: { date: "desc" },
      include: {
        positions: {
          include: { holding: true },
        },
      },
    });

    // Get ISA allowance
    const isaAllowance = await prisma.isaAllowance.findFirst({
      orderBy: { taxYear: "desc" },
    });

    if (!latestSnapshot) {
      // Return baseline if no snapshot in DB
      const totalValueGBP = BASELINE_SNAPSHOT.totalValueGBP;
      const positions: Position[] = BASELINE_SNAPSHOT.positions.map((p, i) => {
        const def = HOLDINGS_DEFINITION.find((h) => h.ticker === p.ticker);
        return {
          ticker: p.ticker,
          yfSymbol: def?.yfSymbol ?? p.ticker,
          name: def?.name ?? p.ticker,
          type: def?.type ?? "Stock",
          nativeCcy: def?.nativeCcy ?? "USD",
          isin: def?.isin ?? null,
          ter: def?.ter ?? null,
          exchange: def?.exchange ?? null,
          units: null,
          avgCostGBP: null,
          currentPriceGBP: p.valueGBP,
          currentPriceNative: p.valueGBP,
          valueGBP: p.valueGBP,
          weight: p.valueGBP / totalValueGBP,
          unrealisedGBP: p.unrealisedGBP ?? null,
          unrealisedPct: p.unrealisedPct != null ? p.unrealisedPct / 100 : null,
          dailyChangeGBP: p.dailyChangeGBP,
          dailyChangePct: p.dailyPct,
          rank: i + 1,
          color: HOLDING_COLORS[p.ticker] ?? "#8896b0",
        };
      });

      const totalDailyChangeGBP = BASELINE_SNAPSHOT.positions.reduce(
        (s, p) => s + p.dailyChangeGBP,
        0
      );
      const totalDailyChangePct = totalValueGBP > 0
        ? (totalDailyChangeGBP / (totalValueGBP - totalDailyChangeGBP)) * 100
        : 0;

      const state: PortfolioState = {
        positions,
        totalValueGBP,
        gbpUsd: BASELINE_SNAPSHOT.gbpUsd,
        totalDailyChangeGBP,
        totalDailyChangePct,
        isaAllowanceUsedGBP: BASELINE_SNAPSHOT.isaAllowanceUsedGBP,
        isaYearAllowanceGBP: BASELINE_SNAPSHOT.isaYearAllowanceGBP,
        lastUpdated: BASELINE_SNAPSHOT.date.toISOString(),
      };

      return NextResponse.json(state);
    }

    // Build positions from snapshot
    const sortedPositions = [...latestSnapshot.positions].sort(
      (a, b) => b.valueGBP - a.valueGBP
    );

    // Build baseline lookup for fallback P&L data
    const baselineByTicker = Object.fromEntries(
      BASELINE_SNAPSHOT.positions.map(p => [p.ticker, p])
    );

    const positions: Position[] = sortedPositions.map((p, i) => {
      const def = HOLDINGS_DEFINITION.find((h) => h.ticker === p.holding.ticker);
      const dbHolding = holdings.find((h) => h.ticker === p.holding.ticker);
      const baseline = baselineByTicker[p.holding.ticker];

      const units = p.units ?? dbHolding?.units ?? null;
      const avgCostGBP = dbHolding?.avgCostGBP ?? null;
      const unrealisedGBP =
        units !== null && avgCostGBP !== null
          ? (p.priceGBP - avgCostGBP) * units
          : baseline?.unrealisedGBP ?? null;
      const unrealisedPct =
        avgCostGBP !== null && avgCostGBP > 0
          ? (p.priceGBP - avgCostGBP) / avgCostGBP
          : baseline?.unrealisedPct != null ? baseline.unrealisedPct / 100 : null;

      return {
        ticker: p.holding.ticker,
        yfSymbol: def?.yfSymbol ?? p.holding.ticker,
        name: p.holding.name,
        type: (p.holding.type as "ETF" | "Stock") ?? "Stock",
        nativeCcy: p.holding.nativeCcy,
        isin: p.holding.isin ?? null,
        ter: p.holding.ter ?? null,
        exchange: p.holding.exchange ?? null,
        units,
        avgCostGBP,
        currentPriceGBP: p.priceGBP,
        currentPriceNative: p.priceGBP,
        valueGBP: p.valueGBP,
        weight: p.weight,
        unrealisedGBP,
        unrealisedPct,
        dailyChangeGBP: p.dailyReturnPct * p.valueGBP / 100,
        dailyChangePct: p.dailyReturnPct,
        rank: i + 1,
        color: HOLDING_COLORS[p.holding.ticker] ?? "#8896b0",
      };
    });

    const totalDailyChangeGBP = positions.reduce(
      (s, p) => s + p.dailyChangeGBP,
      0
    );
    const prevValue =
      latestSnapshot.totalValueGBP - totalDailyChangeGBP;
    const totalDailyChangePct =
      prevValue > 0 ? (totalDailyChangeGBP / prevValue) * 100 : 0;

    const state: PortfolioState = {
      positions,
      totalValueGBP: latestSnapshot.totalValueGBP,
      gbpUsd: latestSnapshot.gbpUsd,
      totalDailyChangeGBP,
      totalDailyChangePct,
      isaAllowanceUsedGBP: isaAllowance?.usedGBP ?? latestSnapshot.totalValueGBP,
      isaYearAllowanceGBP: isaAllowance?.allowanceGBP ?? 20000,
      lastUpdated: latestSnapshot.date.toISOString(),
    };

    return NextResponse.json(state);
  } catch (err) {
    console.error("Portfolio fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}
