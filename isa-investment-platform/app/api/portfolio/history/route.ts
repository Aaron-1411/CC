import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syntheticPortfolioHistory } from "@/lib/portfolioHistory";

export const dynamic = "force-dynamic";

const RANGE_DAYS: Record<string, number> = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  YTD: 365,
  All: 9999,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "All";
  const days = RANGE_DAYS[range] ?? 9999;

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Prefer real DailySnapshot records if they exist
  const snapshots = await prisma.dailySnapshot.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "asc" },
    select: { date: true, totalValueGBP: true },
  });

  if (snapshots.length >= 5) {
    return NextResponse.json(
      snapshots.map((s) => ({
        date: s.date.toISOString().slice(0, 10),
        valueGBP: s.totalValueGBP,
      }))
    );
  }

  // Fall back to price-history-derived series
  const points = await syntheticPortfolioHistory(days);
  return NextResponse.json(points);
}
