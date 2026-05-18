// Verdict engine - combines price fairness (AVM), affordability and lifestyle
// fit into a single traffic-light recommendation for a first-time buyer.
//
// Designed to be readable end-to-end: every input is a number a buyer can
// supply in <60 seconds, and every sub-score has a one-sentence "why".
//
// In stage 3 the `areaPpsfSeed` and HPI growth lookups will be replaced by
// live calls to HM Land Registry + ONS via Lovable Cloud edge functions.
// The shape of `runVerdict` will not change.

import { runAvm, buildComparables, type SubjectProperty, type Comparable } from "@/lib/avm";
import { computePurchaseTax, type Region } from "@/lib/taxes";
import { monteCarloReturns, type HistoricStats, type MonteCarloResult } from "@/lib/historicReturns";

export type Light = "green" | "amber" | "red";

export interface VerdictInput {
  // Property
  postcodeOrArea: string;
  askingPrice: number;
  beds: number;
  sqft: number;
  // Buyer
  household: "single" | "couple" | "family";
  grossAnnualIncome: number;       // combined
  depositCash: number;
  region: Region;
  isFTB: boolean;
  // Lifestyle (3 sliders, 0-10 importance each)
  prioritiesTopThree: ("commute" | "schools" | "greenSpace" | "safety" | "nightlife" | "spaceInside")[];
  // Optional live HM Land Registry comparables (Stage 3). When supplied,
  // they replace the synthetic seed entirely.
  liveComparables?: Comparable[];
  // Optional resolved postcode info (Stage 2). When supplied, lifestyle
  // scoring uses the actual region/LAD instead of regex matching.
  resolvedRegion?: string;   // e.g. "London", "South East"
  resolvedLad?: string;      // e.g. "Westminster"
  // Optional historic HPI stats - drive the expected-return Monte Carlo.
  historicStats?: HistoricStats | null;
  // Hold horizon in years for the Monte Carlo (default 10).
  holdYears?: number;
  // Current Bank Rate (BoE) - drives the cash benchmark.
  cashRatePct?: number;
  // Optional live lifestyle overlays (0–100 each).
  liveSafetyScore?: number | null;       // from data.police.uk
  liveTransportScore?: number | null;    // from OSM Overpass (proxy for commute)
  liveCrimePerYear?: number | null;
  liveTransportNodes?: number | null;
  // Optional EPC stats for the postcode (Stage 4 - Free EPC Open Data).
  epcMedianSqft?: number | null;
  epcModeBand?: string | null;
  epcSampleSize?: number | null;
}

export interface SubScore {
  key: "price" | "afford" | "fit";
  label: string;
  light: Light;
  headline: string;     // one-sentence verdict
  detail: string;       // one paragraph
  metrics: { label: string; value: string }[];
}

export interface VerdictResult {
  overall: Light;
  oneLiner: string;
  scores: SubScore[];
  // Pass-throughs for the deep-dive panel
  avmP50: number;
  avmP10: number;
  avmP90: number;
  monthlyPayment: number;
  upfrontCash: number;
  stampDuty: number;
  /** "live" = real HMLR comps were used; "modelled" = synthetic seed. */
  priceSource: "live" | "modelled";
  compsUsed: number;
  /** Bootstrap Monte Carlo of capital returns when historic HPI was supplied. */
  expectedReturn: MonteCarloResult | null;
  /** Source label for the expected-return panel. */
  returnSource: "historic-hpi" | "modelled";
  /** Was lifestyle scoring informed by live overlays? */
  lifestyleSource: "live" | "modelled" | "partial";
  liveCrimePerYear?: number | null;
  liveTransportNodes?: number | null;
  /** EPC pass-throughs for the sources panel. */
  epcMedianSqft?: number | null;
  epcModeBand?: string | null;
  epcSampleSize?: number | null;
}

// Deterministic seed £/sqft for any UK area string. Crude but stable -
// stage 3 swaps this for live HMLR Price Paid lookups.
const AREA_SEEDS: Record<string, number> = {
  london: 820, manchester: 380, birmingham: 320, leeds: 290, bristol: 460,
  edinburgh: 410, glasgow: 240, cardiff: 290, liverpool: 250, sheffield: 260,
  brighton: 540, oxford: 580, cambridge: 560, reading: 440, nottingham: 280,
  newcastle: 240, bath: 510, york: 360, southampton: 340, plymouth: 260,
};
const seedForArea = (areaOrPostcode: string): number => {
  const norm = areaOrPostcode.toLowerCase().trim();
  // postcode districts → very rough London bias
  if (/^(e|n|nw|se|sw|w|wc|ec)\d/i.test(norm)) return 820;
  for (const [k, v] of Object.entries(AREA_SEEDS)) {
    if (norm.includes(k)) return v;
  }
  // Fallback: UK average ~£330/sqft
  return 330;
};

// Affordability: max sustainable price ≈ 4.5x income + deposit (FCA stress)
const monthlyMortgage = (loan: number, ratePct: number, years: number): number => {
  const r = ratePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return loan / n;
  return (loan * r) / (1 - Math.pow(1 + r, -n));
};

const lightFromScore = (score: number): Light =>
  score >= 75 ? "green" : score >= 55 ? "amber" : "red";

export const runVerdict = (i: VerdictInput): VerdictResult => {
  // -------- 1. Price fairness via AVM --------
  const seed = seedForArea(i.postcodeOrArea);
  const subject: SubjectProperty = {
    area: i.postcodeOrArea,
    sqft: i.sqft,
    beds: i.beds,
    yearBuilt: 1970,        // neutral default - refined later in deep-dive
    epc: ((i.epcModeBand as SubjectProperty["epc"]) ?? "D"),
    tenure: "Freehold",
    conditionScore: 5,
  };
  // Prefer live HMLR comps when supplied; otherwise fall back to the
  // deterministic synthetic pool.
  const comps =
    i.liveComparables && i.liveComparables.length >= 3
      ? i.liveComparables
      : buildComparables(seed, i.sqft, 14, i.postcodeOrArea);
  const priceSource: "live" | "modelled" =
    i.liveComparables && i.liveComparables.length >= 3 ? "live" : "modelled";
  const avm = runAvm(subject, comps);

  // % above/below central valuation
  const overpayPct = avm.p50 ? ((i.askingPrice - avm.p50) / avm.p50) * 100 : 0;
  // -10% (steal) → 100; 0% (fair) → 80; +10% (overpriced) → 40; +20% → 0
  const priceScore = Math.max(0, Math.min(100, 80 - overpayPct * 4));
  const priceLight = lightFromScore(priceScore);
  const priceHeadline =
    overpayPct < -3 ? "Priced below comparable sales - strong value."
    : overpayPct < 5 ? "Asking price is in line with recent sales."
    : overpayPct < 12 ? "Asking price is above recent sales - room to negotiate."
    : "Asking price is well above comparable sales.";

  // -------- 2. Affordability --------
  const tax = computePurchaseTax({
    price: i.askingPrice, region: i.region,
    isFTB: i.isFTB, isAdditional: false, isNonResident: false,
  });
  const fees = 2500; // legal + survey + searches, conservative average
  const upfrontCash = i.depositCash; // what they have
  const upfrontNeeded = tax.total + fees;
  const depositForLoan = Math.max(0, i.depositCash - upfrontNeeded);
  const loan = Math.max(0, i.askingPrice - depositForLoan);
  const ltv = i.askingPrice ? (loan / i.askingPrice) * 100 : 100;

  // Indicative rate by LTV (free BoE-style approximation; replaced by Twenty7tec in phase 4)
  const rate = ltv >= 95 ? 5.6 : ltv >= 90 ? 5.0 : ltv >= 85 ? 4.7 : ltv >= 75 ? 4.5 : 4.3;
  const monthly = monthlyMortgage(loan, rate, 30);
  const monthlyIncome = i.grossAnnualIncome / 12;
  const housingRatio = monthlyIncome ? monthly / monthlyIncome : 1; // gross
  const incomeMultiple = i.grossAnnualIncome ? loan / i.grossAnnualIncome : 99;

  // Score: housing ratio <28% AND income multiple ≤4.5 = green
  let affordScore = 100;
  if (housingRatio > 0.28) affordScore -= (housingRatio - 0.28) * 400;
  if (incomeMultiple > 4.5) affordScore -= (incomeMultiple - 4.5) * 25;
  if (depositForLoan / i.askingPrice < 0.05) affordScore -= 30;
  affordScore = Math.max(0, Math.min(100, affordScore));
  const affordLight = lightFromScore(affordScore);
  const affordHeadline =
    incomeMultiple > 5 ? `Loan would be ${incomeMultiple.toFixed(1)}× income - most lenders cap at 4.5×.`
    : housingRatio > 0.35 ? `Repayments would be ${(housingRatio * 100).toFixed(0)}% of gross income - tight.`
    : depositForLoan / i.askingPrice < 0.05 ? "Deposit after fees is below 5% - you'd struggle to get a mortgage."
    : "Comfortably within typical lender and affordability limits.";

  // -------- 3. Lifestyle fit --------
  // Prefer the resolved region from Postcodes.io; fall back to regex on the raw input.
  const regionLower = (i.resolvedRegion ?? "").toLowerCase();
  const inputLower = i.postcodeOrArea.toLowerCase();
  const isMajorCity =
    /london|south east|north west|west midlands|yorkshire/.test(regionLower) ||
    /london|manchester|birmingham|leeds|bristol|edinburgh|glasgow/.test(inputLower);
  const isLondonOrBigCulture =
    regionLower === "london" ||
    /london|manchester|brighton|bristol|leeds/.test(inputLower);
  const areaScores: Record<string, number> = {
    commute: i.liveTransportScore ?? (isMajorCity ? 80 : 55),
    schools: 65,
    greenSpace: /park|hill|grove|forest|heath|common|wood|garden/.test(inputLower) ? 80 : 60,
    safety: i.liveSafetyScore ?? 65,
    nightlife: isLondonOrBigCulture ? 80 : 50,
    spaceInside: i.sqft >= 850 ? 85 : i.sqft >= 650 ? 65 : 45,
  };
  const fitTop3 = i.prioritiesTopThree.length
    ? i.prioritiesTopThree.map((k) => areaScores[k] ?? 60)
    : [60, 60, 60];
  const fitScore = Math.round(fitTop3.reduce((s, v) => s + v, 0) / fitTop3.length);
  const fitLight = lightFromScore(fitScore);
  const fitHeadline =
    fitScore >= 75 ? "Strong match for the things you said matter most."
    : fitScore >= 55 ? "Decent fit - some priorities are stronger than others here."
    : "Weak match for your stated priorities.";

  // -------- Combine --------
  const lights: Light[] = [priceLight, affordLight, fitLight];
  // Affordability red is fatal; otherwise majority rules.
  const overall: Light =
    affordLight === "red" ? "red"
    : lights.filter((l) => l === "red").length >= 2 ? "red"
    : lights.every((l) => l === "green") ? "green"
    : lights.includes("red") ? "amber"
    : lights.filter((l) => l === "green").length >= 2 ? "green"
    : "amber";

  // -------- Expected return (Monte Carlo on real HPI) --------
  const holdYears = i.holdYears ?? 10;
  const cashRate = i.cashRatePct ?? 4;
  const expectedReturn = i.historicStats?.monthlyReturns?.length
    ? monteCarloReturns(i.historicStats.monthlyReturns, holdYears, cashRate)
    : null;
  const returnSource: "historic-hpi" | "modelled" =
    expectedReturn ? "historic-hpi" : "modelled";

  const oneLiner =
    overall === "green" ? "Worth a serious look - the numbers and the fit both stack up."
    : overall === "amber" ? "Has potential, but there are things to weigh up before you offer."
    : "We'd think twice. The numbers are working against you here.";

  return {
    overall,
    oneLiner,
    avmP50: avm.p50, avmP10: avm.p10, avmP90: avm.p90,
    monthlyPayment: Math.round(monthly),
    upfrontCash: Math.round(upfrontNeeded),
    stampDuty: Math.round(tax.total),
    priceSource,
    compsUsed: avm.comps.length,
    expectedReturn,
    returnSource,
    lifestyleSource:
      i.liveSafetyScore != null && i.liveTransportScore != null ? "live"
      : i.liveSafetyScore != null || i.liveTransportScore != null ? "partial"
      : "modelled",
    liveCrimePerYear: i.liveCrimePerYear ?? null,
    liveTransportNodes: i.liveTransportNodes ?? null,
    epcMedianSqft: i.epcMedianSqft ?? null,
    epcModeBand: i.epcModeBand ?? null,
    epcSampleSize: i.epcSampleSize ?? null,
    scores: [
      {
        key: "price", label: "Price fairness", light: priceLight, headline: priceHeadline,
        detail: `Comparable homes of similar size in ${i.postcodeOrArea} have sold for around £${avm.p50.toLocaleString()} (range £${avm.p10.toLocaleString()}–£${avm.p90.toLocaleString()}). The asking price is ${overpayPct >= 0 ? "+" : ""}${overpayPct.toFixed(1)}% vs that mid-estimate.`,
        metrics: [
          { label: "Mid-valuation", value: `£${avm.p50.toLocaleString()}` },
          { label: "Asking vs mid", value: `${overpayPct >= 0 ? "+" : ""}${overpayPct.toFixed(1)}%` },
          { label: "£/sqft", value: `£${avm.pricePerSqft}` },
        ],
      },
      {
        key: "afford", label: "Affordability", light: affordLight, headline: affordHeadline,
        detail: `On a 30-year repayment mortgage at ~${rate}%, the monthly payment would be £${Math.round(monthly).toLocaleString()}. That's ${(housingRatio * 100).toFixed(0)}% of your gross monthly income, with a loan-to-income multiple of ${incomeMultiple.toFixed(1)}×.`,
        metrics: [
          { label: "Monthly payment", value: `£${Math.round(monthly).toLocaleString()}` },
          { label: "Loan-to-income", value: `${incomeMultiple.toFixed(1)}×` },
          { label: "Upfront cash needed", value: `£${(tax.total + fees).toLocaleString()}` },
        ],
      },
      {
        key: "fit", label: "Lifestyle fit", light: fitLight, headline: fitHeadline,
        detail: `Based on the three priorities you picked, this area scores an average of ${fitScore}/100. Open the full Right-fit tool to weight all eight factors.`,
        metrics: i.prioritiesTopThree.map((k, idx) => ({
          label: k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
          value: `${fitTop3[idx]}/100`,
        })),
      },
    ],
  };
};
