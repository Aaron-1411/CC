/**
 * Portfolio risk calculations
 */
import { mean, std } from "mathjs";

const TRADING_DAYS = 252;
const SQRT_252 = Math.sqrt(TRADING_DAYS);

function dailyReturnsFromValues(values: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }
  }
  return returns;
}

/**
 * Annualised volatility from daily returns
 */
export function calcVolatility(
  dailyReturns: number[],
  windowDays: number = 30
): number {
  const window = dailyReturns.slice(-windowDays);
  if (window.length < 2) return 0;
  const s = std(window, "uncorrected") as number;
  return s * SQRT_252;
}

/**
 * Sharpe Ratio (annualised)
 */
export function calcSharpe(
  portfolioReturn: number,
  riskFreeRate: number,
  volatility: number
): number {
  if (volatility === 0) return 0;
  return (portfolioReturn - riskFreeRate) / volatility;
}

/**
 * Sortino Ratio (annualised, using downside deviation)
 */
export function calcSortino(
  dailyReturns: number[],
  riskFreeRate: number
): number {
  if (dailyReturns.length < 2) return 0;
  const dailyRfr = riskFreeRate / TRADING_DAYS;
  const excessReturns = dailyReturns.map((r) => r - dailyRfr);
  const downsideReturns = excessReturns.filter((r) => r < 0);
  if (downsideReturns.length === 0) return Infinity;

  const downsideDeviation =
    Math.sqrt(
      downsideReturns.reduce((sum, r) => sum + r * r, 0) /
        downsideReturns.length
    ) * SQRT_252;

  const annualReturn = (mean(dailyReturns) as number) * TRADING_DAYS;
  return (annualReturn - riskFreeRate) / downsideDeviation;
}

/**
 * Calmar Ratio = annualised return / |max drawdown|
 */
export function calcCalmar(
  annualisedReturn: number,
  maxDrawdown: number
): number {
  if (maxDrawdown === 0) return 0;
  return annualisedReturn / Math.abs(maxDrawdown);
}

/**
 * Information Ratio and Tracking Error
 */
export function calcInformationRatio(
  portfolioReturns: number[],
  benchmarkReturns: number[]
): { ir: number; trackingError: number; activeReturn: number } {
  const len = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (len < 2) return { ir: 0, trackingError: 0, activeReturn: 0 };

  const activeReturns = portfolioReturns
    .slice(-len)
    .map((r, i) => r - benchmarkReturns[benchmarkReturns.length - len + i]);
  const avgActive = (mean(activeReturns) as number) * TRADING_DAYS;
  const trackingError = (std(activeReturns, "uncorrected") as number) * SQRT_252;
  const ir = trackingError > 0 ? avgActive / trackingError : 0;

  return {
    ir,
    trackingError,
    activeReturn: avgActive,
  };
}

/**
 * Historical VaR and CVaR
 */
export function calcHistoricalVaR(
  dailyReturns: number[],
  currentPortfolioValue: number,
  confidenceLevel: 0.95 | 0.99,
  windowDays: number = 252
): { varPct: number; varGBP: number; cvarPct: number; cvarGBP: number } {
  const window = dailyReturns.slice(-windowDays);
  if (window.length < 10) {
    return { varPct: 0, varGBP: 0, cvarPct: 0, cvarGBP: 0 };
  }

  const sorted = [...window].sort((a, b) => a - b);
  const varIndex = Math.floor((1 - confidenceLevel) * sorted.length);
  const varPct = Math.abs(sorted[varIndex] ?? 0);

  // CVaR = average of returns worse than VaR
  const tailReturns = sorted.slice(0, varIndex + 1);
  const cvarPct =
    tailReturns.length > 0
      ? Math.abs(tailReturns.reduce((s, r) => s + r, 0) / tailReturns.length)
      : varPct;

  return {
    varPct,
    varGBP: varPct * currentPortfolioValue,
    cvarPct,
    cvarGBP: cvarPct * currentPortfolioValue,
  };
}

/**
 * Parametric VaR using normal distribution assumption
 */
export function calcParametricVaR(
  dailyReturns: number[],
  currentPortfolioValue: number,
  confidenceLevel: 0.95 | 0.99
): { varPct: number; varGBP: number } {
  if (dailyReturns.length < 2) {
    return { varPct: 0, varGBP: 0 };
  }

  const mu = mean(dailyReturns) as number;
  const sigma = std(dailyReturns, "uncorrected") as number;

  // Z-scores for common confidence levels
  const zScore = confidenceLevel === 0.99 ? 2.3263 : 1.6449;

  const varPct = Math.abs(mu - zScore * sigma);
  return {
    varPct,
    varGBP: varPct * currentPortfolioValue,
  };
}

export interface DrawdownResult {
  maxDrawdown: number;
  maxDrawdownStart: Date;
  maxDrawdownEnd: Date;
  recoveryDate: Date | null;
  currentDrawdown: number;
  currentPeak: number;
  currentPeakDate: Date;
  drawdownSeries: { date: Date; drawdown: number }[];
}

/**
 * Full drawdown analysis
 */
export function calcDrawdowns(
  dailyValues: { date: Date; value: number }[]
): DrawdownResult {
  if (dailyValues.length === 0) {
    const now = new Date();
    return {
      maxDrawdown: 0,
      maxDrawdownStart: now,
      maxDrawdownEnd: now,
      recoveryDate: null,
      currentDrawdown: 0,
      currentPeak: 0,
      currentPeakDate: now,
      drawdownSeries: [],
    };
  }

  const sorted = [...dailyValues].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  let peak = sorted[0].value;
  let peakDate = sorted[0].date;
  let maxDD = 0;
  let maxDDStart = sorted[0].date;
  let maxDDEnd = sorted[0].date;
  let recoveryDate: Date | null = null;
  let inDrawdown = false;
  let drawdownStart = sorted[0].date;

  const drawdownSeries: { date: Date; drawdown: number }[] = [];

  for (const point of sorted) {
    if (point.value > peak) {
      // New peak — check if we recovered from a drawdown
      if (inDrawdown) {
        recoveryDate = point.date;
        inDrawdown = false;
      }
      peak = point.value;
      peakDate = point.date;
    }

    const dd = peak > 0 ? (point.value - peak) / peak : 0;
    drawdownSeries.push({ date: point.date, drawdown: dd });

    if (dd < maxDD) {
      if (!inDrawdown) {
        inDrawdown = true;
        drawdownStart = peakDate;
      }
      maxDD = dd;
      maxDDStart = drawdownStart;
      maxDDEnd = point.date;
      recoveryDate = null;
    }
  }

  const lastValue = sorted[sorted.length - 1].value;
  const currentDrawdown = peak > 0 ? (lastValue - peak) / peak : 0;

  return {
    maxDrawdown: maxDD,
    maxDrawdownStart: maxDDStart,
    maxDrawdownEnd: maxDDEnd,
    recoveryDate,
    currentDrawdown,
    currentPeak: peak,
    currentPeakDate: peakDate,
    drawdownSeries,
  };
}

/**
 * Beta, Alpha, R² against a benchmark
 */
export function calcBeta(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  windowDays: number = 252
): { beta: number; alpha: number; rSquared: number } {
  const len = Math.min(
    portfolioReturns.length,
    benchmarkReturns.length,
    windowDays
  );
  if (len < 2) return { beta: 1, alpha: 0, rSquared: 0 };

  const p = portfolioReturns.slice(-len);
  const b = benchmarkReturns.slice(-len);

  const pMean = mean(p) as number;
  const bMean = mean(b) as number;

  let covPB = 0;
  let varB = 0;
  let varP = 0;

  for (let i = 0; i < len; i++) {
    const pDev = p[i] - pMean;
    const bDev = b[i] - bMean;
    covPB += pDev * bDev;
    varB += bDev * bDev;
    varP += pDev * pDev;
  }

  covPB /= len;
  varB /= len;
  varP /= len;

  const beta = varB !== 0 ? covPB / varB : 1;

  // Annualised alpha
  const annP = pMean * TRADING_DAYS;
  const annB = bMean * TRADING_DAYS;
  const alpha = annP - beta * annB;

  const rSquared = varP > 0 && varB > 0 ? (covPB * covPB) / (varP * varB) : 0;

  return { beta, alpha, rSquared };
}

/**
 * Pearson correlation matrix for multiple holdings
 */
export function calcCorrelationMatrix(
  holdingReturns: { ticker: string; returns: number[] }[]
): { tickers: string[]; matrix: number[][] } {
  const n = holdingReturns.length;
  const tickers = holdingReturns.map((h) => h.ticker);
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
        continue;
      }
      if (j < i) {
        matrix[i][j] = matrix[j][i];
        continue;
      }

      const ri = holdingReturns[i].returns;
      const rj = holdingReturns[j].returns;
      const len = Math.min(ri.length, rj.length);

      if (len < 2) {
        matrix[i][j] = 0;
        continue;
      }

      const p = ri.slice(-len);
      const q = rj.slice(-len);
      const pm = mean(p) as number;
      const qm = mean(q) as number;

      let cov = 0;
      let vp = 0;
      let vq = 0;
      for (let k = 0; k < len; k++) {
        const pd = p[k] - pm;
        const qd = q[k] - qm;
        cov += pd * qd;
        vp += pd * pd;
        vq += qd * qd;
      }

      const denom = Math.sqrt(vp * vq);
      matrix[i][j] = denom > 0 ? cov / denom : 0;
    }
  }

  return { tickers, matrix };
}
