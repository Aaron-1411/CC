// Area finder — matches a buyer's brief (budget, beds, lifestyle, must-haves,
// deal-breakers) against the AREAS dataset and returns a ranked shortlist
// with plain-English "why" reasoning. Pure function, no IO.

import { Area, AREAS, investmentScore, schoolImpactScore } from "@/data/areas";

export type Lifestyle =
  | "city_pro" | "young_family" | "growing_family"
  | "downsizer" | "remote_worker" | "investor" | "first_time_buyer";

export type MustHave =
  | "good_schools" | "low_crime" | "green_space" | "fast_transport"
  | "high_yield" | "growth_potential" | "affordable";

export type DealBreaker =
  | "high_crime" | "long_commute" | "above_budget" | "weak_schools";

export interface BuyerBrief {
  budget?: number;       // max £
  beds?: number;         // ignored for scoring (we don't have per-area bed mix)
  lifestyle: Lifestyle;
  mustHaves: MustHave[];
  dealBreakers: DealBreaker[];
  region?: string;       // "all" or a RegionName
  query?: string;        // free text search
}

export interface AreaMatch {
  area: Area;
  score: number;          // 0-100
  reasons: string[];      // positive
  warnings: string[];     // soft negatives
  blocked?: string;       // deal-breaker hit → still shown but flagged
}

const LIFESTYLE_WEIGHTS: Record<Lifestyle, Record<string, number>> = {
  first_time_buyer: { affordable: 3, transport: 2, crime: 2, schools: 1, green: 1, growth: 2, yield: 0 },
  city_pro:         { affordable: 1, transport: 3, crime: 1, schools: 0, green: 1, growth: 2, yield: 1 },
  young_family:     { affordable: 2, transport: 1, crime: 3, schools: 3, green: 2, growth: 1, yield: 0 },
  growing_family:   { affordable: 2, transport: 1, crime: 3, schools: 3, green: 3, growth: 1, yield: 0 },
  downsizer:        { affordable: 2, transport: 1, crime: 2, schools: 0, green: 3, growth: 1, yield: 1 },
  remote_worker:    { affordable: 2, transport: 0, crime: 2, schools: 1, green: 3, growth: 1, yield: 1 },
  investor:         { affordable: 1, transport: 2, crime: 1, schools: 1, green: 0, growth: 3, yield: 3 },
};

export function scoreArea(area: Area, brief: BuyerBrief): AreaMatch {
  const w = LIFESTYLE_WEIGHTS[brief.lifestyle];
  const reasons: string[] = [];
  const warnings: string[] = [];

  // Per-dimension 0-1 normalisations
  const affordable01 = brief.budget
    ? Math.max(0, Math.min(1, (brief.budget * 1.05 - area.medianPrice) / Math.max(1, brief.budget)))
    : Math.max(0, 1 - area.medianPrice / 800_000);
  const transport01 = area.transport / 10;
  const crime01     = Math.max(0, 1 - area.crime / 120);
  const schools01   = Math.max(0, Math.min(1, schoolImpactScore(area.schoolBreakdown) / 100));
  const green01     = area.green / 10;
  const growth01    = Math.max(0, Math.min(1, area.growth5y / 35));
  const yield01     = Math.max(0, Math.min(1, area.yield / 7));

  const dims: Array<[string, number, number]> = [
    ["affordable", affordable01, w.affordable],
    ["transport",  transport01,  w.transport],
    ["crime",      crime01,      w.crime],
    ["schools",    schools01,    w.schools],
    ["green",      green01,      w.green],
    ["growth",     growth01,     w.growth],
    ["yield",      yield01,      w.yield],
  ];

  // Must-haves: hard floor — score must clear bar or it's noted as a warning
  const mhMap: Record<MustHave, [string, number]> = {
    affordable:        ["affordable", 0.55],
    fast_transport:    ["transport",  0.65],
    low_crime:         ["crime",      0.55],
    good_schools:      ["schools",    0.55],
    green_space:       ["green",      0.6],
    growth_potential:  ["growth",     0.5],
    high_yield:        ["yield",      0.55],
  };
  for (const mh of brief.mustHaves) {
    const [key, floor] = mhMap[mh];
    const v = dims.find((d) => d[0] === key)?.[1] ?? 0;
    if (v >= floor) reasons.push(MUST_HAVE_LABEL[mh] + " ✓");
    else warnings.push(MUST_HAVE_LABEL[mh] + " below your bar");
  }

  // Deal-breakers
  let blocked: string | undefined;
  for (const db of brief.dealBreakers) {
    if (db === "above_budget" && brief.budget && area.medianPrice > brief.budget * 1.05) {
      blocked = "Above your budget";
    }
    if (db === "high_crime" && area.crime > 75) blocked = "Crime above safe threshold";
    if (db === "weak_schools" && schoolImpactScore(area.schoolBreakdown) < 45) blocked = "Schools below your bar";
    if (db === "long_commute") {
      const fastest = Math.min(
        ...["cityCentre", "regionalHub", "london"].flatMap((d) =>
          (["rail", "tube", "drive"] as const).map((m) => area.commute[m][d] ?? 999),
        ),
      );
      if (fastest > 60) blocked = "Best commute >60 min";
    }
  }

  // Soft positives — pull out genuinely strong dimensions
  if (affordable01 > 0.7 && brief.budget) reasons.push("Comfortably within budget");
  if (transport01 > 0.8) reasons.push("Excellent transport");
  if (crime01 > 0.75) reasons.push("Low crime for the region");
  if (schools01 > 0.7) reasons.push("Strong schools");
  if (green01 > 0.8) reasons.push("Lots of green space");
  if (growth01 > 0.65) reasons.push(`Strong growth (+${area.growth5y}% / 5yr)`);
  if (yield01 > 0.7) reasons.push(`High yield (${area.yield}%)`);
  if (investmentScore(area) >= 75) reasons.push("Top-quartile investment outlook");

  // Composite score
  const totalW = dims.reduce((s, d) => s + d[2], 0) || 1;
  const raw = dims.reduce((s, d) => s + d[1] * d[2], 0) / totalW;
  let score = Math.round(raw * 100);
  if (blocked) score = Math.max(0, score - 35);

  return { area, score, reasons: reasons.slice(0, 4), warnings: warnings.slice(0, 3), blocked };
}

const MUST_HAVE_LABEL: Record<MustHave, string> = {
  good_schools: "Good schools",
  low_crime: "Low crime",
  green_space: "Green space",
  fast_transport: "Fast transport",
  high_yield: "High rental yield",
  growth_potential: "Growth potential",
  affordable: "Affordable",
};

export function findAreas(brief: BuyerBrief, limit = 10): AreaMatch[] {
  const q = brief.query?.trim().toLowerCase();
  const pool = AREAS.filter((a) => {
    if (brief.region && brief.region !== "all" && a.region !== brief.region) return false;
    if (q && !a.name.toLowerCase().includes(q) && !a.region.toLowerCase().includes(q)) return false;
    return true;
  });
  return pool
    .map((a) => scoreArea(a, brief))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export const LIFESTYLE_OPTIONS: { v: Lifestyle; label: string; hint: string }[] = [
  { v: "first_time_buyer", label: "First-time buyer",  hint: "Affordable, safe, transport-connected" },
  { v: "young_family",     label: "Young family",      hint: "Schools, parks, low crime" },
  { v: "growing_family",   label: "Growing family",    hint: "Space, schools, green" },
  { v: "city_pro",         label: "City professional", hint: "Transport + nightlife" },
  { v: "remote_worker",    label: "Remote worker",     hint: "Space, green, broadband" },
  { v: "downsizer",        label: "Downsizer",         hint: "Quiet, green, accessible" },
  { v: "investor",         label: "Investor",          hint: "Yield + growth + demand" },
];

export const MUST_HAVE_OPTIONS: { v: MustHave; label: string }[] = [
  { v: "affordable",       label: "Within my budget" },
  { v: "fast_transport",   label: "Fast transport" },
  { v: "low_crime",        label: "Low crime" },
  { v: "good_schools",     label: "Good schools" },
  { v: "green_space",      label: "Green space" },
  { v: "growth_potential", label: "Price growth potential" },
  { v: "high_yield",       label: "High rental yield" },
];

export const DEAL_BREAKER_OPTIONS: { v: DealBreaker; label: string }[] = [
  { v: "above_budget",  label: "Above my budget" },
  { v: "high_crime",    label: "High crime" },
  { v: "long_commute",  label: "Long commute (>60 min)" },
  { v: "weak_schools",  label: "Weak schools" },
];
