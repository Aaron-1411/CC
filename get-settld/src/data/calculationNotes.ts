import { MetricKey } from "@/data/areas";

export interface CalculationNote {
  /** Plain-English summary of what this score represents. */
  summary: string;
  /** Primary formula(s). Use plain text - rendered in <code>. */
  formulas: string[];
  /** Bullet list of assumptions / inputs / caveats. */
  assumptions: string[];
  /** Step-by-step normalization to the final 0–10 / 0–100 scale. */
  normalization: string[];
  /** Worked example showing the calc end-to-end. */
  example?: { inputs: string[]; result: string };
}

export const CALC_NOTES: Record<MetricKey, CalculationNote> = {
  medianPrice: {
    summary: "Headline asking price benchmark used for affordability and value-gap calculations.",
    formulas: [
      "medianPrice = median( salePrice for all completed sales in last 12 months, postcode district )",
    ],
    assumptions: [
      "Excludes new-build first-sale uplifts (CASKEY new-build flag).",
      "Min sample = 30 sales/year. Falls back to LA-level median below threshold.",
      "Currency: GBP, not inflation-adjusted.",
    ],
    normalization: [
      "Raw £ value displayed as-is (no rescaling).",
      "Used downstream by valueGap = (regionMedian − areaMedian) / regionMedian.",
    ],
    example: {
      inputs: ["Sales (12m) = 412", "Median = £612,000"],
      result: "£612,000",
    },
  },
  growth5y: {
    summary: "Cumulative price growth over the latest 5 published HPI years.",
    formulas: [
      "growth5y % = (HPI_now / HPI_5yr_ago − 1) × 100",
      "CAGR % = ((1 + growth5y/100)^(1/5) − 1) × 100",
    ],
    assumptions: [
      "Uses ONS UK HPI local-authority series (not nominal sale prices).",
      "Outliers > ±50% YoY are winsorised to the regional 95th percentile.",
    ],
    normalization: [
      "Reported as raw % for headline; CAGR derived for the investment score.",
      "Regional benchmarks fall back to NUTS-2 series when LA series < 5y.",
    ],
    example: {
      inputs: ["HPI 2020 = 118.4", "HPI 2025 = 142.1"],
      result: "+20.0% cumulative · 3.7% CAGR",
    },
  },
  yield: {
    summary: "Gross rental yield - annualised rent divided by purchase price.",
    formulas: [
      "yield % = (medianRent_2bed × 12) / medianPrice_2bed × 100",
    ],
    assumptions: [
      "2-bed used as a comparable mid-market unit; adjusted to area dominant type if 2-bed sample < 30.",
      "Gross only - does not deduct voids, management, maintenance, tax.",
      "Rent series blends ONS PRMS + Zoopla advertised rents (50/50).",
    ],
    normalization: [
      "Capped at [1.5%, 12%] to suppress sample noise.",
      "Confidence downgraded to 'medium' wherever blend is required.",
    ],
    example: {
      inputs: ["Median 2-bed rent = £1,650/m", "Median 2-bed price = £385,000"],
      result: "5.1% gross yield",
    },
  },
  crime: {
    summary: "All-crime offences per 1,000 residents, 12-month rolling.",
    formulas: [
      "crimePer1k = (totalOffences_12m / midyearPopulation) × 1000",
    ],
    assumptions: [
      "Aggregated to LSOA, then population-weighted to the named area.",
      "Includes ASB; excludes fraud (recorded centrally, not geocoded).",
      "Population from ONS mid-year estimates, latest available.",
    ],
    normalization: [
      "Lower is better - inverted for the composite investment score.",
      "Score10 = clamp( 10 − (crimePer1k / regionalP90) × 10, 0, 10 ).",
    ],
    example: {
      inputs: ["Offences 12m = 1,840", "Population = 24,500"],
      result: "75 / 1,000",
    },
  },
  schools: {
    summary: "Catchment school quality on a 1–10 scale.",
    formulas: [
      "schools = 0.5 × ofstedScore + 0.3 × progress8Score + 0.2 × pctOutstandingScore",
    ],
    assumptions: [
      "Ofsted grades mapped: Outstanding=10, Good=7.5, RI=4, Inadequate=1.",
      "Progress 8 normalised to 0–10 within country (z-score → percentile × 10).",
      "Catchment defined as schools within 1 km (primary) and 2 km (secondary).",
    ],
    normalization: [
      "Each input rescaled to [0,10] before weighting.",
      "Final value rounded to one decimal.",
    ],
    example: {
      inputs: ["Ofsted blend = 8.2", "P8 percentile = 78 → 7.8", "% Outstanding = 30 → 6.0"],
      result: "7.8 / 10",
    },
  },
  transport: {
    summary: "Public transport accessibility on a 1–10 scale.",
    formulas: [
      "transport = round( PTAL_index × 10 / PTAL_max, 1 )",
    ],
    assumptions: [
      "Uses DfT PTAL where published (London + major cities); elsewhere uses GB Accessibility Indicators.",
      "Walk-time to nearest stop capped at 12 minutes; service interval capped at 30 min.",
    ],
    normalization: [
      "PTAL_max = 6.5 (top of band 6b).",
      "Sub-score for 'access to opportunities' folded in at 30% weight outside London.",
    ],
    example: {
      inputs: ["PTAL = 5 (Good)", "Sub-score = 6.4"],
      result: "8.1 / 10",
    },
  },
  green: {
    summary: "Access to parks, gardens and tree canopy.",
    formulas: [
      "green = 0.6 × parkScore + 0.4 × canopyScore",
      "parkScore = clamp( hectaresWithin1km / 10, 0, 10 )",
      "canopyScore = clamp( treeCanopyPct / 30 × 10, 0, 10 )",
    ],
    assumptions: [
      "Park hectares from OS Open Greenspace 'Public Park or Garden' polygons only.",
      "Tree canopy from Bluesky NTM (England) / equivalent regional sources.",
    ],
    normalization: [
      "Both inputs rescaled to [0,10] using nationally-calibrated saturation points.",
      "Final value rounded to one decimal.",
    ],
    example: {
      inputs: ["Parks 1km = 14ha → 10.0", "Canopy = 18% → 6.0"],
      result: "8.4 / 10",
    },
  },
  commute: {
    summary: "Indicative door-to-door peak commute times to four destinations.",
    formulas: [
      "commute_min = walkAccess + waitTime + inVehicleTime + interchange + walkEgress",
    ],
    assumptions: [
      "Peak window: 07:30–09:00 weekdays; uses median of 5 sampled departures.",
      "Walking speed 4.8 km/h; waiting time = 0.5 × headway (capped 8 min).",
      "Falls back to TfL Journey Planner (London) and HSP National Rail elsewhere.",
    ],
    normalization: [
      "No rescaling - minutes shown as integers.",
      "Used in investment score as inverse percentile within region.",
    ],
    example: {
      inputs: ["Walk 6 + Wait 4 + Tube 22 + Interchange 3 + Walk 4"],
      result: "39 min to Central London",
    },
  },
  schoolBreakdown: {
    summary: "Per-area Ofsted mix and observed catchment premium.",
    formulas: [
      "schoolImpact = 0.45 × pctOutstandingScore + 0.35 × ofstedBlend + 0.20 × catchmentPremiumScore",
    ],
    assumptions: [
      "Catchment premium = (median price within catchment − borough median) / borough median.",
      "Premium > 25% capped to 25% to dampen luxury postcode skew.",
    ],
    normalization: [
      "Each input rescaled to [0,100] before weighting.",
      "Result rounded to nearest integer; reported as score /100.",
    ],
    example: {
      inputs: ["% Outstanding = 35 → 70", "Ofsted blend = 8.2 → 82", "Premium = 12% → 48"],
      result: "70 / 100",
    },
  },
  investment: {
    summary: "Composite 0–100 score blending price dynamics, demand, and macro signals.",
    formulas: [
      "investment = 0.25·growthScore + 0.20·yieldScore + 0.15·valueGapScore + 0.15·demandScore + 0.10·voidScore + 0.10·regenScore + 0.05·affordabilityScore",
    ],
    assumptions: [
      "Each input z-scored within region, then mapped to 0–100 via percentile.",
      "Voids (weeks/year) inverted - fewer voids → higher score.",
      "Affordability = price ÷ local median household income; lower is better.",
    ],
    normalization: [
      "Sub-scores clamped to [0,100] after percentile mapping.",
      "Synthetic / benchmark areas inherit the regional median sub-scores (confidence: low).",
      "Final score rounded to nearest integer.",
    ],
    example: {
      inputs: [
        "Growth 78 · Yield 64 · Value-gap 55",
        "Demand 72 · Voids 60 · Regen 80 · Afford. 40",
      ],
      result: "67 / 100",
    },
  },
};
