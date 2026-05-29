import { NextResponse } from "next/server";
import { historyCache } from "@/lib/cache";


const BASE_V8 = "https://query1.finance.yahoo.com/v8/finance/chart";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

const BENCHMARK_NAMES: Record<string, string> = {
  "^FTAS": "FTSE All-Share",
  "^FTSE": "FTSE 100",
  "VWRL.L": "MSCI ACWI (VWRL)",
};

// These trade in GBX (pence) — divide by 100 for GBP
const GBX_SYMBOLS = new Set(["VWRL.L"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "1y";

  const cacheKey = `benchmark-${symbol}-${range}`;
  const cached = historyCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const url = `${BASE_V8}/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
    const res = await fetch(url, { headers: HEADERS });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Yahoo Finance returned ${res.status}` },
        { status: 502 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as any;
    const result = json?.chart?.result?.[0];
    if (!result) {
      return NextResponse.json({ error: "No data returned" }, { status: 404 });
    }

    const meta = result.meta ?? {};
    const currency: string = meta.currency ?? "USD";
    const isGBX = GBX_SYMBOLS.has(symbol) || currency === "GBp";
    const divisor = isGBX ? 100 : 1;

    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] =
      result.indicators?.quote?.[0]?.close ?? [];

    interface Bar {
      date: string;
      close: number;
      return: number | null;
    }

    const bars: Bar[] = [];
    let prevClose: number | null = null;

    for (let i = 0; i < timestamps.length; i++) {
      const rawClose = closes[i];
      if (rawClose == null) continue;
      const close = rawClose / divisor;
      const dailyReturn = prevClose != null ? (close - prevClose) / prevClose : null;
      bars.push({
        date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
        close,
        return: dailyReturn,
      });
      prevClose = close;
    }

    const resultData = {
      symbol,
      name: BENCHMARK_NAMES[symbol] ?? symbol,
      range,
      bars,
      isTotalReturn: false,
      currency: isGBX ? "GBP" : currency,
    };

    historyCache.set(cacheKey, resultData, 5 * 60_000); // 5 min TTL

    return NextResponse.json(resultData);
  } catch (err) {
    console.error(`Benchmark fetch error for ${symbol}:`, err);
    return NextResponse.json(
      { error: "Failed to fetch benchmark data" },
      { status: 500 }
    );
  }
}
