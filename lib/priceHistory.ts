/**
 * PriceHistory — local SQLite bar store.
 *
 * Bootstrap once per ticker (10y OHLCV), then incremental daily refresh.
 * All analytics routes read from here instead of hitting Yahoo on every request.
 * Yahoo is only called: (a) on bootstrap, (b) during incremental refresh, (c) never for analytics.
 */
import { prisma } from '@/lib/db';
import { fetchOHLCV } from '@/lib/data/yahoo';
import { HOLDINGS_DEFINITION } from '@/lib/constants';

export interface PriceBar {
  date: string;      // "YYYY-MM-DD"
  adjClose: number;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

/** Read stored bars for a ticker, oldest-first (ascending). */
export async function getHistory(ticker: string, limitDays?: number): Promise<PriceBar[]> {
  const rows = limitDays
    ? // Fetch last N in descending order, then reverse to get ascending
      (await prisma.priceHistory.findMany({
        where: { ticker },
        orderBy: { date: 'desc' },
        take: limitDays,
      })).reverse()
    : await prisma.priceHistory.findMany({
        where: { ticker },
        orderBy: { date: 'asc' },
      });

  return rows.map((r): PriceBar => ({
    date: r.date,
    adjClose: r.adjClose,
    close: r.close,
    open: r.open,
    high: r.high,
    low: r.low,
    volume: r.volume,
  }));
}

/** Date of the most recent stored bar, or null if none. */
export async function latestDate(ticker: string): Promise<string | null> {
  const row = await prisma.priceHistory.findFirst({
    where: { ticker },
    orderBy: { date: 'desc' },
    select: { date: true },
  });
  return row?.date ?? null;
}

/** How many bars are stored for a ticker. */
export async function barCount(ticker: string): Promise<number> {
  return prisma.priceHistory.count({ where: { ticker } });
}

/** Write bars to DB, skipping any date that already exists. */
async function storeBars(ticker: string, bars: PriceBar[]): Promise<number> {
  if (!bars.length) return 0;

  // SQLite doesn't support skipDuplicates — query existing dates first and filter
  const dates = bars.map(b => b.date);
  const existing = await prisma.priceHistory.findMany({
    where: { ticker, date: { in: dates } },
    select: { date: true },
  });
  const existingSet = new Set(existing.map(r => r.date));
  const newBars = bars.filter(b => !existingSet.has(b.date));
  if (!newBars.length) return 0;

  // Batch insert in chunks of 500 to stay within SQLite limits
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < newBars.length; i += CHUNK) {
    const chunk = newBars.slice(i, i + CHUNK);
    const result = await prisma.priceHistory.createMany({
      data: chunk.map(b => ({
        ticker,
        date: b.date,
        adjClose: b.adjClose,
        close: b.close,
        open: b.open,
        high: b.high,
        low: b.low,
        volume: b.volume,
      })),
    });
    inserted += result.count;
  }
  return inserted;
}

/**
 * Bootstrap or incrementally refresh one ticker.
 * - First call: fetches 10y of daily bars.
 * - Subsequent calls: fetches only bars after the last stored date.
 * Returns the number of new bars written.
 */
export async function refreshTicker(ticker: string, yfSymbol: string): Promise<number> {
  const last = await latestDate(ticker);

  // Choose range: if we already have data, fetch 5d to get yesterday's bar cheaply.
  // If cold, fetch 10y for full bootstrap.
  const range = last ? '5d' : '10y';

  let bars;
  try {
    bars = await fetchOHLCV(yfSymbol, '1d', range);
  } catch {
    return 0;
  }
  if (!bars.length) return 0;

  const priceBars: PriceBar[] = bars
    .filter(b => b.close > 0 && (!last || b.date > last))
    .map(b => ({
      date: b.date,
      adjClose: b.adjClose ?? b.close,
      close: b.close,
      open: b.open ?? b.close,
      high: b.high ?? b.close,
      low: b.low ?? b.close,
      volume: b.volume ?? 0,
    }));

  return storeBars(ticker, priceBars);
}

// Macro / benchmark tickers stored alongside holdings for offline analytics
const MACRO_TICKERS: { ticker: string; yfSymbol: string }[] = [
  { ticker: "^VIX",     yfSymbol: "^VIX" },
  { ticker: "^TNX",     yfSymbol: "^TNX" },
  { ticker: "^IRX",     yfSymbol: "^IRX" },
  { ticker: "GBPUSD=X", yfSymbol: "GBPUSD=X" },
  { ticker: "^GSPC",    yfSymbol: "^GSPC" },
  { ticker: "^FTSE",    yfSymbol: "^FTSE" },
];

/**
 * Refresh all holdings + macro tickers in series (avoids hammering Yahoo concurrently).
 * Returns per-ticker new bar counts.
 */
export async function refreshAll(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  const allTickers = [
    ...HOLDINGS_DEFINITION.map(h => ({ ticker: h.ticker, yfSymbol: h.yfSymbol })),
    ...MACRO_TICKERS,
  ];
  for (const h of allTickers) {
    try {
      results[h.ticker] = await refreshTicker(h.ticker, h.yfSymbol);
    } catch (err) {
      console.error(`[priceHistory] refresh failed for ${h.ticker}:`, err);
      results[h.ticker] = -1;
    }
    // Small pause between tickers to be polite to Yahoo
    await new Promise(r => setTimeout(r, 300));
  }
  return results;
}

/** Summary of what's stored. */
export async function storeSummary(): Promise<Record<string, { count: number; first: string | null; last: string | null }>> {
  const rows = await prisma.priceHistory.groupBy({
    by: ['ticker'],
    _count: { ticker: true },
    _min: { date: true },
    _max: { date: true },
  });
  return Object.fromEntries(rows.map((r): [string, { count: number; first: string | null; last: string | null }] => [
    r.ticker,
    { count: r._count.ticker, first: r._min.date, last: r._max.date },
  ]));
}
