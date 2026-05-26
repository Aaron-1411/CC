import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { historyCache } from "@/lib/cache";
import {
  calcBenchmarkComparison,
  calcRollingSeries,
  type BenchmarkComparison,
  type RollingPoint,
} from "@/lib/analytics/benchmark";

export const dynamic = "force-dynamic";

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

const GBX_SYMBOLS = new Set(["VWRL.L"]);

const RISK_FREE_RATE = 0.04;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "^FTSE";
  const range = searchParams.get("range") ?? "1y";

  try {
    // Fetch portfolio snapshots
    const snapshots = await prisma.dailySnapshot.findMany({
      orderBy: { date: "asc" },
      select: { date: true, totalValueGBP: true },
    });

    // Fetch benchmark data from Yahoo Finance
    const benchmarkCacheKey = `benchmark-${symbol}-${range}`;
    let benchmarkBars: { date: string; close: number }[] = [];

    const cached = historyCache.get(benchmarkCacheKey);
    if (cached && typeof cached === "object" && "bars" in (cached as object)) {
      benchmarkBars = (cached as { bars: { date: string; close: number }[] }).bars;
    } else {
      try {
        const url = `${BASE_V8}/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
        const res = await fetch(url, { headers: HEADERS });
        if (res.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const json = (await res.json()) as any;
          const result = json?.chart?.result?.[0];
          if (result) {
            const meta = result.meta ?? {};
            const currency: string = meta.currency ?? "USD";
            const isGBX = GBX_SYMBOLS.has(symbol) || currency === "GBp";
            const divisor = isGBX ? 100 : 1;
            const timestamps: number[] = result.timestamp ?? [];
            const closes: (number | null)[] =
              result.indicators?.quote?.[0]?.close ?? [];

            for (let i = 0; i < timestamps.length; i++) {
              const rawClose = closes[i];
              if (rawClose == null) continue;
              benchmarkBars.push({
                date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
                close: rawClose / divisor,
              });
            }
            historyCache.set(benchmarkCacheKey, { bars: benchmarkBars }, 5 * 60_000);
          }
        }
      } catch {
        // proceed with empty benchmark
      }
    }

    // Build date-indexed maps for alignment
    const portfolioMap = new Map<string, number>();
    for (const snap of snapshots) {
      portfolioMap.set(snap.date.toISOString().slice(0, 10), snap.totalValueGBP);
    }

    const benchmarkMap = new Map<string, number>();
    for (const bar of benchmarkBars) {
      benchmarkMap.set(bar.date, bar.close);
    }

    // Inner join on dates
    const alignedDates = Array.from(portfolioMap.keys())
      .filter((d) => benchmarkMap.has(d))
      .sort();

    if (alignedDates.length < 30) {
      return NextResponse.json({
        insufficientData: true,
        metrics: null,
        rolling: null,
        portfolioEquityCurve: [],
        symbol,
        benchmarkName: BENCHMARK_NAMES[symbol] ?? symbol,
        isTotalReturn: false,
      });
    }

    // Compute portfolio returns and benchmark returns over aligned dates
    const portfolioValues = alignedDates.map((d) => portfolioMap.get(d)!);
    const benchmarkValues = alignedDates.map((d) => benchmarkMap.get(d)!);

    const portfolioReturns: number[] = [];
    const benchmarkReturns: number[] = [];

    for (let i = 1; i < alignedDates.length; i++) {
      const pPrev = portfolioValues[i - 1];
      const bPrev = benchmarkValues[i - 1];
      if (pPrev > 0) portfolioReturns.push((portfolioValues[i] - pPrev) / pPrev);
      if (bPrev > 0) benchmarkReturns.push((benchmarkValues[i] - bPrev) / bPrev);
    }

    // Annualised portfolio return
    const firstVal = portfolioValues[0];
    const lastVal = portfolioValues[portfolioValues.length - 1];
    const nDays = alignedDates.length;
    const annualisedPortfolioReturn =
      firstVal > 0 ? Math.pow(lastVal / firstVal, 365 / nDays) - 1 : 0;

    const metrics: BenchmarkComparison = calcBenchmarkComparison(
      portfolioReturns,
      benchmarkReturns,
      RISK_FREE_RATE,
      annualisedPortfolioReturn
    );

    // Rolling series using aligned portfolio values
    const alignedPortfolioValues = alignedDates.map((d, i) => ({
      date: new Date(d),
      value: portfolioValues[i],
    }));

    const sharpe30: RollingPoint[] = calcRollingSeries(alignedPortfolioValues, 30, "sharpe", RISK_FREE_RATE);
    const vol30: RollingPoint[] = calcRollingSeries(alignedPortfolioValues, 30, "volatility", RISK_FREE_RATE);
    const sharpe90: RollingPoint[] = calcRollingSeries(alignedPortfolioValues, 90, "sharpe", RISK_FREE_RATE);
    const vol90: RollingPoint[] = calcRollingSeries(alignedPortfolioValues, 90, "volatility", RISK_FREE_RATE);

    // Portfolio equity curve with benchmark indexed to portfolio start
    const benchmarkStartVal = benchmarkValues[0];
    const portfolioEquityCurve = alignedDates.map((d, i) => ({
      date: d,
      value: portfolioValues[i],
      benchmarkIndexed:
        benchmarkStartVal > 0
          ? (benchmarkValues[i] / benchmarkStartVal) * portfolioValues[0]
          : null,
    }));

    return NextResponse.json({
      insufficientData: false,
      metrics,
      rolling: { sharpe30, vol30, sharpe90, vol90 },
      portfolioEquityCurve,
      symbol,
      benchmarkName: BENCHMARK_NAMES[symbol] ?? symbol,
      isTotalReturn: false,
    });
  } catch (err) {
    console.error("Benchmark analytics error:", err);
    return NextResponse.json(
      { error: "Failed to compute benchmark metrics" },
      { status: 500 }
    );
  }
}
