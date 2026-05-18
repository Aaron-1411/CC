// Pure functions to turn an HPI series into historic CAGRs, volatility,
// and a bootstrap Monte Carlo of expected total returns.
//
// Inputs are deterministic; suitable for both the verdict and the
// /appreciation page. No side effects.

export interface HpiPoint { date: string; index: number; averagePrice?: number }

export interface HistoricStats {
  latestIndex: number;
  cagr1y: number | null;
  cagr5y: number | null;
  cagr10y: number | null;
  cagr20y: number | null;
  monthlyReturns: number[];   // log returns
  annVolPct: number;          // annualised stdev of log returns
  maxDrawdownPct: number;     // worst peak-to-trough %
}

export const computeHistoricStats = (series: HpiPoint[]): HistoricStats | null => {
  if (!series || series.length < 13) return null;
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1].index;
  const monthsBack = (n: number) =>
    sorted[sorted.length - 1 - n]?.index ?? null;
  const cagr = (start: number | null, years: number) =>
    start && start > 0 ? (Math.pow(last / start, 1 / years) - 1) * 100 : null;

  const monthlyReturns: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1].index, b = sorted[i].index;
    if (a > 0 && b > 0) monthlyReturns.push(Math.log(b / a));
  }
  const mean = monthlyReturns.reduce((s, v) => s + v, 0) / monthlyReturns.length;
  const variance = monthlyReturns.reduce((s, v) => s + (v - mean) ** 2, 0) / monthlyReturns.length;
  const annVolPct = Math.sqrt(variance * 12) * 100;

  let peak = sorted[0].index, mdd = 0;
  for (const p of sorted) {
    peak = Math.max(peak, p.index);
    mdd = Math.min(mdd, (p.index - peak) / peak);
  }

  return {
    latestIndex: last,
    cagr1y: cagr(monthsBack(12), 1),
    cagr5y: cagr(monthsBack(60), 5),
    cagr10y: cagr(monthsBack(120), 10),
    cagr20y: cagr(monthsBack(240), 20),
    monthlyReturns,
    annVolPct: +annVolPct.toFixed(2),
    maxDrawdownPct: +(mdd * 100).toFixed(1),
  };
};

export interface MonteCarloResult {
  paths: number;
  yearsHeld: number;
  /** total return % over the hold (capital only) at each percentile */
  p10Pct: number; p50Pct: number; p90Pct: number;
  /** annualised version of above */
  annP10Pct: number; annP50Pct: number; annP90Pct: number;
  probPositive: number;     // 0..1
  probBeatsCash: number;    // beats cumulative cash return at boe path
}

// Bootstrap: sample monthly log returns with replacement, regime-blended
// (70% historical, 30% pulled toward long-run mean to dampen overconfidence).
export const monteCarloReturns = (
  monthlyReturns: number[],
  yearsHeld: number,
  cashAnnualPct = 4,
  paths = 4000,
  seed = 42,
): MonteCarloResult | null => {
  if (!monthlyReturns.length || yearsHeld <= 0) return null;
  const n = yearsHeld * 12;
  const longRunMean = monthlyReturns.reduce((s, v) => s + v, 0) / monthlyReturns.length;
  const cashLog = Math.log(1 + cashAnnualPct / 100) / 12;

  // Mulberry32 PRNG for determinism
  let s = seed;
  const rand = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const totals: number[] = [];
  let positive = 0, beatCash = 0;
  for (let p = 0; p < paths; p++) {
    let logSum = 0;
    for (let m = 0; m < n; m++) {
      const idx = Math.floor(rand() * monthlyReturns.length);
      const sample = monthlyReturns[idx];
      // 70/30 blend toward long-run mean
      logSum += 0.7 * sample + 0.3 * longRunMean;
    }
    const totalPct = (Math.exp(logSum) - 1) * 100;
    totals.push(totalPct);
    if (totalPct > 0) positive++;
    if (logSum > cashLog * n) beatCash++;
  }
  totals.sort((a, b) => a - b);
  const pct = (q: number) => totals[Math.floor(q * (totals.length - 1))];
  const p10 = pct(0.1), p50 = pct(0.5), p90 = pct(0.9);
  const ann = (pct: number) => (Math.pow(1 + pct / 100, 1 / yearsHeld) - 1) * 100;

  return {
    paths, yearsHeld,
    p10Pct: +p10.toFixed(1), p50Pct: +p50.toFixed(1), p90Pct: +p90.toFixed(1),
    annP10Pct: +ann(p10).toFixed(2),
    annP50Pct: +ann(p50).toFixed(2),
    annP90Pct: +ann(p90).toFixed(2),
    probPositive: +(positive / paths).toFixed(3),
    probBeatsCash: +(beatCash / paths).toFixed(3),
  };
};
