import { NextResponse } from "next/server";
import { HOLDINGS_DEFINITION } from "@/lib/constants";
import { getHistory, barCount } from "@/lib/priceHistory";
import { fetchOHLCV, TICKER_TO_YF } from "@/lib/data/yahoo";

export const dynamic = "force-dynamic";

export interface SeasonalityBucket {
  label: string;
  mean: number;
  stdev: number;
  count: number;
  hitRate: number;
  best: number;
  worst: number;
}

export interface SeasonalityData {
  ticker: string;
  yfSymbol: string;
  firstDate: string;
  lastDate: string;
  totalBars: number;
  dow: SeasonalityBucket[];
  moy: SeasonalityBucket[];
  source: "db" | "yahoo";
}

function bucket(vals: number[], label: string): SeasonalityBucket {
  if (!vals.length) return { label, mean: 0, stdev: 0, count: 0, hitRate: 0, best: 0, worst: 0 };
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  return {
    label,
    mean: +mean.toFixed(4),
    stdev: +Math.sqrt(variance).toFixed(4),
    count: vals.length,
    hitRate: +(vals.filter(v => v > 0).length / vals.length).toFixed(4),
    best: +Math.max(...vals).toFixed(4),
    worst: +Math.min(...vals).toFixed(4),
  };
}

function utcDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function computeDoW(bars: { date: string; adjClose: number }[]): SeasonalityBucket[] {
  const groups: number[][] = [[], [], [], [], []];
  for (let i = 1; i < bars.length; i++) {
    const dow = utcDate(bars[i].date).getUTCDay();
    if (dow < 1 || dow > 5) continue;
    const ret = Math.log(bars[i].adjClose / bars[i - 1].adjClose) * 100;
    if (isFinite(ret)) groups[dow - 1].push(ret);
  }
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((l, i) => bucket(groups[i], l));
}

function computeMoY(bars: { date: string; adjClose: number }[]): SeasonalityBucket[] {
  const byYM: Record<string, number[]> = {};
  for (const bar of bars) {
    const d = utcDate(bar.date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()).padStart(2, '0')}`;
    (byYM[key] ??= []).push(bar.adjClose);
  }
  const groups: number[][] = Array.from({ length: 12 }, () => []);
  for (const [key, closes] of Object.entries(byYM)) {
    if (closes.length < 2) continue;
    const month = parseInt(key.split('-')[1]);
    const ret = Math.log(closes[closes.length - 1] / closes[0]) * 100;
    if (isFinite(ret)) groups[month].push(ret);
  }
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return labels.map((l, i) => bucket(groups[i], l));
}

function buildResult(
  ticker: string, yfSymbol: string,
  bars: { date: string; adjClose: number }[],
  source: "db" | "yahoo"
): SeasonalityData {
  return {
    ticker, yfSymbol,
    firstDate: bars[0].date,
    lastDate: bars[bars.length - 1].date,
    totalBars: bars.length,
    dow: computeDoW(bars),
    moy: computeMoY(bars),
    source,
  };
}

// In-process cache (24h) — DB reads are fast, but no need to recompute every request
const cache = new Map<string, { data: SeasonalityData; exp: number }>();

const HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

async function fetchYahooMaxHistory(yfSymbol: string): Promise<{ date: string; adjClose: number }[]> {
  for (const range of ["10y", "max"]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const host = HOSTS[attempt % 2];
      const url = `https://${host}/v8/finance/chart/${encodeURIComponent(yfSymbol)}?interval=1d&range=${range}&events=div,split`;
      const res = await fetch(url, { headers: YAHOO_HEADERS });
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      if (!res.ok) break;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = (await res.json()) as any;
      const result = json?.chart?.result?.[0];
      if (!result) break;
      const timestamps: number[] = result.timestamp ?? [];
      const closes: number[] = result.indicators?.adjclose?.[0]?.adjclose
        ?? result.indicators?.quote?.[0]?.close ?? [];
      return timestamps
        .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), adjClose: closes[i] }))
        .filter(b => b.adjClose != null && isFinite(b.adjClose) && b.adjClose > 0);
    }
  }
  return [];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  const hit = cache.get(ticker);
  if (hit && Date.now() < hit.exp) return NextResponse.json(hit.data);

  const h = HOLDINGS_DEFINITION.find(x => x.ticker === ticker);
  if (!h) return NextResponse.json({ error: "Unknown ticker" }, { status: 404 });

  const yfSymbol = h.yfSymbol ?? TICKER_TO_YF[ticker] ?? ticker;

  try {
    // Prefer DB — fast, no Yahoo call
    const stored = await barCount(ticker);
    if (stored >= 100) {
      const dbBars = await getHistory(ticker);
      if (dbBars.length >= 30) {
        const data = buildResult(ticker, yfSymbol, dbBars, "db");
        cache.set(ticker, { data, exp: Date.now() + 86_400_000 });
        return NextResponse.json(data);
      }
    }

    // Fall back to live Yahoo fetch (before bootstrap runs)
    const yahooBars = await fetchYahooMaxHistory(yfSymbol);
    if (yahooBars.length < 30) {
      return NextResponse.json({ error: "Insufficient history" }, { status: 422 });
    }
    const data = buildResult(ticker, yfSymbol, yahooBars, "yahoo");
    cache.set(ticker, { data, exp: Date.now() + 86_400_000 });
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Seasonality error for ${ticker}:`, err);
    return NextResponse.json({ error: "Failed to compute seasonality" }, { status: 500 });
  }
}
