import { NextResponse } from "next/server";
import { fundamentalsCache } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { HOLDINGS_DEFINITION } from "@/lib/constants";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE_V11 = "https://query2.finance.yahoo.com/v11/finance/quoteSummary";

// Fallback holdings from ETF factsheets (updated May 2026). Used when Yahoo is rate-limited.
const FALLBACK_HOLDINGS: Record<string, { symbol: string; holdingName: string; holdingPercent: number }[]> = {
  EQQQ: [
    { symbol: "AAPL",  holdingName: "Apple Inc",             holdingPercent: 8.92 },
    { symbol: "NVDA",  holdingName: "NVIDIA Corp",            holdingPercent: 8.65 },
    { symbol: "MSFT",  holdingName: "Microsoft Corp",         holdingPercent: 7.91 },
    { symbol: "AMZN",  holdingName: "Amazon.com Inc",         holdingPercent: 5.38 },
    { symbol: "GOOGL", holdingName: "Alphabet Inc Cl A",      holdingPercent: 3.84 },
    { symbol: "GOOG",  holdingName: "Alphabet Inc Cl C",      holdingPercent: 3.59 },
    { symbol: "META",  holdingName: "Meta Platforms Inc",     holdingPercent: 4.76 },
    { symbol: "TSLA",  holdingName: "Tesla Inc",              holdingPercent: 3.52 },
    { symbol: "AVGO",  holdingName: "Broadcom Inc",           holdingPercent: 3.28 },
    { symbol: "COST",  holdingName: "Costco Wholesale Corp",  holdingPercent: 2.61 },
  ],
  VWRP: [
    { symbol: "AAPL",  holdingName: "Apple Inc",              holdingPercent: 4.29 },
    { symbol: "NVDA",  holdingName: "NVIDIA Corp",             holdingPercent: 4.02 },
    { symbol: "MSFT",  holdingName: "Microsoft Corp",          holdingPercent: 3.81 },
    { symbol: "AMZN",  holdingName: "Amazon.com Inc",          holdingPercent: 2.58 },
    { symbol: "META",  holdingName: "Meta Platforms Inc",      holdingPercent: 1.93 },
    { symbol: "GOOGL", holdingName: "Alphabet Inc",            holdingPercent: 1.92 },
    { symbol: "TSLA",  holdingName: "Tesla Inc",               holdingPercent: 1.36 },
    { symbol: "AVGO",  holdingName: "Broadcom Inc",            holdingPercent: 1.21 },
    { symbol: "BRK-B", holdingName: "Berkshire Hathaway B",   holdingPercent: 0.98 },
    { symbol: "JPM",   holdingName: "JPMorgan Chase & Co",     holdingPercent: 0.87 },
  ],
  VUAG: [
    { symbol: "AAPL",  holdingName: "Apple Inc",              holdingPercent: 7.17 },
    { symbol: "NVDA",  holdingName: "NVIDIA Corp",             holdingPercent: 6.42 },
    { symbol: "MSFT",  holdingName: "Microsoft Corp",          holdingPercent: 6.19 },
    { symbol: "AMZN",  holdingName: "Amazon.com Inc",          holdingPercent: 3.89 },
    { symbol: "META",  holdingName: "Meta Platforms Inc",      holdingPercent: 3.01 },
    { symbol: "GOOGL", holdingName: "Alphabet Inc Cl A",       holdingPercent: 3.14 },
    { symbol: "TSLA",  holdingName: "Tesla Inc",               holdingPercent: 2.46 },
    { symbol: "BRK-B", holdingName: "Berkshire Hathaway B",   holdingPercent: 1.86 },
    { symbol: "AVGO",  holdingName: "Broadcom Inc",            holdingPercent: 1.95 },
    { symbol: "JPM",   holdingName: "JPMorgan Chase & Co",     holdingPercent: 1.39 },
  ],
  SGLN: [
    { symbol: "GOLD",  holdingName: "LBMA Gold Price PM (troy oz)", holdingPercent: 100 },
  ],
};

interface ETFHolding {
  symbol: string;
  holdingName: string;
  holdingPercent: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTopHoldings(topHoldings: any): ETFHolding[] {
  const raw = topHoldings?.holdings ?? topHoldings?.equityHoldings ?? [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h: Record<string, unknown>) => ({
      symbol: (h.symbol as string) ?? "",
      holdingName: (h.holdingName as string) ?? (h.symbol as string) ?? "",
      holdingPercent: (h.holdingPercent as { raw?: number })?.raw ?? (h.holdingPercent as number) ?? 0,
    }))
    .filter((h) => h.holdingPercent > 0)
    .sort((a, b) => b.holdingPercent - a.holdingPercent);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const cacheKey = `etf-holdings-${ticker}`;

  const cached = fundamentalsCache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  const h = HOLDINGS_DEFINITION.find((x) => x.ticker === ticker);
  const yfSymbol = h?.yfSymbol ?? ticker;

  // 1. Try reading from the persisted FundamentalSnapshot (populated by quote-summary route)
  try {
    const row = await prisma.fundamentalSnapshot.findUnique({ where: { ticker } });
    if (row) {
      const snap = JSON.parse(row.data) as { topHoldings?: unknown };
      if (snap?.topHoldings) {
        const holdings = parseTopHoldings(snap.topHoldings);
        if (holdings.length > 0) {
          const result = { ticker, holdings, source: "db" };
          fundamentalsCache.set(cacheKey, result, 6 * 3_600_000);
          return NextResponse.json(result);
        }
      }
    }
  } catch { /* fall through to live fetch */ }

  // 2. Fetch topHoldings module directly from Yahoo
  try {
    const url = `${BASE_V11}/${encodeURIComponent(yfSymbol)}?modules=topHoldings`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json", "Accept-Language": "en-US,en;q=0.9" },
    });

    if (res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = (await res.json()) as any;
      const topHoldings = json?.quoteSummary?.result?.[0]?.topHoldings;
      if (topHoldings) {
        const holdings = parseTopHoldings(topHoldings);
        const result = { ticker, holdings, source: "yahoo" };
        fundamentalsCache.set(cacheKey, result, 6 * 3_600_000);
        // Persist so quote-summary route also benefits
        try {
          await prisma.fundamentalSnapshot.upsert({
            where: { ticker },
            update: { data: JSON.stringify({ ticker, topHoldings }), fetchedAt: new Date() },
            create: { ticker, data: JSON.stringify({ ticker, topHoldings }) },
          });
        } catch { /* non-fatal */ }
        return NextResponse.json(result);
      }
    }
  } catch { /* fall through */ }

  // 3. Hardcoded fallback from ETF factsheets (updated May 2026)
  const fallback = FALLBACK_HOLDINGS[ticker];
  if (fallback) {
    const result = { ticker, holdings: fallback, source: "factsheet" };
    fundamentalsCache.set(cacheKey, result, 24 * 3_600_000); // 24h
    return NextResponse.json(result);
  }

  return NextResponse.json({ ticker, holdings: [] });
}
