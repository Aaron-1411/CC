/**
 * GET /api/bootstrap
 * Seeds PriceHistory for all holdings + macro indicators. Safe to call multiple times — skips existing bars.
 * First run takes ~30–60s (17 × 10y fetches). Subsequent runs are instant (nothing new).
 * GET /api/bootstrap?ticker=NVDA  — refresh a single ticker only.
 * GET /api/bootstrap?ticker=^VIX  — also works for macro tickers.
 */
import { NextResponse } from 'next/server';
import { refreshTicker, refreshAll, storeSummary } from '@/lib/priceHistory';
import { HOLDINGS_DEFINITION } from '@/lib/constants';

export const maxDuration = 120; // 2 min timeout for full bootstrap

const MACRO_TICKERS: Record<string, string> = {
  "^VIX":     "^VIX",
  "^TNX":     "^TNX",
  "^IRX":     "^IRX",
  "GBPUSD=X": "GBPUSD=X",
  "^GSPC":    "^GSPC",
  "^FTSE":    "^FTSE",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker');

  try {
    if (ticker) {
      // Check holdings first
      const h = HOLDINGS_DEFINITION.find(x => x.ticker === ticker);
      if (h) {
        const added = await refreshTicker(h.ticker, h.yfSymbol);
        const summary = await storeSummary();
        return NextResponse.json({ ok: true, ticker, added, summary: summary[ticker] });
      }
      // Check macro tickers
      const yfSymbol = MACRO_TICKERS[ticker];
      if (yfSymbol) {
        const added = await refreshTicker(ticker, yfSymbol);
        const summary = await storeSummary();
        return NextResponse.json({ ok: true, ticker, added, summary: summary[ticker] });
      }
      return NextResponse.json({ error: `Unknown ticker: ${ticker}` }, { status: 404 });
    }

    const results = await refreshAll();
    const summary = await storeSummary();
    const totalAdded = Object.values(results).reduce((s, n) => s + Math.max(n, 0), 0);
    return NextResponse.json({ ok: true, totalAdded, results, summary });
  } catch (err) {
    console.error('[bootstrap]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
