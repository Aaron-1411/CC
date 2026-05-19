import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  calcRollingPerformance,
  calcMonthlyReturnCalendar,
} from "@/lib/analytics/returns";
import { syntheticPortfolioHistory, calcPeriodsFromHistory } from "@/lib/portfolioHistory";
import { BASELINE_SNAPSHOT } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshots = await prisma.dailySnapshot.findMany({
      orderBy: { date: "asc" },
      select: { date: true, totalValueGBP: true },
    });

    // Enough real snapshots — use them
    if (snapshots.length >= 10) {
      const dailySnapshots = snapshots.map((s) => ({
        date: s.date,
        valueGBP: s.totalValueGBP,
      }));
      const rollingPerformance = calcRollingPerformance(dailySnapshots);
      const monthlyCalendarRaw = calcMonthlyReturnCalendar(dailySnapshots);
      const monthlyCalendar = monthlyCalendarRaw.map(row => ({
        year: row.year,
        months: row.months.map(m => m != null ? +(m * 100).toFixed(2) : null),
        annual: row.annual != null ? +(row.annual * 100).toFixed(2) : null,
      }));
      return NextResponse.json({
        rollingPerformance: rollingPerformance.map((r) => ({
          ...r,
          startDate: r.startDate.toISOString(),
        })),
        monthlyCalendar,
        source: "snapshots",
      });
    }

    // Fall back to synthetic history from PriceHistory bars
    const history = await syntheticPortfolioHistory(9999);
    if (history.length < 2) {
      return NextResponse.json({ rollingPerformance: [], monthlyCalendar: [], message: "Insufficient data" });
    }

    const rollingPerformance = calcPeriodsFromHistory(history, BASELINE_SNAPSHOT.totalCostGBP);

    // Monthly calendar from synthetic history
    const monthlyCalendar = buildMonthlyCalendar(history);

    return NextResponse.json({
      rollingPerformance,
      monthlyCalendar,
      source: "priceHistory",
    });
  } catch (err) {
    console.error("Returns analytics error:", err);
    return NextResponse.json({ error: "Failed to compute returns" }, { status: 500 });
  }
}

function buildMonthlyCalendar(points: { date: string; valueGBP: number }[]): { year: number; months: (number | null)[]; annual: number | null }[] {
  if (points.length < 2) return [];
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));

  // Group by YYYY-MM, track first/last value
  const monthMap = new Map<string, { first: number; last: number }>();
  for (const p of sorted) {
    const key = p.date.slice(0, 7);
    if (!monthMap.has(key)) monthMap.set(key, { first: p.valueGBP, last: p.valueGBP });
    else monthMap.get(key)!.last = p.valueGBP;
  }

  // Build year × month grid with chained month returns (percentages)
  const yearMap = new Map<number, (number | null)[]>();
  const keys = Array.from(monthMap.keys()).sort();
  let prevEnd: number | null = null;

  for (const key of keys) {
    const [y, m] = key.split('-').map(Number);
    if (!yearMap.has(y)) yearMap.set(y, new Array(12).fill(null));
    const { first, last } = monthMap.get(key)!;
    const start = prevEnd ?? first;
    const ret = start > 0 ? (last - start) / start * 100 : null;
    yearMap.get(y)![m - 1] = ret;
    prevEnd = last;
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, months]) => {
      const valid = months.filter((m): m is number => m !== null);
      const annual = valid.length > 0
        ? (valid.reduce((prod, r) => prod * (1 + r / 100), 1) - 1) * 100
        : null;
      return { year, months, annual };
    });
}
