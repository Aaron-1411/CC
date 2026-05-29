import { NextResponse } from "next/server";
import { fetchBatchQuotes, ALL_YF_SYMBOLS } from "@/lib/data/yahoo";
import { priceCache } from "@/lib/cache";
import type { Quote } from "@/types/market";

export const revalidate = 0;

export async function GET() {
  const cacheKey = "batch-quotes";
  const cached = priceCache.get(cacheKey) as
    | { quotes: Record<string, Quote>; gbpUsd: number; lastUpdated: string }
    | undefined;

  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const quotes = await fetchBatchQuotes(ALL_YF_SYMBOLS);

    const gbpUsdQuote = quotes["GBPUSD=X"];
    const gbpUsd = gbpUsdQuote?.price ?? 1.27;

    const result = {
      quotes,
      gbpUsd,
      lastUpdated: new Date().toISOString(),
    };

    priceCache.set(cacheKey, result, 15_000); // 15s TTL

    return NextResponse.json(result);
  } catch (err) {
    console.error("Price fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch prices", quotes: {}, gbpUsd: 1.27, lastUpdated: new Date().toISOString() },
      { status: 500 }
    );
  }
}
