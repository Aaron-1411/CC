import { NextResponse } from "next/server";
import { storeSummary } from "@/lib/priceHistory";
import { HOLDINGS_DEFINITION } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const summary = await storeSummary();
  const tickers = HOLDINGS_DEFINITION.map(h => h.ticker);
  const total = tickers.reduce((s, t) => s + (summary[t]?.count ?? 0), 0);
  const ready = tickers.filter(t => (summary[t]?.count ?? 0) >= 100).length;
  return NextResponse.json({
    ready,
    total: tickers.length,
    bootstrapped: ready === tickers.length,
    totalBars: total,
    summary,
  });
}
