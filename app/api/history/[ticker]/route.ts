import { NextResponse } from "next/server";
import { fetchOHLCV, TICKER_TO_YF } from "@/lib/data/yahoo";
import { historyCache } from "@/lib/cache";
import { getHistory, barCount } from "@/lib/priceHistory";
import { HOLDINGS_DEFINITION } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Range string → approximate trading days needed
const RANGE_DAYS: Record<string, number> = {
  "1d": 1, "5d": 5, "1mo": 22, "3mo": 65, "6mo": 130,
  "1y": 252, "2y": 504, "5y": 1260, "10y": 2520, "max": 9999,
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const { searchParams } = new URL(request.url);
  const interval = searchParams.get("interval") ?? "1d";
  const range = searchParams.get("range") ?? "1y";

  const h = HOLDINGS_DEFINITION.find(x => x.ticker === ticker);
  const yfSymbol = h?.yfSymbol ?? TICKER_TO_YF[ticker] ?? ticker;
  const cacheKey = `history-${yfSymbol}-${interval}-${range}`;

  const cached = historyCache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  // Serve daily bars from SQLite if we have enough data stored
  if (interval === "1d") {
    const needed = RANGE_DAYS[range] ?? 252;
    const stored = await barCount(ticker);

    if (stored >= Math.min(needed, 20)) {
      const limitDays = needed < 9000 ? needed : undefined;
      const dbBars = await getHistory(ticker, limitDays);

      if (dbBars.length > 0) {
        const bars = dbBars.map(b => ({
          date: b.date,
          timestamp: Math.floor(new Date(b.date + "T12:00:00Z").getTime() / 1000),
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
          volume: b.volume,
          adjClose: b.adjClose,
        }));
        const result = { bars, ticker, yfSymbol, interval, range, source: "db" };
        historyCache.set(cacheKey, result, 300_000);
        return NextResponse.json(result);
      }
    }
  }

  // Fall back to Yahoo (intraday intervals, or daily when DB is cold)
  try {
    const bars = await fetchOHLCV(yfSymbol, interval, range);
    const result = { bars, ticker, yfSymbol, interval, range, source: "yahoo" };
    const ttl = interval === "1d" ? 300_000 : 60_000;
    historyCache.set(cacheKey, result, ttl);
    return NextResponse.json(result);
  } catch (err) {
    console.error(`History fetch error for ${ticker}:`, err);
    return NextResponse.json(
      { error: "Failed to fetch history", bars: [], ticker },
      { status: 500 }
    );
  }
}
