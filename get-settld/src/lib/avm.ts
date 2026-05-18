// Property-level Automated Valuation Model
// Synthetic, transparent model: anchors on £/sqft of recent comparables,
// adjusts for size, condition, EPC, tenure, lease, then quantifies
// uncertainty as a confidence interval (P10 / P50 / P90).

export type Tenure = "Freehold" | "Leasehold";

export interface Comparable {
  id: string;
  address: string;
  soldPrice: number;
  soldDate: string;       // ISO yyyy-mm-dd
  sqft: number;
  beds: number;
  epc: string;
  tenure: Tenure;
  distanceMiles: number;  // distance from subject
}

export interface SubjectProperty {
  area: string;            // e.g. "Wood Green N22"
  postcode?: string;
  sqft: number;
  beds: number;
  yearBuilt: number;
  epc: string;
  tenure: Tenure;
  leaseYears?: number;
  conditionScore: number;  // 0-10 vs area average
}

export interface SimilarityCriteria {
  /** Hard floor on usable comps before the AVM degrades to "low" confidence */
  minComps: number;
  /** Max miles from subject postcode to consider a comp */
  maxDistanceMiles: number;
  /** Max months since sale completion */
  maxAgeMonths: number;
  /** Subject sqft ± this fraction (e.g. 0.35 = within 35%) */
  sqftTolerancePct: number;
  /** Beds must match within ± this number */
  bedsTolerance: number;
  /** Allowed tenure types */
  tenureMatch: Tenure[];
}

export const DEFAULT_SIMILARITY: SimilarityCriteria = {
  minComps: 5,
  maxDistanceMiles: 0.5,
  maxAgeMonths: 18,
  sqftTolerancePct: 0.35,
  bedsTolerance: 1,
  tenureMatch: ["Freehold", "Leasehold"],
};

export interface AvmResult {
  p10: number;             // low estimate (10th percentile)
  p50: number;             // central valuation
  p90: number;             // high estimate (90th percentile)
  pricePerSqft: number;
  confidence: "high" | "medium" | "low";
  comps: Comparable[];          // accepted (passed similarity filter)
  rejectedComps: { comp: Comparable; reasons: string[] }[];
  similarity: SimilarityCriteria;
  minCompsUsed: number;
  adjustments: { label: string; delta: number; note: string }[];
  asOf: string;
}

const EPC_ADJ: Record<string, number> = {
  A: 0.04, B: 0.025, C: 0.01, D: 0, E: -0.02, F: -0.04, G: -0.06,
};

// Time-decay weight: more recent = higher weight
const recencyWeight = (iso: string) => {
  const months = Math.max(0, (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30));
  return Math.exp(-months / 12);
};

const distanceWeight = (miles: number) => Math.exp(-miles / 0.6);

const sizeWeight = (compSqft: number, subjectSqft: number) => {
  const ratio = Math.min(compSqft, subjectSqft) / Math.max(compSqft, subjectSqft);
  return Math.pow(ratio, 1.5);
};

/** Filter raw comparable pool by similarity criteria, returning accepted + rejected (with reasons). */
export const filterComparables = (
  subject: SubjectProperty,
  pool: Comparable[],
  criteria: SimilarityCriteria = DEFAULT_SIMILARITY,
) => {
  const accepted: Comparable[] = [];
  const rejected: { comp: Comparable; reasons: string[] }[] = [];
  const ageMonths = (iso: string) =>
    Math.max(0, (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30));

  for (const c of pool) {
    const reasons: string[] = [];
    if (c.distanceMiles > criteria.maxDistanceMiles)
      reasons.push(`>${criteria.maxDistanceMiles}mi from subject`);
    if (ageMonths(c.soldDate) > criteria.maxAgeMonths)
      reasons.push(`sold >${criteria.maxAgeMonths}mo ago`);
    const sqftDiff = Math.abs(c.sqft - subject.sqft) / Math.max(1, subject.sqft);
    if (sqftDiff > criteria.sqftTolerancePct)
      reasons.push(`sqft outside ±${Math.round(criteria.sqftTolerancePct * 100)}%`);
    if (Math.abs(c.beds - subject.beds) > criteria.bedsTolerance)
      reasons.push(`beds outside ±${criteria.bedsTolerance}`);
    if (!criteria.tenureMatch.includes(c.tenure))
      reasons.push(`tenure ${c.tenure} not allowed`);
    if (reasons.length === 0) accepted.push(c);
    else rejected.push({ comp: c, reasons });
  }
  return { accepted, rejected };
};

export const runAvm = (
  subject: SubjectProperty,
  pool: Comparable[],
  criteria: SimilarityCriteria = DEFAULT_SIMILARITY,
): AvmResult => {
  const { accepted: comps, rejected: rejectedComps } = filterComparables(subject, pool, criteria);
  const minCompsUsed = criteria.minComps;

  if (!comps.length) {
    return {
      p10: 0, p50: 0, p90: 0, pricePerSqft: 0, confidence: "low",
      comps: [], rejectedComps, similarity: criteria, minCompsUsed,
      adjustments: [], asOf: new Date().toISOString().slice(0, 10),
    };
  }

  // Compute weighted £/sqft from comps
  const weighted = comps.map((c) => {
    const w = recencyWeight(c.soldDate) * distanceWeight(c.distanceMiles) * sizeWeight(c.sqft, subject.sqft);
    return { ppsf: c.soldPrice / c.sqft, weight: w };
  });
  const totalW = weighted.reduce((s, x) => s + x.weight, 0) || 1;
  const meanPpsf = weighted.reduce((s, x) => s + x.ppsf * x.weight, 0) / totalW;
  const variance = weighted.reduce((s, x) => s + x.weight * Math.pow(x.ppsf - meanPpsf, 2), 0) / totalW;
  const stdDev = Math.sqrt(variance);

  const adjustments: AvmResult["adjustments"] = [];
  let mult = 1;

  const epcAdj = EPC_ADJ[subject.epc] ?? 0;
  if (epcAdj) {
    adjustments.push({ label: `EPC ${subject.epc}`, delta: epcAdj, note: "Energy rating premium / discount vs band D anchor." });
    mult *= 1 + epcAdj;
  }

  const condAdj = ((subject.conditionScore - 5) / 5) * 0.06;
  if (Math.abs(condAdj) > 0.001) {
    adjustments.push({ label: `Condition ${subject.conditionScore}/10`, delta: condAdj, note: "Adjustment for property condition vs area average." });
    mult *= 1 + condAdj;
  }

  if (subject.tenure === "Leasehold") {
    const ly = subject.leaseYears ?? 99;
    let leaseAdj = 0;
    if (ly < 70) leaseAdj = -0.18;
    else if (ly < 80) leaseAdj = -0.10;
    else if (ly < 90) leaseAdj = -0.04;
    else if (ly < 100) leaseAdj = -0.02;
    if (leaseAdj) {
      adjustments.push({ label: `Lease ${ly} yrs`, delta: leaseAdj, note: "Discount applied for shortening lease and marriage value risk." });
      mult *= 1 + leaseAdj;
    }
  }

  const age = new Date().getFullYear() - subject.yearBuilt;
  if (age > 80 && subject.conditionScore < 7) {
    adjustments.push({ label: `Pre-1945 build`, delta: -0.025, note: "Older un-renovated stock typically commands a small discount." });
    mult *= 0.975;
  }

  const adjustedPpsf = meanPpsf * mult;
  const p50 = Math.round(adjustedPpsf * subject.sqft);
  const ciPct = Math.min(0.25, (stdDev / Math.max(meanPpsf, 1)) + 0.03);
  const p10 = Math.round(p50 * (1 - ciPct));
  const p90 = Math.round(p50 * (1 + ciPct));

  // Confidence is downgraded if we don't meet the minComps floor
  const meetsFloor = comps.length >= criteria.minComps;
  const confidence: AvmResult["confidence"] =
    meetsFloor && ciPct < 0.07 ? "high" :
    comps.length >= 3 && ciPct < 0.12 ? "medium" : "low";

  return {
    p10, p50, p90,
    pricePerSqft: Math.round(adjustedPpsf),
    confidence, comps, rejectedComps, similarity: criteria, minCompsUsed, adjustments,
    asOf: new Date().toISOString().slice(0, 10),
  };
};

// Automated comparable-sales lookup. In production this hits HM Land Registry
// Price Paid Data + EPC Open Data + Royal Mail PAF for the subject postcode
// district. Here we generate a deterministic synthetic pool large enough that
// the similarity filter can always meaningfully prune it.
export const buildComparables = (
  areaPpsfSeed: number,
  subjectSqft: number,
  count = 14,
  seed = "default",
): Comparable[] => {
  // Deterministic pseudo-random based on string seed
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const rand = () => {
    h = (h * 1664525 + 1013904223) | 0;
    return (h >>> 0) / 0xffffffff;
  };

  const epcs = ["B", "C", "C", "D", "D", "E"];
  const out: Comparable[] = [];
  for (let i = 0; i < count; i++) {
    const sqft = Math.round(subjectSqft * (0.6 + rand() * 0.8));   // 60%–140%
    const noise = 0.88 + rand() * 0.24;
    const ppsf = areaPpsfSeed * noise;
    const monthsAgo = Math.round(rand() * 30);                      // up to 30mo
    const d = new Date(); d.setMonth(d.getMonth() - monthsAgo);
    out.push({
      id: `cmp-${i}`,
      address: `${10 + Math.round(rand() * 200)} ${["Maple", "Oak", "Beech", "Cedar", "Elm", "Holly"][i % 6]} ${["Road", "Grove", "Mews", "Way"][i % 4]}`,
      soldPrice: Math.round(ppsf * sqft),
      soldDate: d.toISOString().slice(0, 10),
      sqft,
      beds: Math.max(1, Math.round(sqft / 350)),
      epc: epcs[i % epcs.length],
      tenure: rand() > 0.5 ? "Freehold" : "Leasehold",
      distanceMiles: Math.round(rand() * 120) / 100,                // up to 1.2mi
    });
  }
  return out;
};
