// Auto-scoring engine - derives all qualitative scores from the underlying
// dataset so the user does NOT have to. Every output carries an explanation
// trail so we can render full methodology in-product.
//
// Scoring is normalised to 0–10 (factor scores) or 0–100 (composites).
// Each derivation function returns { value, inputs[], formula, source }.

import type { Area } from "@/data/areas";
import type { Property } from "@/data/properties";

export interface ScoreTrace {
  /** Final score 0–10 */
  value: number;
  /** Plain-English label */
  label: string;
  /** Inputs used to compute this score, with their raw values */
  inputs: { label: string; raw: string | number; weight?: number }[];
  /** Human-readable formula */
  formula: string;
  /** Source of the underlying data */
  source: string;
}

const clamp = (n: number, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, n));
const norm = (raw: number, lo: number, hi: number) =>
  clamp(((raw - lo) / (hi - lo)) * 10);

// =============== APPRECIATION FACTORS (per area) ===============

export const deriveTransport = (a: Area): ScoreTrace => {
  // Lower commute times to London / regional hub = better connectivity
  const london = a.commute.rail.london ?? a.commute.tube.london ?? 90;
  const hub = a.commute.rail.regionalHub ?? a.commute.tube.regionalHub ?? a.commute.drive.regionalHub ?? 60;
  // 10 = ≤20min, 0 = ≥90min
  const londonScore = norm(90 - london, 0, 70);
  const hubScore = norm(60 - hub, 0, 50);
  const value = clamp((a.transport * 0.5) + (londonScore * 0.3) + (hubScore * 0.2));
  return {
    value: +value.toFixed(1), label: "Transport & connectivity",
    inputs: [
      { label: "Area transport score (PTAL)", raw: `${a.transport}/10`, weight: 0.5 },
      { label: "Best rail/tube to London (min)", raw: london, weight: 0.3 },
      { label: "Best route to regional hub (min)", raw: hub, weight: 0.2 },
    ],
    formula: "0.5×PTAL + 0.3×normalise(90−London) + 0.2×normalise(60−Hub)",
    source: "DfT PTAL · TfL Journey Planner · National Rail",
  };
};

export const deriveSchools = (a: Area): ScoreTrace => {
  const sb = a.schoolBreakdown;
  const ofsted = (sb.primaryOfsted + sb.secondaryOfsted) / 2; // already 1–10
  const outstanding = norm(sb.pctOutstanding, 0, 60);
  const premium = norm(sb.catchmentPremium, 0, 25);
  const value = clamp(ofsted * 0.55 + outstanding * 0.25 + premium * 0.20);
  return {
    value: +value.toFixed(1), label: "School quality",
    inputs: [
      { label: "Avg Ofsted (primary+secondary)/2", raw: ofsted.toFixed(1), weight: 0.55 },
      { label: "% schools rated Outstanding", raw: `${sb.pctOutstanding}%`, weight: 0.25 },
      { label: "Observed catchment premium", raw: `${sb.catchmentPremium}%`, weight: 0.20 },
    ],
    formula: "0.55×OfstedAvg + 0.25×norm(%Outstanding,0,60) + 0.20×norm(Premium%,0,25)",
    source: "Ofsted ratings · DfE performance tables · Rightmove catchment data",
  };
};

export const deriveRegen = (a: Area): ScoreTrace => {
  const capex = norm(a.investment.capexPipeline, 30, 95);
  const recentGrowth = a.investment.yearlyGrowth.slice(-3).reduce((s, x) => s + x, 0) / 3;
  const growth = norm(recentGrowth, 0, 7);
  const value = clamp(capex * 0.65 + growth * 0.35);
  return {
    value: +value.toFixed(1), label: "Regeneration & investment",
    inputs: [
      { label: "Capex pipeline index", raw: a.investment.capexPipeline, weight: 0.65 },
      { label: "Avg growth last 3 yrs", raw: `${recentGrowth.toFixed(1)}%`, weight: 0.35 },
    ],
    formula: "0.65×norm(Capex,30,95) + 0.35×norm(3yGrowth,0,7)",
    source: "EGi/CoStar regen pipeline · ONS HPI",
  };
};

export const deriveSupply = (a: Area): ScoreTrace => {
  // Lower price-vs-region ratio implies room to grow (less premium baked in)
  const rel = a.investment.pricePerSqft / Math.max(1, a.investment.pricePerSqftRegion);
  // 0.7 → 10 (cheap vs region, scarce), 1.3 → 0 (expensive vs region)
  const supplyTightness = clamp((1.3 - rel) / 0.6 * 10);
  const voidsAdj = norm(4 - a.investment.voidWeeks, 0, 4); // fewer voids = tight
  const value = clamp(supplyTightness * 0.6 + voidsAdj * 0.4);
  return {
    value: +value.toFixed(1), label: "Supply pressure (scarcity)",
    inputs: [
      { label: "£/sqft vs regional avg", raw: rel.toFixed(2), weight: 0.6 },
      { label: "Avg rental void (weeks)", raw: a.investment.voidWeeks, weight: 0.4 },
    ],
    formula: "0.6×scarcityFromPriceRatio + 0.4×norm(4−voids,0,4)",
    source: "ONS PRMS · Land Registry £/sqft",
  };
};

export const deriveCondition = (a: Area, p?: Property): ScoreTrace => {
  // Without a property: use area's typical condition (newer growth / regen as proxy)
  if (!p) {
    const proxy = clamp(5 + (a.investment.capexPipeline - 60) / 10);
    return {
      value: +proxy.toFixed(1), label: "Property condition vs area",
      inputs: [{ label: "Area capex/regen index (proxy)", raw: a.investment.capexPipeline }],
      formula: "5 + (Capex−60)/10",
      source: "EGi/CoStar regen pipeline (area-level proxy)",
    };
  }
  const age = new Date().getFullYear() - p.yearBuilt;
  const ageScore = clamp(10 - age / 12);            // ≈ -1 every 12 yrs old
  const epcMap: Record<string, number> = { A: 10, B: 9, C: 7.5, D: 6, E: 4, F: 2.5, G: 1 };
  const epcScore = epcMap[p.epc] ?? 5;
  const tenureScore = p.tenure === "Freehold" ? 10 : 7;
  const value = clamp(ageScore * 0.45 + epcScore * 0.35 + tenureScore * 0.20);
  return {
    value: +value.toFixed(1), label: "Property condition vs area",
    inputs: [
      { label: "Year built", raw: p.yearBuilt, weight: 0.45 },
      { label: "EPC rating", raw: p.epc, weight: 0.35 },
      { label: "Tenure", raw: p.tenure, weight: 0.20 },
    ],
    formula: "0.45×ageScore + 0.35×epcScore + 0.20×tenureScore",
    source: "EPC Open Data · HM Land Registry",
  };
};

export const deriveDemographics = (a: Area): ScoreTrace => {
  const demand = norm(a.investment.rentalDemand, 60, 100);
  const afford = norm(15 - a.investment.affordabilityRatio, 0, 8);
  const value = clamp(demand * 0.6 + afford * 0.4);
  return {
    value: +value.toFixed(1), label: "Demographic momentum",
    inputs: [
      { label: "Rental demand index", raw: a.investment.rentalDemand, weight: 0.6 },
      { label: "Affordability ratio (price ÷ income)", raw: a.investment.affordabilityRatio, weight: 0.4 },
    ],
    formula: "0.6×norm(Demand,60,100) + 0.4×norm(15−AffordRatio,0,8)",
    source: "ONS Earnings · ONS PRMS · Zoopla rental indices",
  };
};

// =============== APPRECIATION COMPOSITE ===============

export interface AppreciationDerivation {
  score: number;          // 0–100
  impliedGrowthPct: number;
  factors: ScoreTrace[];
  weights: Record<string, number>;
}

export const deriveAppreciation = (a: Area, p?: Property): AppreciationDerivation => {
  const factors = [
    deriveTransport(a),
    deriveSchools(a),
    deriveRegen(a),
    deriveSupply(a),
    deriveCondition(a, p),
    deriveDemographics(a),
  ];
  const weights = { transport: 0.22, schools: 0.18, regen: 0.18, supply: 0.15, condition: 0.12, demographics: 0.15 };
  const wArr = [weights.transport, weights.schools, weights.regen, weights.supply, weights.condition, weights.demographics];
  const raw = factors.reduce((s, f, i) => s + f.value * wArr[i], 0);
  const score = Math.round(raw * 10);
  const impliedGrowthPct = +(1 + (score / 100) * 5).toFixed(2);
  return { score, impliedGrowthPct, factors, weights };
};

// =============== RIGHT-FIT (per area, derived) ===============

export interface DerivedFitScores {
  commute: number; schools: number; greenSpace: number;
  nightlife: number; safety: number; affordability: number;
  spaceInside: number; futureGrowth: number;
}

export interface FitDerivation {
  scores: DerivedFitScores;
  traces: Record<keyof DerivedFitScores, ScoreTrace>;
}

const to100 = (s: ScoreTrace) => ({ ...s, value: Math.round(s.value * 10) });

export const deriveAreaFit = (a: Area, p?: Property): FitDerivation => {
  const transport = to100(deriveTransport(a));
  const schoolsT = to100(deriveSchools(a));
  const green: ScoreTrace = {
    value: a.green * 10, label: "Green space",
    inputs: [{ label: "Area green-space index", raw: `${a.green}/10` }],
    formula: "Green index ×10",
    source: "OS Open Greenspace · ONS Access to Greenspace",
  };
  // Crime: lower = safer. Map 0→100 (≤20/1000), 200→0
  const safetyVal = Math.max(0, Math.min(100, Math.round(100 - (a.crime / 200) * 100)));
  const safety: ScoreTrace = {
    value: safetyVal, label: "Safety",
    inputs: [{ label: "Crimes per 1,000 residents (12mo)", raw: a.crime }],
    formula: "100 − (crime / 200) × 100",
    source: "data.police.uk street-level data",
  };
  // Nightlife proxy: combination of vibe keywords + capex pipeline
  const nightVibe = /food|creative|indie|young|vibrant|bohemian|bar|night/i.test(a.vibe) ? 8 : 4;
  const night: ScoreTrace = {
    value: clamp(nightVibe + (a.investment.capexPipeline - 60) / 20) * 10,
    label: "Nightlife & culture",
    inputs: [{ label: "Vibe keywords", raw: a.vibe }, { label: "Capex pipeline", raw: a.investment.capexPipeline }],
    formula: "vibeKeyword + (Capex−60)/20, ×10",
    source: "OS POI · area vibe descriptors",
  };
  const affordVal = Math.max(0, Math.min(100, Math.round(100 - (a.investment.affordabilityRatio / 20) * 100)));
  const afford: ScoreTrace = {
    value: affordVal, label: "Affordability",
    inputs: [{ label: "Price-to-income ratio", raw: a.investment.affordabilityRatio }],
    formula: "100 − (ratio / 20) × 100",
    source: "ONS Earnings · Land Registry median price",
  };
  const spaceBase = p ? Math.min(100, (p.sqft / 12)) : Math.min(100, 1500 / Math.max(400, a.investment.pricePerSqft) * 50);
  const space: ScoreTrace = {
    value: Math.round(spaceBase), label: "Internal space",
    inputs: p ? [{ label: "Property sqft", raw: p.sqft }] : [{ label: "Indicative sqft per £350k", raw: Math.round(350_000 / a.investment.pricePerSqft) }],
    formula: p ? "min(100, sqft/12)" : "350k / £psqft → indicative sqft",
    source: "EPC Open Data · Land Registry £/sqft",
  };
  const growth = to100(deriveAppreciationCompact(a, p));

  return {
    scores: {
      commute: transport.value, schools: schoolsT.value, greenSpace: green.value,
      nightlife: night.value, safety: safety.value, affordability: afford.value,
      spaceInside: space.value, futureGrowth: growth.value,
    },
    traces: {
      commute: transport, schools: schoolsT, greenSpace: green,
      nightlife: night, safety, affordability: afford,
      spaceInside: space, futureGrowth: growth,
    },
  };
};

// Compact appreciation as ScoreTrace for embedding
const deriveAppreciationCompact = (a: Area, p?: Property): ScoreTrace => {
  const d = deriveAppreciation(a, p);
  return {
    value: d.score / 10,
    label: "Future growth",
    inputs: d.factors.map((f) => ({ label: f.label, raw: f.value, weight: (d.weights as any)[Object.keys(d.weights)[d.factors.indexOf(f)]] })),
    formula: "Weighted blend of 6 appreciation factors (see Appreciation tool)",
    source: "Composite - Land Registry · ONS · DfT · Ofsted · regen pipeline",
  };
};

// =============== PROPERTY COMPOSITE WEIGHTS (auto from buyer profile) ===============

import type { Weights } from "@/data/properties";

export const deriveWeightsFor = (profile: "ftb" | "investor" | "family" | "downsizer"): { weights: Weights; rationale: string } => {
  const map: Record<string, Weights> = {
    ftb:       { price: 38, size: 18, condition: 17, tenure: 15, epc: 12 },
    investor:  { price: 22, size: 22, condition: 14, tenure: 22, epc: 20 },
    family:    { price: 25, size: 30, condition: 18, tenure: 15, epc: 12 },
    downsizer: { price: 20, size: 15, condition: 22, tenure: 18, epc: 25 },
  };
  const rationale: Record<string, string> = {
    ftb: "Affordability dominates: price-to-stretch and EPC running costs matter most.",
    investor: "Yield, freehold and energy efficiency drive net returns; price secondary.",
    family: "Internal space and condition are critical; affordability still material.",
    downsizer: "Energy bills and turnkey condition outrank size; freehold preferred.",
  };
  return { weights: map[profile], rationale: rationale[profile] };
};
