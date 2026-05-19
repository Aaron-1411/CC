/**
 * Benchmark and advanced analytics calculations
 */
import { mean, std } from "mathjs";
import { calcBeta, calcInformationRatio, calcSortino, calcVolatility } from "./risk";

const TRADING_DAYS = 252;
const SQRT_252 = Math.sqrt(TRADING_DAYS);

// ─── DrawdownPeriod ──────────────────────────────────────────────────────────

export interface DrawdownPeriod {
  rank: number;
  startDate: string;
  troughDate: string;
  endDate: string | null; // null = still in drawdown
  depth: number;           // e.g. -0.15
  durationDays: number;    // peak to trough
  recoveryDays: number | null;
  isActive: boolean;
}

/**
 * Identify top-N drawdown periods, sorted by depth (worst first).
 */
export function calcTopDrawdowns(
  dailyValues: { date: Date; value: number }[],
  topN = 5
): DrawdownPeriod[] {
  if (dailyValues.length < 2) return [];

  const sorted = [...dailyValues].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Find all distinct drawdown periods
  interface RawDD {
    startDate: Date;
    troughDate: Date;
    endDate: Date | null;
    depth: number;
    peakValue: number;
  }

  const periods: RawDD[] = [];
  let peak = sorted[0].value;
  let peakDate = sorted[0].date;
  let inDrawdown = false;
  let troughValue = sorted[0].value;
  let troughDate = sorted[0].date;

  for (let i = 1; i < sorted.length; i++) {
    const pt = sorted[i];

    if (pt.value > peak) {
      // Recovered
      if (inDrawdown) {
        periods.push({
          startDate: peakDate,
          troughDate,
          endDate: pt.date,
          depth: (troughValue - peak) / peak,
          peakValue: peak,
        });
        inDrawdown = false;
      }
      peak = pt.value;
      peakDate = pt.date;
      troughValue = pt.value;
      troughDate = pt.date;
    } else {
      if (pt.value < troughValue) {
        if (!inDrawdown) inDrawdown = true;
        troughValue = pt.value;
        troughDate = pt.date;
      }
    }
  }

  // Close any open drawdown
  if (inDrawdown) {
    periods.push({
      startDate: peakDate,
      troughDate,
      endDate: null,
      depth: (troughValue - peak) / peak,
      peakValue: peak,
    });
  }

  // Filter meaningful drawdowns (>0.1%)
  const filtered = periods.filter((p) => p.depth < -0.001);

  // Sort by depth ascending (worst first)
  filtered.sort((a, b) => a.depth - b.depth);

  return filtered.slice(0, topN).map((p, i) => {
    const durationDays = Math.round(
      (p.troughDate.getTime() - p.startDate.getTime()) / 86_400_000
    );
    const recoveryDays =
      p.endDate !== null
        ? Math.round((p.endDate.getTime() - p.troughDate.getTime()) / 86_400_000)
        : null;
    return {
      rank: i + 1,
      startDate: p.startDate.toISOString().slice(0, 10),
      troughDate: p.troughDate.toISOString().slice(0, 10),
      endDate: p.endDate ? p.endDate.toISOString().slice(0, 10) : null,
      depth: p.depth,
      durationDays,
      recoveryDays,
      isActive: p.endDate === null,
    };
  });
}

// ─── Ulcer Index ─────────────────────────────────────────────────────────────

/**
 * Ulcer Index = sqrt(mean of squared percentage drawdowns over window).
 * drawdownPcts should be negative or zero values (e.g. -0.05 for 5% below HWM).
 */
export function calcUlcerIndex(drawdownPcts: number[]): number {
  if (drawdownPcts.length === 0) return 0;
  const squaredSum = drawdownPcts.reduce((s, d) => s + d * d, 0);
  return Math.sqrt(squaredSum / drawdownPcts.length);
}

// ─── % Time Below HWM ────────────────────────────────────────────────────────

export function calcPctTimeBelowHWM(
  dailyValues: { date: Date; value: number }[]
): number {
  if (dailyValues.length === 0) return 0;
  const sorted = [...dailyValues].sort((a, b) => a.date.getTime() - b.date.getTime());
  let hwm = sorted[0].value;
  let belowCount = 0;
  for (const pt of sorted) {
    if (pt.value >= hwm) {
      hwm = pt.value;
    } else {
      belowCount++;
    }
  }
  return belowCount / sorted.length;
}

// ─── Day of Week Analysis ────────────────────────────────────────────────────

export interface DayStats {
  day: string;       // 'Mon'|'Tue'|...
  dayIndex: number;  // 1=Mon, 5=Fri
  avgReturn: number;
  medianReturn: number;
  winRate: number;   // fraction 0–1
  stdDev: number;
  n: number;
  returns: number[];
}

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function calcDayOfWeekPerformance(
  dailyValues: { date: Date; value: number }[]
): DayStats[] {
  if (dailyValues.length < 2) return [];
  const sorted = [...dailyValues].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Build daily returns
  const byDay: Map<number, number[]> = new Map();
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev.value === 0) continue;
    const ret = (curr.value - prev.value) / prev.value;
    // dayIndex: getDay() returns 0=Sun,1=Mon,...,6=Sat → remap to 1=Mon..5=Fri
    const raw = curr.date.getDay(); // 0=Sun..6=Sat
    if (raw === 0 || raw === 6) continue; // skip weekends
    const dayIndex = raw; // 1=Mon..5=Fri
    if (!byDay.has(dayIndex)) byDay.set(dayIndex, []);
    byDay.get(dayIndex)!.push(ret);
  }

  const result: DayStats[] = [];
  for (let d = 1; d <= 5; d++) {
    const returns = byDay.get(d) ?? [];
    const n = returns.length;
    const avgReturn = n > 0 ? (mean(returns) as number) : 0;
    const medianReturn = median(returns);
    const winRate = n > 0 ? returns.filter((r) => r > 0).length / n : 0;
    const stdDev = n > 1 ? (std(returns, "uncorrected") as number) : 0;
    result.push({ day: DAY_NAMES[d], dayIndex: d, avgReturn, medianReturn, winRate, stdDev, n, returns });
  }
  return result;
}

// ─── Month of Year Analysis ──────────────────────────────────────────────────

export interface MonthStats {
  month: string;     // 'Jan'|...|'Dec'
  monthIndex: number; // 0=Jan
  avgReturn: number;
  medianReturn: number;
  winRate: number;
  stdDev: number;
  n: number;
  returns: number[];
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function calcMonthOfYearPerformance(
  dailyValues: { date: Date; value: number }[]
): MonthStats[] {
  if (dailyValues.length < 2) return [];
  const sorted = [...dailyValues].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Compute monthly returns: first value of month to last value of month
  const monthMap = new Map<string, { first: number; last: number; monthIndex: number }>();

  for (const pt of sorted) {
    const key = `${pt.date.getFullYear()}-${pt.date.getMonth()}`;
    const existing = monthMap.get(key);
    if (!existing) {
      monthMap.set(key, { first: pt.value, last: pt.value, monthIndex: pt.date.getMonth() });
    } else {
      monthMap.set(key, { ...existing, last: pt.value });
    }
  }

  const byMonth: Map<number, number[]> = new Map();
  for (let m = 0; m < 12; m++) byMonth.set(m, []);

  const keys = Array.from(monthMap.keys()).sort();
  for (const key of keys) {
    const entry = monthMap.get(key)!;
    if (entry.first === 0) continue;
    const ret = (entry.last - entry.first) / entry.first;
    byMonth.get(entry.monthIndex)!.push(ret);
  }

  return Array.from({ length: 12 }, (_, m) => {
    const returns = byMonth.get(m) ?? [];
    const n = returns.length;
    const avgReturn = n > 0 ? (mean(returns) as number) : 0;
    const medianReturn = median(returns);
    const winRate = n > 0 ? returns.filter((r) => r > 0).length / n : 0;
    const stdDev = n > 1 ? (std(returns, "uncorrected") as number) : 0;
    return { month: MONTH_NAMES[m], monthIndex: m, avgReturn, medianReturn, winRate, stdDev, n, returns };
  });
}

// ─── Rolling Series ──────────────────────────────────────────────────────────

export interface RollingPoint {
  date: string;  // ISO date YYYY-MM-DD
  value: number | null;
}

export function calcRollingSeries(
  dailyValues: { date: Date; value: number }[],
  windowDays: number,
  metric: 'sharpe' | 'volatility' | 'sortino',
  riskFreeAnnual: number
): RollingPoint[] {
  if (dailyValues.length < 2) return [];
  const sorted = [...dailyValues].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Build daily returns array aligned with sorted
  const dates: Date[] = [sorted[0].date];
  const dailyReturns: (number | null)[] = [null]; // no return for first point

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].value;
    const curr = sorted[i].value;
    dates.push(sorted[i].date);
    dailyReturns.push(prev > 0 ? (curr - prev) / prev : null);
  }

  const minWindow = Math.ceil(windowDays / 2);
  const result: RollingPoint[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const dateStr = sorted[i].date.toISOString().slice(0, 10);

    // Collect returns in window ending at i (i is the value, i-1 is the return for position i)
    const windowReturns: number[] = [];
    for (let j = Math.max(1, i - windowDays + 1); j <= i; j++) {
      const r = dailyReturns[j];
      if (r !== null) windowReturns.push(r);
    }

    if (windowReturns.length < minWindow) {
      result.push({ date: dateStr, value: null });
      continue;
    }

    let value: number;
    if (metric === 'volatility') {
      value = calcVolatility(windowReturns, windowReturns.length);
    } else if (metric === 'sharpe') {
      const annReturn = (mean(windowReturns) as number) * TRADING_DAYS;
      const vol = calcVolatility(windowReturns, windowReturns.length);
      value = vol > 0 ? (annReturn - riskFreeAnnual) / vol : 0;
    } else {
      // sortino
      value = calcSortino(windowReturns, riskFreeAnnual);
    }

    result.push({ date: dateStr, value: isFinite(value) ? value : null });
  }

  return result;
}

// ─── Full Benchmark Comparison ───────────────────────────────────────────────

export interface BenchmarkComparison {
  beta: number;
  alpha: number;           // annualised decimal
  rSquared: number;
  trackingError: number;   // annualised
  informationRatio: number;
  treynorRatio: number;
  upsideCapture: number;   // e.g. 1.05 = 105%
  downsideCapture: number;
  correlationCoeff: number;
  isTotalReturn: boolean;
}

export function calcBenchmarkComparison(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  riskFreeAnnual: number,
  annualisedPortfolioReturn: number
): BenchmarkComparison {
  const len = Math.min(portfolioReturns.length, benchmarkReturns.length);

  if (len < 2) {
    return {
      beta: 1,
      alpha: 0,
      rSquared: 0,
      trackingError: 0,
      informationRatio: 0,
      treynorRatio: 0,
      upsideCapture: 1,
      downsideCapture: 1,
      correlationCoeff: 0,
      isTotalReturn: false,
    };
  }

  const p = portfolioReturns.slice(-len);
  const b = benchmarkReturns.slice(-len);

  const { beta, alpha, rSquared } = calcBeta(p, b);
  const { ir: informationRatio, trackingError } = calcInformationRatio(p, b);

  // Treynor Ratio
  const treynorRatio = beta !== 0 ? (annualisedPortfolioReturn - riskFreeAnnual) / beta : 0;

  // Upside / downside capture
  const upDays = b.map((bRet, i) => ({ bRet, pRet: p[i] })).filter((x) => x.bRet > 0);
  const downDays = b.map((bRet, i) => ({ bRet, pRet: p[i] })).filter((x) => x.bRet < 0);

  const upsideCapture =
    upDays.length > 0
      ? (mean(upDays.map((x) => x.pRet)) as number) /
        (mean(upDays.map((x) => x.bRet)) as number)
      : 1;
  const downsideCapture =
    downDays.length > 0
      ? (mean(downDays.map((x) => x.pRet)) as number) /
        (mean(downDays.map((x) => x.bRet)) as number)
      : 1;

  // Pearson correlation
  const pMean = mean(p) as number;
  const bMean = mean(b) as number;
  let cov = 0;
  let varP = 0;
  let varB = 0;
  for (let i = 0; i < len; i++) {
    cov += (p[i] - pMean) * (b[i] - bMean);
    varP += (p[i] - pMean) ** 2;
    varB += (b[i] - bMean) ** 2;
  }
  const correlationCoeff = varP > 0 && varB > 0 ? cov / Math.sqrt(varP * varB) : 0;

  return {
    beta,
    alpha,
    rSquared,
    trackingError,
    informationRatio,
    treynorRatio,
    upsideCapture: isFinite(upsideCapture) ? upsideCapture : 1,
    downsideCapture: isFinite(downsideCapture) ? downsideCapture : 1,
    correlationCoeff,
    isTotalReturn: false,
  };
}
