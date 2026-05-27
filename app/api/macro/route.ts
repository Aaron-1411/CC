import { NextResponse } from "next/server";
import { macroCache } from "@/lib/cache";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE_V8 = "https://query1.finance.yahoo.com/v8/finance/chart";

interface MacroPoint { date: string; value: number }

/** Read VIX history from PriceHistory DB (seeded via bootstrap). */
async function vixFromDb(limitDays = 252): Promise<MacroPoint[]> {
  try {
    const rows = await prisma.priceHistory.findMany({
      where: { ticker: "^VIX" },
      orderBy: { date: "desc" },
      take: limitDays,
      select: { date: true, close: true },
    });
    return rows
      .reverse()
      .map(r => ({ date: r.date, value: Math.round(r.close * 100) / 100 }));
  } catch { return []; }
}

/** Read a single latest value+date from PriceHistory DB. */
async function latestFromDb(ticker: string): Promise<{ value: number; date: string } | null> {
  try {
    const row = await prisma.priceHistory.findFirst({
      where: { ticker },
      orderBy: { date: "desc" },
      select: { close: true, date: true },
    });
    return row ? { value: Math.round(row.close * 100) / 100, date: row.date } : null;
  } catch { return null; }
}

async function fetchYahooBars(symbol: string, range = "1y"): Promise<MacroPoint[]> {
  try {
    const url = `${BASE_V8}/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json", "Accept-Language": "en-US,en;q=0.9" },
    });
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as any;
    const result = json?.chart?.result?.[0];
    if (!result) return [];
    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
    const points: MacroPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const v = closes[i];
      if (v == null || isNaN(v)) continue;
      points.push({
        date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
        value: Math.round(v * 100) / 100,
      });
    }
    return points;
  } catch { return []; }
}

async function fetchYahooLatest(symbol: string): Promise<{ value: number; date: string } | null> {
  const bars = await fetchYahooBars(symbol, "5d");
  if (!bars.length) return null;
  const last = bars[bars.length - 1];
  return { value: last.value, date: last.date };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bust = searchParams.get("refresh") === "1";
  const cacheKey = "macro-snapshot";

  if (!bust) {
    const cached = macroCache.get(cacheKey);
    if (cached) return NextResponse.json(cached);
  }

  // --- VIX: DB first (fast, rate-limit-immune), Yahoo fallback ---
  const [dbVix, liveVix] = await Promise.allSettled([
    vixFromDb(252),
    fetchYahooBars("^VIX", "1y"),
  ]);
  const vix =
    (liveVix.status === "fulfilled" && liveVix.value.length > 50 ? liveVix.value : null) ??
    (dbVix.status === "fulfilled" ? dbVix.value : []);

  // --- Macro indicators: DB first, Yahoo fallback ---
  const [dbTnx, liveTnx] = await Promise.allSettled([latestFromDb("^TNX"), fetchYahooLatest("^TNX")]);
  const [dbIrx, liveIrx] = await Promise.allSettled([latestFromDb("^IRX"), fetchYahooLatest("^IRX")]);
  const [dbFx,  liveFx]  = await Promise.allSettled([latestFromDb("GBPUSD=X"), fetchYahooLatest("GBPUSD=X")]);

  const liveTnxVal  = liveTnx.status  === "fulfilled" ? liveTnx.value  : null;
  const liveIrxVal  = liveIrx.status  === "fulfilled" ? liveIrx.value  : null;
  const liveFxVal   = liveFx.status   === "fulfilled" ? liveFx.value   : null;
  const dbTnxVal    = dbTnx.status    === "fulfilled" ? dbTnx.value    : null;
  const dbIrxVal    = dbIrx.status    === "fulfilled" ? dbIrx.value    : null;
  const dbFxVal     = dbFx.status     === "fulfilled" ? dbFx.value     : null;

  const tnx  = liveTnxVal?.value ?? dbTnxVal?.value ?? null;
  const irx  = liveIrxVal?.value ?? dbIrxVal?.value ?? null;
  const fx   = liveFxVal?.value  ?? dbFxVal?.value  ?? null;

  const tnxDate  = liveTnxVal?.date ?? dbTnxVal?.date ?? "";
  const irxDate  = liveIrxVal?.date ?? dbIrxVal?.date ?? "";
  const fxDate   = liveFxVal?.date  ?? dbFxVal?.date  ?? "";

  const latestVix = vix.length ? vix[vix.length - 1].value : null;

  // Optional FRED enhancement
  let fredMacro: { series: string; name: string; value: number; date: string; unit: string; frequency: string }[] = [];
  if (process.env.FRED_API_KEY) {
    try {
      const { fetchMacroSnapshot } = await import("@/lib/data/fred");
      fredMacro = await fetchMacroSnapshot();
    } catch { /* optional */ }
  }

  const yahooMacro = [
    latestVix != null ? { series: "VIX",    name: "CBOE VIX",              value: latestVix, date: vix[vix.length - 1]?.date ?? "", unit: "index", frequency: "daily" } : null,
    tnx       != null ? { series: "TNX",    name: "US 10Y Treasury Yield",  value: tnx,       date: tnxDate,                          unit: "%",    frequency: "daily" } : null,
    irx       != null ? { series: "IRX",    name: "US 13W T-Bill Yield",    value: irx,       date: irxDate,                          unit: "%",    frequency: "daily" } : null,
    (tnx != null && irx != null) ? { series: "SPREAD", name: "10Y-3M Spread", value: Math.round((tnx - irx) * 100) / 100, date: tnxDate, unit: "%", frequency: "daily" } : null,
    fx        != null ? { series: "GBPUSD", name: "GBP/USD",                value: fx,        date: fxDate,                           unit: "rate", frequency: "daily" } : null,
  ].filter((m): m is NonNullable<typeof m> => m !== null);

  const fredSeriesIds = new Set(fredMacro.map((m) => m.series));
  const macro = [
    ...fredMacro,
    ...yahooMacro.filter((m) => !fredSeriesIds.has(m.series)),
  ];

  const result = {
    macro,
    vixHistory: vix,
    lastUpdated: new Date().toISOString(),
  };

  // Only cache if we actually got something useful
  if (vix.length > 0 || macro.length > 0) {
    macroCache.set(cacheKey, result, 3_600_000);
  }

  return NextResponse.json(result);
}
