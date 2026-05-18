// Right-fit score: matches a property/area to the buyer's lifestyle priorities.
// Designed for first-time buyers and second-home buyers - turns subjective "feel"
// into a transparent, weighted score they can defend.

export type Lifestyle =
  | "city_pro" | "young_family" | "growing_family"
  | "downsizer" | "remote_worker" | "investor";

export interface Priorities {
  commute: number;       // 0-10 importance
  schools: number;
  greenSpace: number;
  nightlife: number;
  safety: number;
  affordability: number;
  spaceInside: number;
  futureGrowth: number;
}

export const DEFAULT_PRIORITIES: Record<Lifestyle, Priorities> = {
  city_pro:       { commute: 9, schools: 2, greenSpace: 5, nightlife: 8, safety: 6, affordability: 6, spaceInside: 4, futureGrowth: 7 },
  young_family:   { commute: 6, schools: 9, greenSpace: 8, nightlife: 2, safety: 9, affordability: 7, spaceInside: 8, futureGrowth: 7 },
  growing_family: { commute: 5, schools: 10, greenSpace: 8, nightlife: 1, safety: 9, affordability: 6, spaceInside: 10, futureGrowth: 6 },
  downsizer:      { commute: 3, schools: 1, greenSpace: 7, nightlife: 4, safety: 9, affordability: 8, spaceInside: 6, futureGrowth: 4 },
  remote_worker:  { commute: 2, schools: 4, greenSpace: 9, nightlife: 5, safety: 7, affordability: 8, spaceInside: 9, futureGrowth: 6 },
  investor:       { commute: 7, schools: 6, greenSpace: 4, nightlife: 5, safety: 7, affordability: 8, spaceInside: 5, futureGrowth: 10 },
};

export interface PropertyFit {
  id: string;
  name: string;       // address or area
  scores: {
    commute: number; schools: number; greenSpace: number;
    nightlife: number; safety: number; affordability: number;
    spaceInside: number; futureGrowth: number;
  }; // 0-100 each
}

export interface FitResult {
  total: number;
  breakdown: { key: keyof Priorities; label: string; score: number; weight: number; contribution: number }[];
  strengths: string[];
  weaknesses: string[];
}

const LABELS: Record<keyof Priorities, string> = {
  commute: "Commute",
  schools: "Schools",
  greenSpace: "Green space",
  nightlife: "Nightlife & culture",
  safety: "Safety",
  affordability: "Affordability",
  spaceInside: "Internal space",
  futureGrowth: "Future growth",
};

export const computeFit = (p: PropertyFit, prio: Priorities): FitResult => {
  const totalWeight = Object.values(prio).reduce((s, v) => s + v, 0) || 1;
  const breakdown = (Object.keys(LABELS) as (keyof Priorities)[]).map((k) => {
    const score = p.scores[k] ?? 50;
    const weight = prio[k];
    const contribution = (score * weight) / totalWeight;
    return { key: k, label: LABELS[k], score, weight, contribution };
  });
  const total = Math.round(breakdown.reduce((s, b) => s + b.contribution, 0));
  const strengths = breakdown
    .filter((b) => b.score >= 75 && b.weight >= 6)
    .map((b) => `${b.label} (${b.score}/100)`);
  const weaknesses = breakdown
    .filter((b) => b.score <= 50 && b.weight >= 6)
    .map((b) => `${b.label} (${b.score}/100)`);
  return { total, breakdown, strengths, weaknesses };
};
