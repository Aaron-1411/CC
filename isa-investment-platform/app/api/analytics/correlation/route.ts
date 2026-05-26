import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcCorrelationMatrix } from "@/lib/analytics/risk";
import { HOLDINGS_DEFINITION } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Build return series from adjClose bars stored in PriceHistory
async function correlationFromPriceHistory(days = 252) {
  // Get the last `days` bars for each holding from DB
  const tickers = HOLDINGS_DEFINITION.map(h => h.ticker);

  const rows = await prisma.priceHistory.findMany({
    where: { ticker: { in: tickers } },
    orderBy: { date: "asc" },
    select: { ticker: true, date: true, adjClose: true },
  });

  if (!rows.length) return null;

  // Group by ticker
  const byTicker: Record<string, { date: string; adjClose: number }[]> = {};
  for (const row of rows) {
    (byTicker[row.ticker] ??= []).push({ date: row.date, adjClose: row.adjClose });
  }

  // Build per-ticker date sets and find intersection (dates where ALL tickers traded)
  const tickerMaps: Record<string, Map<string, number>> = {};
  for (const [ticker, bars] of Object.entries(byTicker)) {
    tickerMaps[ticker] = new Map(bars.map(b => [b.date, b.adjClose]));
  }

  const tickerEntries = Object.entries(tickerMaps).filter(([, m]) => m.size >= 20);
  if (tickerEntries.length < 2) return null;

  // Intersection: only dates present in every ticker (avoids LSE/NASDAQ holiday misalignment)
  let commonDates: string[] | null = null;
  for (const [, m] of tickerEntries) {
    const dates = [...m.keys()];
    commonDates = commonDates === null ? dates : commonDates.filter(d => m.has(d));
  }
  const sortedDates = (commonDates ?? []).sort().slice(-days);
  if (sortedDates.length < 10) return null;

  // Build aligned return series per ticker using only common dates
  const holdingReturns = tickerEntries
    .map(([ticker, priceMap]) => {
      const aligned = sortedDates.map(d => priceMap.get(d)!);
      const returns: number[] = [];
      for (let i = 1; i < aligned.length; i++) {
        if (aligned[i - 1] > 0) returns.push((aligned[i] - aligned[i - 1]) / aligned[i - 1]);
      }
      return { ticker, returns };
    })
    .filter(h => h.returns.length >= 10);

  if (holdingReturns.length < 2) return null;
  return calcCorrelationMatrix(holdingReturns);
}

// Fall back to DailySnapshot-based approach if PriceHistory is empty
async function correlationFromSnapshots() {
  const snapshots = (await prisma.dailySnapshot.findMany({
    orderBy: { date: "desc" },
    take: 90,
    include: { positions: { include: { holding: true } } },
  })).reverse();

  if (snapshots.length < 10) return null;

  const holdingReturnsMap = new Map<string, { name: string; prices: number[] }>();
  for (const snapshot of snapshots) {
    for (const pos of snapshot.positions) {
      const ticker = pos.holding.ticker;
      const existing = holdingReturnsMap.get(ticker) ?? { name: pos.holding.name, prices: [] };
      existing.prices.push(pos.priceGBP);
      holdingReturnsMap.set(ticker, existing);
    }
  }

  const holdingReturns = Array.from(holdingReturnsMap.entries()).map(([ticker, data]) => {
    const returns: number[] = [];
    for (let i = 1; i < data.prices.length; i++) {
      if (data.prices[i - 1] > 0) returns.push((data.prices[i] - data.prices[i - 1]) / data.prices[i - 1]);
    }
    return { ticker, returns };
  });

  return calcCorrelationMatrix(holdingReturns);
}

export async function GET() {
  try {
    // Try price history first (richer, ~252 days)
    let correlation = await correlationFromPriceHistory(252);
    let source = "priceHistory";

    if (!correlation) {
      correlation = await correlationFromSnapshots();
      source = "snapshots";
    }

    if (!correlation) {
      return NextResponse.json({ correlation: null, message: "Insufficient data — run /api/bootstrap first" });
    }

    return NextResponse.json({ correlation, source });
  } catch (err) {
    console.error("Correlation error:", err);
    return NextResponse.json({ error: "Failed to compute correlation" }, { status: 500 });
  }
}
