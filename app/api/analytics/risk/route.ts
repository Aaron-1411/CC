import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  calcVolatility, calcSharpe, calcSortino,
  calcHistoricalVaR, calcParametricVaR, calcDrawdowns, calcCalmar,
} from "@/lib/analytics/risk";
import { calcUlcerIndex, calcPctTimeBelowHWM, calcTopDrawdowns } from "@/lib/analytics/benchmark";
import { HOLDINGS_DEFINITION, BASELINE_SNAPSHOT } from "@/lib/constants";

export const dynamic = "force-dynamic";

const RISK_FREE_RATE = 0.04;
const RISK_FREE_RATE_LABEL = "UK base rate (hardcoded 4.0% p.a.)";
const LOOKBACK_DAYS = 252;

/**
 * Build a synthetic portfolio daily-return series from PriceHistory.
 * Uses current portfolio weights (from latest DailySnapshot or BASELINE_SNAPSHOT fallback).
 * Returns null if insufficient data.
 */
async function portfolioReturnsFromPriceHistory(): Promise<{
  returns: number[];
  dailyValues: { date: string; value: number }[];
  currentValue: number;
  source: string;
} | null> {
  const tickers = HOLDINGS_DEFINITION.map(h => h.ticker);

  // Get stored price bars (last 2y for stability of rolling windows)
  const rows = await prisma.priceHistory.findMany({
    where: { ticker: { in: tickers } },
    orderBy: { date: "asc" },
    select: { ticker: true, date: true, adjClose: true },
  });

  if (!rows.length) return null;

  // Group by ticker
  const byTicker: Record<string, Map<string, number>> = {};
  for (const row of rows) {
    if (!byTicker[row.ticker]) byTicker[row.ticker] = new Map();
    byTicker[row.ticker].set(row.date, row.adjClose);
  }

  const availableTickers = Object.keys(byTicker);
  if (availableTickers.length < 3) return null;

  // Get current weights from BASELINE_SNAPSHOT (or latest DB snapshot if available)
  let weightMap: Record<string, number> = {};
  try {
    const latestSnap = await prisma.dailySnapshot.findFirst({
      orderBy: { date: "desc" },
      include: { positions: { include: { holding: true } } },
    });
    if (latestSnap?.positions.length) {
      const totalValue = latestSnap.totalValueGBP;
      for (const pos of latestSnap.positions) {
        weightMap[pos.holding.ticker] = pos.valueGBP / totalValue;
      }
    }
  } catch { /* ignore */ }

  if (!Object.keys(weightMap).length) {
    const totalValue = BASELINE_SNAPSHOT.totalValueGBP;
    for (const pos of BASELINE_SNAPSHOT.positions) {
      weightMap[pos.ticker] = pos.valueGBP / totalValue;
    }
  }

  // Collect all dates across all tickers, take last LOOKBACK_DAYS
  const allDatesSet = new Set<string>();
  for (const map of Object.values(byTicker)) map.forEach((_, d) => allDatesSet.add(d));
  const dates = [...allDatesSet].sort().slice(-LOOKBACK_DAYS);

  if (dates.length < 20) return null;

  // Compute per-ticker daily log returns aligned to common dates
  const tickerReturns: Record<string, number[]> = {};
  for (const ticker of availableTickers) {
    const priceMap = byTicker[ticker];
    const prices = dates.map(d => priceMap.get(d)).filter(v => v != null) as number[];
    if (prices.length < 20) continue;
    const rets: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      rets.push(prices[i] > 0 ? (prices[i] - prices[i - 1]) / prices[i - 1] : 0);
    }
    tickerReturns[ticker] = rets;
  }

  if (!Object.keys(tickerReturns).length) return null;

  // Compute portfolio returns as weighted sum of individual returns
  const nDays = Math.min(...Object.values(tickerReturns).map(r => r.length));
  const portfolioReturns: number[] = [];
  for (let i = 0; i < nDays; i++) {
    let dayReturn = 0;
    let totalWeight = 0;
    for (const [ticker, rets] of Object.entries(tickerReturns)) {
      const w = weightMap[ticker] ?? 0;
      dayReturn += w * rets[i];
      totalWeight += w;
    }
    portfolioReturns.push(totalWeight > 0 ? dayReturn / totalWeight : 0);
  }

  // Reconstruct portfolio value series (index-based, starting from current value)
  const currentValue = BASELINE_SNAPSHOT.totalValueGBP;
  let runningValue = currentValue;
  const reversed: number[] = [];
  for (let i = portfolioReturns.length - 1; i >= 0; i--) {
    reversed.push(runningValue);
    if (1 + portfolioReturns[i] !== 0) runningValue = runningValue / (1 + portfolioReturns[i]);
  }
  reversed.reverse();

  const usedDates = dates.slice(dates.length - nDays);
  const dailyValues = usedDates.map((d, i) => ({ date: d, value: reversed[i] }));

  return {
    returns: portfolioReturns,
    dailyValues,
    currentValue,
    source: "priceHistory",
  };
}

/** Fall back to DailySnapshot-based approach (original). */
async function portfolioReturnsFromSnapshots() {
  const snapshots = await prisma.dailySnapshot.findMany({
    orderBy: { date: "asc" },
    select: { date: true, totalValueGBP: true },
  });
  if (snapshots.length < 10) return null;

  const values = snapshots.map(s => s.totalValueGBP);
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) returns.push((values[i] - values[i - 1]) / values[i - 1]);
  }
  const dailyValues = snapshots.map(s => ({ date: s.date.toISOString().slice(0, 10), value: s.totalValueGBP }));
  return { returns, dailyValues, currentValue: values[values.length - 1], source: "snapshots" };
}

export async function GET() {
  try {
    const series = await portfolioReturnsFromPriceHistory() ?? await portfolioReturnsFromSnapshots();

    if (!series || series.returns.length < 10) {
      return NextResponse.json({
        metrics: null,
        message: "Insufficient data — run /api/bootstrap to seed price history",
      });
    }

    const { returns: dailyReturns, dailyValues, currentValue, source } = series;

    const vol30 = calcVolatility(dailyReturns, 30);
    const vol90 = calcVolatility(dailyReturns, 90);

    const firstValue = dailyValues[0].value;
    const nDays = dailyValues.length;
    const annualisedReturn = firstValue > 0 ? Math.pow(currentValue / firstValue, 365 / nDays) - 1 : 0;

    const sharpe30 = calcSharpe(annualisedReturn, RISK_FREE_RATE, vol30);
    const sortino30 = calcSortino(dailyReturns.slice(-30), RISK_FREE_RATE);

    const var95 = calcHistoricalVaR(dailyReturns, currentValue, 0.95);
    const var99 = calcHistoricalVaR(dailyReturns, currentValue, 0.99);
    const pVar95 = calcParametricVaR(dailyReturns, currentValue, 0.95);
    const pVar99 = calcParametricVaR(dailyReturns, currentValue, 0.99);

    const sqrt10 = Math.sqrt(10);
    const var10d_95 = { varPct: var95.varPct * sqrt10, varGBP: var95.varGBP * sqrt10 };
    const var10d_99 = { varPct: var99.varPct * sqrt10, varGBP: var99.varGBP * sqrt10 };
    const cvar10d_95 = { varPct: var95.cvarPct * sqrt10, varGBP: var95.cvarGBP * sqrt10 };

    // Convert dailyValues to Date objects for drawdown functions
    const datedValues = dailyValues.map(d => ({
      date: new Date(d.date + "T12:00:00Z"),
      value: d.value,
    }));

    const drawdowns = calcDrawdowns(datedValues);
    const calmar = calcCalmar(annualisedReturn, drawdowns.maxDrawdown);
    const drawdownPcts = drawdowns.drawdownSeries.map(d => d.drawdown);
    const ulcerIndex = calcUlcerIndex(drawdownPcts);
    const pctTimeBelowHWM = calcPctTimeBelowHWM(datedValues);
    const topDrawdowns = calcTopDrawdowns(datedValues, 5);

    const metrics = {
      volatility30d: vol30,
      volatility90d: vol90,
      sharpe30d: sharpe30,
      sortino30d: sortino30,
      annualisedReturn,
      maxDrawdown: drawdowns.maxDrawdown,
      maxDrawdownStart: drawdowns.maxDrawdownStart.toISOString(),
      maxDrawdownEnd: drawdowns.maxDrawdownEnd.toISOString(),
      currentDrawdown: drawdowns.currentDrawdown,
      currentPeak: drawdowns.currentPeak,
      var95_1d: var95.varGBP,
      var99_1d: var99.varGBP,
      cvar95_1d: var95.cvarGBP,
      cvar95pct: var95.cvarPct,
      var95pct: var95.varPct,
      var99pct: var99.varPct,
      drawdownSeries: drawdowns.drawdownSeries.map(d => ({
        date: d.date.toISOString().slice(0, 10),
        drawdown: d.drawdown,
      })),
      calmar,
      parametricVar95: { varPct: pVar95.varPct, varGBP: pVar95.varGBP },
      parametricVar99: { varPct: pVar99.varPct, varGBP: pVar99.varGBP },
      var10d_95,
      var10d_99,
      cvar10d_95,
      ulcerIndex,
      pctTimeBelowHWM,
      topDrawdowns,
      lookbackDays: nDays,
      source,
      returnType: "simple" as const,
      riskFreeRate: RISK_FREE_RATE,
      riskFreeRateLabel: RISK_FREE_RATE_LABEL,
    };

    return NextResponse.json({ metrics });
  } catch (err) {
    console.error("Risk analytics error:", err);
    return NextResponse.json({ error: "Failed to compute risk metrics" }, { status: 500 });
  }
}
