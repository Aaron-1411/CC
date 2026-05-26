export interface PerformanceResult {
  period: string; // "1D" | "5D" | "1M" | "3M" | "YTD" | "1Y" | "ITD"
  portfolioReturn: number; // as decimal, e.g. 0.05 = 5%
  portfolioReturnGBP: number;
  benchmarkReturn: number | null;
  alpha: number | null; // excess return over benchmark
  startDate: Date;
  startValue: number;
  endValue: number;
  absoluteGainGBP: number;
}

export interface RollingReturnPoint {
  date: string;
  portfolioReturn: number;
  benchmarkReturn: number | null;
  alpha: number | null;
}

export interface MonthlyReturnRow {
  year: number;
  months: (number | null)[]; // [Jan, Feb, ..., Dec]
  annual: number | null;
}

export interface RiskMetrics {
  volatility30d: number | null;
  volatility90d: number | null;
  sharpe30d: number | null;
  sortino30d: number | null;
  calmar: number | null;
  maxDrawdown: number | null;
  maxDrawdownStart: string | null;
  maxDrawdownEnd: string | null;
  currentDrawdown: number | null;
  currentPeak: number | null;
  var95_1d: number | null; // as GBP
  var99_1d: number | null;
  cvar95_1d: number | null;
  var95pct: number | null; // as decimal
  var99pct: number | null;
  beta_sp500: number | null;
  beta_ftse_aw: number | null;
  alpha_sp500: number | null;
  infoRatio_sp500: number | null;
  correlationVsSP500: number | null;
  correlationVsFTSEAW: number | null;
  trackingErrorVsSP500: number | null;
}

export interface DrawdownEpisode {
  start: string;
  trough: string;
  recovery: string | null;
  drawdownPct: number;
  daysToTrough: number;
  daysToRecovery: number | null;
}

export interface DrawdownSeries {
  date: string;
  drawdown: number;
}

export interface AttributionItem {
  ticker: string;
  name: string;
  startWeight: number;
  endWeight: number;
  avgWeight: number;
  holdingReturn: number;
  portfolioReturn: number;
  benchmarkReturn: number | null;
  allocationEffect: number;
  selectionEffect: number;
  interactionEffect: number;
  totalEffect: number;
  contribution: number;
  color: string;
}

export interface CorrelationMatrix {
  tickers: string[];
  matrix: number[][];
}

export interface VaRResult {
  varPct: number;
  varGBP: number;
  cvarPct: number;
  cvarGBP: number;
  confidenceLevel: number;
  method: "historical" | "parametric";
  windowDays: number;
}

export interface BetaResult {
  ticker?: string;
  beta: number;
  alpha: number;
  rSquared: number;
  benchmark: string;
}

export interface SectorExposure {
  sector: string;
  weightPct: number;
  valueGBP: number;
  holdings: string[];
}

export interface CurrencyExposure {
  currency: string;
  weightPct: number;
  valueGBP: number;
  holdings: string[];
}

export interface ConcentrationMetrics {
  hhi: number; // Herfindahl-Hirschman Index
  effectiveN: number; // 1/HHI
  top3Weight: number;
  top5Weight: number;
  top10Weight: number;
  sectorExposures: SectorExposure[];
  currencyExposures: CurrencyExposure[];
}
