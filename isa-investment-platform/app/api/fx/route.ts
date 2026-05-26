import { NextResponse } from "next/server";
import { fetchFXRates } from "@/lib/data/fx";
import { fxCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const cacheKey = "fx-rates";
  const cached = fxCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const rates = await fetchFXRates("GBP");
    fxCache.set(cacheKey, rates, 300_000); // 5 min TTL
    return NextResponse.json(rates);
  } catch (err) {
    console.error("FX fetch error:", err);
    return NextResponse.json(
      { base: "GBP", rates: { USD: 1.27, EUR: 1.17 }, timestamp: Date.now() },
      { status: 500 }
    );
  }
}
