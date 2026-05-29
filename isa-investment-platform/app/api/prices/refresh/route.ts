/**
 * GET /api/prices/refresh
 * Incremental refresh — fetches only bars since the last stored date per ticker.
 * Designed to run once per day (cron or manual trigger). ~11 tiny Yahoo requests total.
 */
import { NextResponse } from 'next/server';
import { refreshAll, storeSummary } from '@/lib/priceHistory';


export async function GET() {
  try {
    const results = await refreshAll();
    const summary = await storeSummary();
    const totalAdded = Object.values(results).reduce((s, n) => s + Math.max(n, 0), 0);
    return NextResponse.json({ ok: true, totalAdded, results, summary });
  } catch (err) {
    console.error('[prices/refresh]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
