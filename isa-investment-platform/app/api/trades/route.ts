import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const TradeSchema = z.object({
  ticker: z.string().min(1),
  type: z.enum(["BUY", "SELL", "DIVIDEND", "SPLIT"]),
  date: z.string().datetime(),
  units: z.number().positive(),
  priceGBP: z.number().positive(),
  fees: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");

  try {
    const trades = await prisma.trade.findMany({
      where: ticker ? { holding: { ticker } } : undefined,
      include: { holding: { select: { ticker: true, name: true } } },
      orderBy: { date: "desc" },
      take: 100,
    });

    return NextResponse.json({
      trades: trades.map((t) => ({
        id: t.id,
        holdingId: t.holdingId,
        ticker: t.holding.ticker,
        holdingName: t.holding.name,
        type: t.type,
        date: t.date.toISOString(),
        units: t.units,
        priceGBP: t.priceGBP,
        totalGBP: t.totalGBP,
        fees: t.fees,
        notes: t.notes,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Trade fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = TradeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { ticker, type, date, units, priceGBP, fees, notes } = parsed.data;

    const holding = await prisma.holding.findUnique({ where: { ticker } });
    if (!holding) {
      return NextResponse.json(
        { error: `Holding not found: ${ticker}` },
        { status: 404 }
      );
    }

    const totalGBP = type === "BUY"
      ? units * priceGBP + fees
      : units * priceGBP - fees;

    const trade = await prisma.trade.create({
      data: {
        holdingId: holding.id,
        type,
        date: new Date(date),
        units,
        priceGBP,
        totalGBP,
        fees,
        notes,
      },
      include: { holding: { select: { ticker: true, name: true } } },
    });

    // Update holding units
    if (type === "BUY") {
      const currentUnits = holding.units ?? 0;
      const currentAvgCost = holding.avgCostGBP ?? priceGBP;
      const newUnits = currentUnits + units;
      const newAvgCost =
        (currentUnits * currentAvgCost + units * priceGBP) / newUnits;
      await prisma.holding.update({
        where: { id: holding.id },
        data: { units: newUnits, avgCostGBP: newAvgCost },
      });
    } else if (type === "SELL") {
      const currentUnits = holding.units ?? 0;
      await prisma.holding.update({
        where: { id: holding.id },
        data: { units: Math.max(0, currentUnits - units) },
      });
    }

    return NextResponse.json({
      trade: {
        id: trade.id,
        ticker: trade.holding.ticker,
        type: trade.type,
        date: trade.date.toISOString(),
        units: trade.units,
        priceGBP: trade.priceGBP,
        totalGBP: trade.totalGBP,
        fees: trade.fees,
        notes: trade.notes,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("Trade creation error:", err);
    return NextResponse.json(
      { error: "Failed to create trade" },
      { status: 500 }
    );
  }
}
