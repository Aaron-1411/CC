/**
 * Yahoo Finance client — SERVER ONLY
 * Never import this in client components.
 */
import type { Quote, OHLCVBar } from "@/types/market";

const BASE_V7 = "https://query1.finance.yahoo.com/v7/finance/quote";
const BASE_V8 = "https://query1.finance.yahoo.com/v8/finance/chart";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

// Symbols that trade in GBX (pence) — divide by 100 for GBP
const GBX_SYMBOLS = new Set([
  "EQQQ.L",
  "VWRP.L",
  "VUAG.L",
  "SGLN.L",
  "^FTSE",
]);

// Map ticker -> Yahoo Finance symbol
export const TICKER_TO_YF: Record<string, string> = {
  EQQQ: "EQQQ.L",
  VWRP: "VWRP.L",
  VUAG: "VUAG.L",
  "BRK.A": "BRK-A",
  NVDA: "NVDA",
  GOOGL: "GOOGL",
  AAPL: "AAPL",
  SGLN: "SGLN.L",
  ASML: "ASML",
  MSTR: "MSTR",
  PLTR: "PLTR",
};

export const ALL_YF_SYMBOLS = [
  "EQQQ.L",
  "VWRP.L",
  "VUAG.L",
  "BRK-A",
  "NVDA",
  "GOOGL",
  "AAPL",
  "SGLN.L",
  "ASML",
  "MSTR",
  "PLTR",
  "^GSPC",
  "^FTSE",
  "^IXIC",
  "GBPUSD=X",
];

function isGBX(yfSymbol: string, currency: string): boolean {
  return GBX_SYMBOLS.has(yfSymbol) || currency === "GBp";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseQuote(raw: Record<string, unknown>, gbpUsd: number): Quote {
  const yfSymbol = raw.symbol as string;
  const currency = (raw.currency as string) ?? "USD";
  const rawPrice = (raw.regularMarketPrice as number) ?? 0;
  const rawChange = (raw.regularMarketChange as number) ?? 0;
  const rawChangePct = (raw.regularMarketChangePercent as number) ?? 0;

  // Convert GBX → GBP
  const divisor = isGBX(yfSymbol, currency) ? 100 : 1;
  const price = rawPrice / divisor;
  const change = rawChange / divisor;

  // Convert to GBP
  const isUSD = currency === "USD" || (!currency.startsWith("GB") && currency !== "GBp");
  const priceGBP = isGBX(yfSymbol, currency)
    ? price
    : isUSD
    ? price / gbpUsd
    : price;
  const changeGBP = isGBX(yfSymbol, currency)
    ? change
    : isUSD
    ? change / gbpUsd
    : change;

  return {
    ticker: yfSymbol,
    yfSymbol,
    price,
    priceGBP,
    currency: isGBX(yfSymbol, currency) ? "GBP" : currency,
    changePercent: rawChangePct,
    change,
    changeGBP,
    volume: (raw.regularMarketVolume as number) ?? 0,
    marketCap: (raw.marketCap as number) ?? null,
    dayHigh: ((raw.regularMarketDayHigh as number) ?? 0) / divisor,
    dayLow: ((raw.regularMarketDayLow as number) ?? 0) / divisor,
    fiftyTwoWeekHigh: ((raw.fiftyTwoWeekHigh as number) ?? 0) / divisor,
    fiftyTwoWeekLow: ((raw.fiftyTwoWeekLow as number) ?? 0) / divisor,
    previousClose: ((raw.regularMarketPreviousClose as number) ?? 0) / divisor,
    open: ((raw.regularMarketOpen as number) ?? 0) / divisor,
    bid: raw.bid != null ? (raw.bid as number) / divisor : null,
    ask: raw.ask != null ? (raw.ask as number) / divisor : null,
    lastUpdated: new Date(
      ((raw.regularMarketTime as number) ?? 0) * 1000
    ).toISOString(),
    marketState: (raw.marketState as Quote["marketState"]) ?? "CLOSED",
    displayName: (raw.displayName as string) ?? null,
    shortName: (raw.shortName as string) ?? null,
  };
}

/**
 * Fetch a single symbol's current quote using v8 chart (1d range, 1d interval).
 * More reliable than v7 quoteResponse which requires auth in some regions.
 */
async function fetchSingleQuote(
  yfSymbol: string,
  gbpUsd: number
): Promise<Quote | null> {
  try {
    const url = `${BASE_V8}/${encodeURIComponent(yfSymbol)}?interval=1d&range=5d&events=div,split`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 15 } });
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as any;
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta ?? {};
    const currency: string = meta.currency ?? "USD";
    const divisor = isGBX(yfSymbol, currency) ? 100 : 1;

    const rawPrice: number = (meta.regularMarketPrice ?? meta.previousClose ?? 0) / divisor;
    const rawPrev: number = (meta.chartPreviousClose ?? meta.previousClose ?? rawPrice) / divisor;
    const rawChange = rawPrice - rawPrev;
    const rawChangePct = rawPrev !== 0 ? (rawChange / rawPrev) * 100 : 0;

    const isUSD = currency === "USD" || (!currency.startsWith("GB") && currency !== "GBp");
    const priceGBP = isGBX(yfSymbol, currency) ? rawPrice : isUSD ? rawPrice / gbpUsd : rawPrice;

    return {
      ticker: yfSymbol,
      yfSymbol,
      price: rawPrice,
      priceGBP,
      currency: isGBX(yfSymbol, currency) ? "GBP" : currency,
      changePercent: rawChangePct,
      change: rawChange,
      changeGBP: isGBX(yfSymbol, currency) ? rawChange : isUSD ? rawChange / gbpUsd : rawChange,
      volume: meta.regularMarketVolume ?? 0,
      marketCap: null,
      dayHigh: (meta.regularMarketDayHigh ?? rawPrice) / divisor,
      dayLow: (meta.regularMarketDayLow ?? rawPrice) / divisor,
      fiftyTwoWeekHigh: (meta.fiftyTwoWeekHigh ?? rawPrice) / divisor,
      fiftyTwoWeekLow: (meta.fiftyTwoWeekLow ?? rawPrice) / divisor,
      previousClose: rawPrev,
      open: (meta.regularMarketOpen ?? rawPrice) / divisor,
      bid: null,
      ask: null,
      lastUpdated: new Date(((meta.regularMarketTime ?? 0) as number) * 1000).toISOString(),
      marketState: (meta.marketState ?? "CLOSED") as Quote["marketState"],
      displayName: meta.longName ?? meta.shortName ?? null,
      shortName: meta.shortName ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch batch quotes for all symbols using v8 chart endpoint (more reliable).
 * Returns a map: yfSymbol → Quote
 */
export async function fetchBatchQuotes(
  symbols: string[]
): Promise<Record<string, Quote>> {
  // First fetch FX rate so we can convert USD→GBP
  let gbpUsd = 1.27;
  const fxSymbols = ["GBPUSD=X"];
  const nonFxSymbols = symbols.filter((s) => !fxSymbols.includes(s));

  // Fetch FX first (small, fast)
  try {
    const fxUrl = `${BASE_V8}/GBPUSD=X?interval=1d&range=2d`;
    const fxRes = await fetch(fxUrl, { headers: HEADERS, next: { revalidate: 60 } });
    if (fxRes.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fxJson = (await fxRes.json()) as any;
      const fxMeta = fxJson?.chart?.result?.[0]?.meta;
      if (fxMeta?.regularMarketPrice) gbpUsd = fxMeta.regularMarketPrice;
    }
  } catch { /* use fallback */ }

  // Fetch all symbols in parallel (cap at 12 concurrent)
  const CONCURRENCY = 12;
  const quotes: Record<string, Quote> = {
    "GBPUSD=X": {
      ticker: "GBPUSD=X", yfSymbol: "GBPUSD=X", price: gbpUsd, priceGBP: 1,
      currency: "USD", changePercent: 0, change: 0, changeGBP: 0,
      volume: 0, marketCap: null, dayHigh: gbpUsd, dayLow: gbpUsd,
      fiftyTwoWeekHigh: gbpUsd, fiftyTwoWeekLow: gbpUsd, previousClose: gbpUsd,
      open: gbpUsd, bid: null, ask: null, lastUpdated: new Date().toISOString(),
      marketState: "REGULAR", displayName: "GBP/USD", shortName: "GBP/USD",
    },
  };

  for (let i = 0; i < nonFxSymbols.length; i += CONCURRENCY) {
    const batch = nonFxSymbols.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((sym) => fetchSingleQuote(sym, gbpUsd)));
    for (let j = 0; j < batch.length; j++) {
      const q = results[j];
      if (q) quotes[batch[j]] = q;
    }
  }

  return quotes;
}

/**
 * Fetch OHLCV history for a single symbol.
 * interval: "1m"|"5m"|"15m"|"30m"|"60m"|"1h"|"1d"|"1wk"|"1mo"
 * range: "1d"|"5d"|"1mo"|"3mo"|"6mo"|"1y"|"2y"|"5y"|"10y"|"ytd"|"max"
 */
export async function fetchOHLCV(
  symbol: string,
  interval: string = "1d",
  range: string = "1y"
): Promise<OHLCVBar[]> {
  const url = `${BASE_V8}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;

  const res = await fetch(url, {
    headers: HEADERS,
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance history fetch failed for ${symbol}: ${res.status}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await res.json()) as any;
  const result = json?.chart?.result?.[0];
  if (!result) return [];

  const timestamps: number[] = result.timestamp ?? [];
  const ohlcv = result.indicators?.quote?.[0] ?? {};
  const opens: (number | null)[] = ohlcv.open ?? [];
  const highs: (number | null)[] = ohlcv.high ?? [];
  const lows: (number | null)[] = ohlcv.low ?? [];
  const closes: (number | null)[] = ohlcv.close ?? [];
  const volumes: (number | null)[] = ohlcv.volume ?? [];
  const adjCloses: (number | null)[] =
    result.indicators?.adjclose?.[0]?.adjclose ?? [];

  // Check if this is a GBX symbol
  const currency: string = result.meta?.currency ?? "";
  const divisor = isGBX(symbol, currency) ? 100 : 1;

  const bars: OHLCVBar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close == null) continue;

    bars.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      timestamp: timestamps[i],
      open: (opens[i] ?? close) / divisor,
      high: (highs[i] ?? close) / divisor,
      low: (lows[i] ?? close) / divisor,
      close: close / divisor,
      volume: volumes[i] ?? 0,
      adjClose:
        adjCloses[i] != null ? (adjCloses[i] as number) / divisor : undefined,
    });
  }

  return bars;
}

interface YahooNewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  type: string;
  thumbnail?: { resolutions?: { url: string }[] };
  relatedTickers?: string[];
}

/**
 * Fetch news for a symbol via Yahoo Finance search — no API key required.
 * Returns items shaped to match NewsItem from @/types/market.
 */
export async function fetchYahooNews(symbol: string, count = 20) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=${count}&quotesCount=0&enableFuzzyQuery=false&enableNavLinks=false`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as any;
    const items: YahooNewsItem[] = json?.news ?? [];
    return items
      .filter(n => n.type === "STORY" && n.title && n.link)
      .map(n => ({
        id: `yf-${n.uuid}`,
        ticker: symbol,
        headline: n.title,
        summary: null as string | null,
        source: n.publisher,
        url: n.link,
        publishedAt: n.providerPublishTime,
        sentiment: null as "bullish" | "bearish" | "neutral" | null,
        sentimentScore: null as number | null,
        category: "company news",
        image: n.thumbnail?.resolutions?.[0]?.url ?? null,
        related: n.relatedTickers ?? [],
      }));
  } catch {
    return [];
  }
}
