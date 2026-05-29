import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchBatchQuotes, ALL_YF_SYMBOLS, TICKER_TO_YF } from "@/lib/data/yahoo";
import { fetchFXRates } from "@/lib/data/fx";
import { HOLDINGS_DEFINITION } from "@/lib/constants";


export async function POST() {
  try {
    const [quotes, fxRates] = await Promise.all([
      fetchBatchQuotes(ALL_YF_SYMBOLS),
      fetchFXRates("GBP"),
    ]);

    const gbpUsdQuote = quotes["GBPUSD=X"];
    const gbpUsd = gbpUsdQuote?.price ?? fxRates.rates.USD ?? 1.27;

    // Get holdings from DB
    const holdings = await prisma.holding.findMany();

    // Calculate portfolio value
    let totalValueGBP = 0;
    const positionData: {
      holdingId: number;
      valueGBP: number;
      units: number | null;
      priceGBP: number;
      dailyReturnPct: number;
      weight: number;
    }[] = [];

    for (const holding of holdings) {
      const yfSym = TICKER_TO_YF[holding.ticker] ?? holding.yfSymbol;
      const quote = quotes[yfSym];
      if (!quote) continue;

      const valueGBP = holding.units
        ? holding.units * quote.priceGBP
        : quote.priceGBP; // fallback: just track price if no units

      totalValueGBP += valueGBP;
      positionData.push({
        holdingId: holding.id,
        valueGBP,
        units: holding.units,
        priceGBP: quote.priceGBP,
        dailyReturnPct: quote.changePercent,
        weight: 0, // will be calculated after
      });
    }

    // Calculate weights
    for (const pos of positionData) {
      pos.weight = totalValueGBP > 0 ? pos.valueGBP / totalValueGBP : 0;
    }

    // Check if snapshot already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.dailySnapshot.findFirst({
      where: { date: { gte: today } },
    });

    if (existing) {
      return NextResponse.json({
        message: "Snapshot already exists for today",
        snapshotId: existing.id,
      });
    }

    // Create snapshot
    const snapshot = await prisma.dailySnapshot.create({
      data: {
        date: new Date(),
        totalValueGBP,
        gbpUsd,
        positions: {
          create: positionData,
        },
      },
    });

    // Update ISA allowance
    const isaAllowance = await prisma.isaAllowance.findFirst({
      orderBy: { taxYear: "desc" },
    });

    if (isaAllowance) {
      await prisma.isaAllowance.update({
        where: { id: isaAllowance.id },
        data: { usedGBP: totalValueGBP },
      });
    }

    return NextResponse.json({
      message: "Snapshot created",
      snapshotId: snapshot.id,
      totalValueGBP,
      gbpUsd,
      positionCount: positionData.length,
    });
  } catch (err) {
    console.error("Snapshot creation error:", err);
    return NextResponse.json(
      { error: "Failed to create snapshot", detail: String(err) },
      { status: 500 }
    );
  }
}

// Also support GET for cron compatibility
export async function GET() {
  return POST();
}
