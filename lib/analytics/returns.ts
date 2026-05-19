/**
 * Portfolio return calculations
 */

export function calcTWR(dailyReturns: number[]): number {
  if (dailyReturns.length === 0) return 0;
  let product = 1;
  for (const r of dailyReturns) {
    product *= 1 + r;
  }
  return product - 1;
}

/**
 * Newton-Raphson XIRR solver
 * cashFlows: negative = outflow (investment), positive = inflow (proceeds)
 * finalValue: current portfolio value (treated as final inflow)
 */
export function calcXIRR(
  cashFlows: { date: Date; amount: number }[],
  finalValue: number
): number {
  if (cashFlows.length === 0) return 0;

  // Add terminal value as final inflow
  const allFlows = [
    ...cashFlows,
    { date: new Date(), amount: finalValue },
  ];

  const firstDate = allFlows[0].date.getTime();

  function npv(rate: number): number {
    return allFlows.reduce((sum, cf) => {
      const t = (cf.date.getTime() - firstDate) / (365.25 * 24 * 3600 * 1000);
      return sum + cf.amount / Math.pow(1 + rate, t);
    }, 0);
  }

  function dnpv(rate: number): number {
    return allFlows.reduce((sum, cf) => {
      const t = (cf.date.getTime() - firstDate) / (365.25 * 24 * 3600 * 1000);
      if (t === 0) return sum;
      return sum - (t * cf.amount) / Math.pow(1 + rate, t + 1);
    }, 0);
  }

  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    const f = npv(rate);
    const df = dnpv(rate);
    if (Math.abs(df) < 1e-12) break;
    const newRate = rate - f / df;
    if (Math.abs(newRate - rate) < 1e-8) {
      rate = newRate;
      break;
    }
    rate = newRate;
    if (rate < -0.999) rate = -0.999;
  }

  return isFinite(rate) ? rate : 0;
}

export function calcReturnContribution(
  holdings: { ticker: string; startWeight: number; periodReturn: number }[]
): { ticker: string; contribution: number; attributionPct: number }[] {
  const total = holdings.reduce(
    (sum, h) => sum + h.startWeight * h.periodReturn,
    0
  );

  return holdings.map((h) => {
    const contribution = h.startWeight * h.periodReturn;
    return {
      ticker: h.ticker,
      contribution,
      attributionPct: total !== 0 ? contribution / Math.abs(total) : 0,
    };
  });
}

export type RollingPeriod = "1D" | "5D" | "1M" | "3M" | "YTD" | "1Y" | "ITD";

export interface RollingPerformanceResult {
  period: string;
  portfolioReturn: number;
  benchmarkReturn: number | null;
  alpha: number | null;
  startDate: Date;
  startValue: number;
  endValue: number;
  absoluteGainGBP: number;
}

function daysBack(days: number, from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d;
}

function yearStart(from: Date): Date {
  return new Date(from.getFullYear(), 0, 1);
}

export function calcRollingPerformance(
  dailySnapshots: { date: Date; valueGBP: number }[],
  benchmarkReturns?: { date: Date; return: number }[]
): RollingPerformanceResult[] {
  if (dailySnapshots.length < 2) return [];

  const sorted = [...dailySnapshots].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const latest = sorted[sorted.length - 1];
  const latestDate = latest.date;
  const latestValue = latest.valueGBP;

  const periods: { label: string; startDate: Date }[] = [
    { label: "1D", startDate: daysBack(1, latestDate) },
    { label: "5D", startDate: daysBack(5, latestDate) },
    { label: "1M", startDate: daysBack(30, latestDate) },
    { label: "3M", startDate: daysBack(90, latestDate) },
    { label: "YTD", startDate: yearStart(latestDate) },
    { label: "1Y", startDate: daysBack(365, latestDate) },
    { label: "ITD", startDate: sorted[0].date },
  ];

  // Build benchmark cumulative returns map if provided
  const benchMap = new Map<string, number>();
  if (benchmarkReturns) {
    let cumulative = 1;
    for (const br of benchmarkReturns) {
      cumulative *= 1 + br.return;
      benchMap.set(br.date.toISOString().slice(0, 10), cumulative);
    }
  }

  return periods.map(({ label, startDate }) => {
    // Find closest snapshot at or after startDate
    const startSnap = sorted.find((s) => s.date >= startDate) ?? sorted[0];
    const portfolioReturn =
      startSnap.valueGBP > 0
        ? (latestValue - startSnap.valueGBP) / startSnap.valueGBP
        : 0;

    let benchmarkReturn: number | null = null;
    let alpha: number | null = null;

    if (benchmarkReturns && benchmarkReturns.length > 0) {
      // Calculate benchmark return over same period
      const benchSorted = [...benchmarkReturns].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
      const benchStart = benchSorted.find((b) => b.date >= startDate);
      if (benchStart) {
        const slicedReturns = benchSorted
          .filter((b) => b.date >= benchStart.date)
          .map((b) => b.return);
        benchmarkReturn = calcTWR(slicedReturns);
        alpha = portfolioReturn - benchmarkReturn;
      }
    }

    return {
      period: label,
      portfolioReturn,
      benchmarkReturn,
      alpha,
      startDate: startSnap.date,
      startValue: startSnap.valueGBP,
      endValue: latestValue,
      absoluteGainGBP: latestValue - startSnap.valueGBP,
    };
  });
}

export function calcMonthlyReturnCalendar(
  dailySnapshots: { date: Date; valueGBP: number }[]
): { year: number; months: (number | null)[]; annual: number | null }[] {
  if (dailySnapshots.length < 2) return [];

  const sorted = [...dailySnapshots].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Group into months: find first and last value in each month
  const monthMap = new Map<
    string,
    { first: number; last: number }
  >();

  for (const snap of sorted) {
    const key = `${snap.date.getFullYear()}-${String(snap.date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthMap.get(key);
    if (!existing) {
      monthMap.set(key, { first: snap.valueGBP, last: snap.valueGBP });
    } else {
      monthMap.set(key, { ...existing, last: snap.valueGBP });
    }
  }

  // Build year × month grid
  const yearMap = new Map<
    number,
    { months: (number | null)[]; prevYearEnd: number | null }
  >();

  const keys = Array.from(monthMap.keys()).sort();
  let prevMonthEnd: number | null = null;

  for (const key of keys) {
    const [yearStr, monthStr] = key.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed

    if (!yearMap.has(year)) {
      yearMap.set(year, { months: new Array(12).fill(null), prevYearEnd: null });
    }
    const yearData = yearMap.get(year)!;

    const monthData = monthMap.get(key)!;
    const startValue = prevMonthEnd ?? monthData.first;
    const ret = startValue > 0 ? (monthData.last - startValue) / startValue : null;
    yearData.months[month] = ret;
    prevMonthEnd = monthData.last;
  }

  const result: { year: number; months: (number | null)[]; annual: number | null }[] = [];

  for (const [year, data] of Array.from(yearMap.entries()).sort(([a], [b]) => a - b)) {
    const validMonths = data.months.filter((m): m is number => m !== null);
    const annual = validMonths.length > 0 ? calcTWR(validMonths) : null;
    result.push({ year, months: data.months, annual });
  }

  return result;
}
