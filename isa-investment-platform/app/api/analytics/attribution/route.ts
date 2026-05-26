import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcBHBAttribution } from "@/lib/analytics/attribution";
import { HOLDING_COLORS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get last two snapshots for attribution
    const snapshots = await prisma.dailySnapshot.findMany({
      orderBy: { date: "desc" },
      take: 2,
      include: {
        positions: {
          include: { holding: true },
        },
      },
    });

    if (snapshots.length < 1) {
      return NextResponse.json({ attribution: null, message: "No data" });
    }

    const latest = snapshots[0];

    // For each holding: use current weights and daily returns
    const inputs = latest.positions.map((pos) => ({
      ticker: pos.holding.ticker,
      name: pos.holding.name,
      color: HOLDING_COLORS[pos.holding.ticker] ?? "#8896b0",
      portfolioWeight: pos.weight,
      benchmarkWeight: 0, // ISA portfolio has no formal benchmark allocation
      portfolioReturn: pos.dailyReturnPct / 100,
      benchmarkSectorReturn: 0,
      benchmarkTotalReturn: 0,
    }));

    const attribution = calcBHBAttribution(inputs);

    return NextResponse.json({
      attribution: {
        ...attribution,
        items: attribution.items.map((item) => ({
          ...item,
        })),
      },
      date: latest.date.toISOString(),
    });
  } catch (err) {
    console.error("Attribution error:", err);
    return NextResponse.json(
      { error: "Failed to compute attribution" },
      { status: 500 }
    );
  }
}
