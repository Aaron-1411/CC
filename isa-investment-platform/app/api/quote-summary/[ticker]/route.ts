import { NextResponse } from "next/server";
import { fundamentalsCache } from "@/lib/cache";
import { prisma } from "@/lib/db";


const BASE_V10 = "https://query2.finance.yahoo.com/v10/finance/quoteSummary";
const BASE_V11 = "https://query2.finance.yahoo.com/v11/finance/quoteSummary";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const MODULES = [
  "assetProfile",
  "defaultKeyStatistics",
  "financialData",
  "summaryDetail",
  "incomeStatementHistory",
  "cashflowStatementHistory",
  "earningsHistory",
  "calendarEvents",
  "upgradeDowngradeHistory",
  "topHoldings",
].join(",");

const DB_TTL_MS = 90 * 24 * 3_600_000; // 90 days — static seed, re-run scripts/seed-fundamentals-static.mjs to refresh

// In-memory crumb cache (55 min TTL)
let crumbCache: { crumb: string; cookie: string; expiresAt: number } | null = null;

async function readFromDb(ticker: string): Promise<Record<string, unknown> | null> {
  try {
    const row = await prisma.fundamentalSnapshot.findUnique({ where: { ticker } });
    if (!row) return null;
    if (Date.now() - row.fetchedAt.getTime() > DB_TTL_MS) return null; // stale
    return JSON.parse(row.data) as Record<string, unknown>;
  } catch { return null; }
}

async function writeToDb(ticker: string, data: unknown): Promise<void> {
  try {
    await prisma.fundamentalSnapshot.upsert({
      where: { ticker },
      update: { data: JSON.stringify(data), fetchedAt: new Date() },
      create: { ticker, data: JSON.stringify(data) },
    });
  } catch { /* non-fatal */ }
}

async function acquireCrumb(symbol: string): Promise<{ crumb: string; cookie: string } | null> {
  if (crumbCache && Date.now() < crumbCache.expiresAt) return crumbCache;
  try {
    const seedRes = await fetch(`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`, {
      headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9" },
      redirect: "follow",
    });
    const rawCookies: string[] = [];
    seedRes.headers.forEach((val, key) => { if (key.toLowerCase() === "set-cookie") rawCookies.push(val); });
    const cookie = rawCookies.flatMap(h => h.split(/,(?=[^ ])/)).map(s => s.split(";")[0].trim()).filter(Boolean).join("; ");
    const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": UA, Cookie: cookie, "Accept-Language": "en-US,en;q=0.9" },
    });
    if (!crumbRes.ok) return null;
    const crumb = (await crumbRes.text()).trim();
    if (!crumb || crumb.length < 2) return null;
    crumbCache = { crumb, cookie, expiresAt: Date.now() + 55 * 60 * 1000 };
    return crumbCache;
  } catch { return null; }
}

/**
 * Fallback: Yahoo v7 /quote endpoint — no crumb required, returns basic fundamentals.
 * Shapes the response to match the quoteSummary structure so FundamentalsTab works.
 */
async function fetchV7Quote(symbol: string) {
  const fields = [
    "regularMarketPrice", "regularMarketVolume", "marketCap",
    "trailingPE", "forwardPE", "dividendYield", "epsTrailingTwelveMonths", "epsForward",
    "priceToBook", "fiftyTwoWeekHigh", "fiftyTwoWeekLow",
    "grossMargins", "operatingMargins", "profitMargins", "returnOnEquity", "returnOnAssets",
    "revenueGrowth", "earningsGrowth", "totalRevenue", "totalDebt", "totalCash",
    "debtToEquity", "currentRatio", "quickRatio", "freeCashflow",
    "targetMeanPrice", "targetHighPrice", "targetLowPrice",
    "numberOfAnalystOpinions", "recommendationMean", "recommendationKey",
    "beta", "trailingAnnualDividendRate", "payoutRatio",
    "enterpriseValue", "enterpriseToEbitda", "forwardEps", "pegRatio",
  ].join(",");

  for (const host of ["query1", "query2"]) {
    try {
      const url = `https://${host}.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=${fields}`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept": "application/json", "Accept-Language": "en-US,en;q=0.9" },
      });
      if (!res.ok) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = await res.json() as any;
      const q = json?.quoteResponse?.result?.[0];
      if (!q) continue;

      const wrap = (v: number | undefined) => v != null ? { raw: v, fmt: String(v) } : null;

      return {
        ticker: symbol,
        source: "v7quote",
        defaultKeyStatistics: {
          trailingEps:        wrap(q.epsTrailingTwelveMonths),
          forwardEps:         wrap(q.forwardEps),
          priceToBook:        wrap(q.priceToBook),
          pegRatio:           wrap(q.pegRatio),
          beta:               wrap(q.beta),
          enterpriseValue:    wrap(q.enterpriseValue),
          enterpriseToEbitda: wrap(q.enterpriseToEbitda),
          payoutRatio:        wrap(q.payoutRatio),
        },
        financialData: {
          grossMargins:        wrap(q.grossMargins),
          operatingMargins:    wrap(q.operatingMargins),
          profitMargins:       wrap(q.profitMargins),
          returnOnEquity:      wrap(q.returnOnEquity),
          returnOnAssets:      wrap(q.returnOnAssets),
          revenueGrowth:       wrap(q.revenueGrowth),
          earningsGrowth:      wrap(q.earningsGrowth),
          totalRevenue:        wrap(q.totalRevenue),
          totalDebt:           wrap(q.totalDebt),
          totalCash:           wrap(q.totalCash),
          debtToEquity:        wrap(q.debtToEquity),
          currentRatio:        wrap(q.currentRatio),
          quickRatio:          wrap(q.quickRatio),
          freeCashflow:        wrap(q.freeCashflow),
          targetMeanPrice:     wrap(q.targetMeanPrice),
          targetHighPrice:     wrap(q.targetHighPrice),
          targetLowPrice:      wrap(q.targetLowPrice),
          numberOfAnalystOpinions: wrap(q.numberOfAnalystOpinions),
          recommendationMean:  wrap(q.recommendationMean),
          recommendationKey:   q.recommendationKey ?? null,
        },
        summaryDetail: {
          trailingPE:        wrap(q.trailingPE),
          forwardPE:         wrap(q.forwardPE),
          dividendYield:     wrap(q.dividendYield),
          marketCap:         wrap(q.marketCap),
          fiftyTwoWeekHigh:  wrap(q.fiftyTwoWeekHigh),
          fiftyTwoWeekLow:   wrap(q.fiftyTwoWeekLow),
          trailingAnnualDividendRate: wrap(q.trailingAnnualDividendRate),
        },
        assetProfile: null,
        incomeStatementHistory: [],
        cashflowStatementHistory: [],
        earningsHistory: [],
        calendarEvents: null,
        upgradeDowngradeHistory: [],
        topHoldings: null,
      };
    } catch { continue; }
  }
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const cacheKey = `qs-${ticker}`;

  // 1. In-memory cache (fastest)
  const cached = fundamentalsCache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  // 2. SQLite persistence (survives process restarts, 7-day TTL)
  const dbRow = await readFromDb(ticker);
  if (dbRow) {
    fundamentalsCache.set(cacheKey, dbRow, DB_TTL_MS);
    return NextResponse.json(dbRow);
  }

  const baseHeaders: Record<string, string> = {
    "User-Agent": UA,
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.9",
  };

  try {
    // Strategy 1: v10 without crumb
    let res = await fetch(
      `${BASE_V10}/${encodeURIComponent(ticker)}?modules=${MODULES}`,
      { headers: baseHeaders }
    );

    // Strategy 2: v11 with crumb on auth errors
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      const auth = await acquireCrumb(ticker);
      const qs = `?modules=${MODULES}${auth ? `&crumb=${encodeURIComponent(auth.crumb)}` : ""}`;
      const headers = { ...baseHeaders };
      if (auth?.cookie) headers["Cookie"] = auth.cookie;
      res = await fetch(`${BASE_V11}/${encodeURIComponent(ticker)}${qs}`, { headers });
    }

    // Strategy 3: v7 quote fallback on 429 (rate limited) — no crumb needed
    if (res.status === 429) {
      const v7data = await fetchV7Quote(ticker);
      if (v7data) {
        fundamentalsCache.set(cacheKey, v7data, 6 * 3_600_000);
        void writeToDb(ticker, v7data);
        return NextResponse.json(v7data);
      }
      // v7 also failing — wait 2s and retry v10 once
      await new Promise(r => setTimeout(r, 2000));
      res = await fetch(
        `${BASE_V10}/${encodeURIComponent(ticker)}?modules=${MODULES}`,
        { headers: baseHeaders }
      );
    }

    if (!res.ok) {
      const v7data = await fetchV7Quote(ticker);
      if (v7data) {
        fundamentalsCache.set(cacheKey, v7data, 6 * 3_600_000);
        void writeToDb(ticker, v7data);
        return NextResponse.json(v7data);
      }
      return NextResponse.json({ error: `Yahoo returned ${res.status}`, ticker }, { status: 502 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as any;
    const result = json?.quoteSummary?.result?.[0];
    if (!result) {
      const v7data = await fetchV7Quote(ticker);
      if (v7data) {
        fundamentalsCache.set(cacheKey, v7data, 6 * 3_600_000);
        void writeToDb(ticker, v7data);
        return NextResponse.json(v7data);
      }
      return NextResponse.json({ error: "No data", ticker }, { status: 404 });
    }

    const data = {
      ticker,
      source: "quoteSummary",
      assetProfile: result.assetProfile ?? null,
      defaultKeyStatistics: result.defaultKeyStatistics ?? null,
      financialData: result.financialData ?? null,
      summaryDetail: result.summaryDetail ?? null,
      incomeStatementHistory: result.incomeStatementHistory?.incomeStatementHistory ?? [],
      cashflowStatementHistory: result.cashflowStatementHistory?.cashflowStatementHistory ?? [],
      earningsHistory: result.earningsHistory?.history ?? [],
      calendarEvents: result.calendarEvents ?? null,
      upgradeDowngradeHistory: result.upgradeDowngradeHistory?.history?.slice(0, 10) ?? [],
      topHoldings: result.topHoldings ?? null,
    };

    fundamentalsCache.set(cacheKey, data, DB_TTL_MS);
    void writeToDb(ticker, data);
    return NextResponse.json(data);
  } catch (err) {
    console.error(`QuoteSummary fetch error for ${ticker}:`, err);
    const v7data = await fetchV7Quote(ticker);
    if (v7data) {
      fundamentalsCache.set(cacheKey, v7data, 6 * 3_600_000);
      void writeToDb(ticker, v7data);
      return NextResponse.json(v7data);
    }
    return NextResponse.json({ error: "Failed to fetch", ticker }, { status: 500 });
  }
}
