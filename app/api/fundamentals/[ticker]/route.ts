import { NextResponse } from "next/server";
import {
  fetchFullFundamentals,
  fetchAnalystRatings,
  fetchPriceTargets,
  fetchIncomeStatement,
} from "@/lib/data/fmp";
import { fundamentalsCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const cacheKey = `fundamentals-${ticker}`;

  const cached = fundamentalsCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const [fundamentals, analystRatings, priceTargets, incomeStatement] =
      await Promise.allSettled([
        fetchFullFundamentals(ticker),
        fetchAnalystRatings(ticker),
        fetchPriceTargets(ticker),
        fetchIncomeStatement(ticker),
      ]);

    const result = {
      ticker,
      fundamentals: fundamentals.status === "fulfilled" ? fundamentals.value : null,
      analystRatings: analystRatings.status === "fulfilled" ? analystRatings.value : [],
      priceTargets: priceTargets.status === "fulfilled" ? priceTargets.value : [],
      incomeStatement: incomeStatement.status === "fulfilled" ? incomeStatement.value : [],
    };

    fundamentalsCache.set(cacheKey, result, 3_600_000); // 1 hour TTL

    return NextResponse.json(result);
  } catch (err) {
    console.error(`Fundamentals fetch error for ${ticker}:`, err);
    return NextResponse.json(
      { error: "Failed to fetch fundamentals", ticker },
      { status: 500 }
    );
  }
}
