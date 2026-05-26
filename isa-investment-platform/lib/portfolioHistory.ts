/**
 * Synthesises portfolio daily value history from PriceHistory bars.
 * Uses BASELINE_SNAPSHOT weights + current prices to reconstruct what the
 * portfolio was worth on each historical trading day.
 *
 * Formula: holdingValue[ticker][date] = position.valueGBP * (adjClose[date] / adjClose[latestDate])
 * This assumes no trades since baseline (single cost-basis snapshot).
 */
import { prisma } from "@/lib/db";
import { BASELINE_SNAPSHOT, HOLDINGS_DEFINITION } from "@/lib/constants";

export interface PortfolioPoint {
  date: string;
  valueGBP: number;
}

/**
 * Returns daily portfolio value series derived from PriceHistory bars.
 * Falls back to BASELINE_SNAPSHOT single point if no bars available.
 */
export async function syntheticPortfolioHistory(
  limitDays = 9999
): Promise<PortfolioPoint[]> {
  const tickers = HOLDINGS_DEFINITION.map((h) => h.ticker);

  const rows = await prisma.priceHistory.findMany({
    where: { ticker: { in: tickers } },
    orderBy: { date: "asc" },
    select: { ticker: true, date: true, adjClose: true },
  });

  if (!rows.length) {
    // Return baseline as single point
    return [
      {
        date: BASELINE_SNAPSHOT.date.toISOString().slice(0, 10),
        valueGBP: BASELINE_SNAPSHOT.totalValueGBP,
      },
    ];
  }

  // Group by ticker → Map<date, adjClose>
  const byTicker: Record<string, Map<string, number>> = {};
  for (const r of rows) {
    if (!byTicker[r.ticker]) byTicker[r.ticker] = new Map();
    byTicker[r.ticker].set(r.date, r.adjClose);
  }

  // Find latest date available for each ticker (to compute scaling factor)
  const latestByTicker: Record<string, { date: string; price: number }> = {};
  for (const [ticker, priceMap] of Object.entries(byTicker)) {
    const sortedDates = [...priceMap.keys()].sort();
    const latestDate = sortedDates[sortedDates.length - 1];
    latestByTicker[ticker] = { date: latestDate, price: priceMap.get(latestDate)! };
  }

  // Map baseline position values by ticker
  const baselineValue: Record<string, number> = {};
  for (const pos of BASELINE_SNAPSHOT.positions) {
    baselineValue[pos.ticker] = pos.valueGBP;
  }

  // Find intersection of dates across all tickers that have a baseline value
  const activeTickers = tickers.filter(
    (t) => byTicker[t] && baselineValue[t] != null
  );
  if (!activeTickers.length) {
    return [
      {
        date: BASELINE_SNAPSHOT.date.toISOString().slice(0, 10),
        valueGBP: BASELINE_SNAPSHOT.totalValueGBP,
      },
    ];
  }

  // Build intersection of dates
  let commonDates: string[] | null = null;
  for (const ticker of activeTickers) {
    const dates = [...byTicker[ticker].keys()];
    commonDates =
      commonDates === null
        ? dates
        : commonDates.filter((d) => byTicker[ticker].has(d));
  }
  const allDates = (commonDates ?? []).sort();

  // Apply limitDays
  const slicedDates =
    limitDays < allDates.length ? allDates.slice(-limitDays) : allDates;

  // For each date, sum scaled holding values
  const result: PortfolioPoint[] = [];
  for (const date of slicedDates) {
    let total = 0;
    let hasAll = true;
    for (const ticker of activeTickers) {
      const price = byTicker[ticker].get(date);
      const latestPrice = latestByTicker[ticker]?.price;
      if (!price || !latestPrice || latestPrice === 0) {
        hasAll = false;
        break;
      }
      // Scale the baseline GBP value by price ratio
      total += baselineValue[ticker] * (price / latestPrice);
    }
    if (hasAll && total > 0) {
      result.push({ date, valueGBP: total });
    }
  }

  return result.length > 0
    ? result
    : [
        {
          date: BASELINE_SNAPSHOT.date.toISOString().slice(0, 10),
          valueGBP: BASELINE_SNAPSHOT.totalValueGBP,
        },
      ];
}

/**
 * Returns rolling performance periods computed from synthetic history.
 * Compatible with calcRollingPerformance output shape.
 */
export function calcPeriodsFromHistory(
  points: PortfolioPoint[],
  itdCostGBP?: number
): {
  period: string;
  portfolioReturn: number;
  absoluteGainGBP: number;
  startValue: number;
  endValue: number;
  alpha: null;
  benchmarkReturn: null;
}[] {
  if (points.length < 2) return [];

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const latestDate = new Date(latest.date + "T12:00:00Z");
  const endValue = latest.valueGBP;

  function findClosest(targetDate: Date): PortfolioPoint | null {
    let best: PortfolioPoint | null = null;
    let bestDiff = Infinity;
    for (const p of sorted) {
      const d = new Date(p.date + "T12:00:00Z");
      if (d > latestDate) continue;
      const diff = Math.abs(d.getTime() - targetDate.getTime());
      if (diff < bestDiff) {
        bestDiff = diff;
        best = p;
      }
    }
    return best;
  }

  function period(
    label: string,
    startDate: Date
  ): {
    period: string;
    portfolioReturn: number;
    absoluteGainGBP: number;
    startValue: number;
    endValue: number;
    alpha: null;
    benchmarkReturn: null;
  } | null {
    const start = findClosest(startDate);
    if (!start || start.valueGBP === 0) return null;
    const ret = (endValue - start.valueGBP) / start.valueGBP;
    return {
      period: label,
      portfolioReturn: ret * 100,
      absoluteGainGBP: endValue - start.valueGBP,
      startValue: start.valueGBP,
      endValue,
      alpha: null,
      benchmarkReturn: null,
    };
  }

  const daysBack = (n: number) => {
    const d = new Date(latestDate);
    d.setDate(d.getDate() - n);
    return d;
  };

  // Tax year starts 6 April. If we're before April 6, use previous year's April 6.
  const yr = latestDate.getUTCMonth() < 3 || (latestDate.getUTCMonth() === 3 && latestDate.getUTCDate() < 6)
    ? latestDate.getUTCFullYear() - 1
    : latestDate.getUTCFullYear();
  const ytdStart = new Date(Date.UTC(yr, 3, 6)); // 6 Apr of current tax year

  const results = [
    period("1D", daysBack(1)),
    period("5D", daysBack(5)),
    period("1M", daysBack(30)),
    period("3M", daysBack(90)),
    period("YTD", ytdStart),
  ];

  // ITD: use actual cost basis so synthetic back-projection doesn't inflate the figure.
  // Real money return = (current value - total invested) / total invested.
  if (itdCostGBP != null && itdCostGBP > 0) {
    results.push({
      period: "ITD",
      portfolioReturn: (endValue - itdCostGBP) / itdCostGBP * 100,
      absoluteGainGBP: endValue - itdCostGBP,
      startValue: itdCostGBP,
      endValue,
      alpha: null,
      benchmarkReturn: null,
    });
  }

  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}
