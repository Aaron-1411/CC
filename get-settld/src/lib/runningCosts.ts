// Estimated annual running costs: energy (Ofgem cap × EPC band), council tax
// (band × LA average from MHCLG 2024–25), buildings + contents insurance
// (ABI average by region & rebuild value).

export type EpcBand = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type CouncilTaxBand = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

// kWh/sqm/yr typical primary energy demand by band (BRE/DEFRA SAP averages)
const KWH_BY_BAND: Record<EpcBand, number> = {
  A: 60, B: 110, C: 170, D: 230, E: 310, F: 410, G: 540,
};

// Ofgem cap (Q3 2025): ~28p/kWh blended (gas+elec mix).
const ENERGY_PRICE_PER_KWH = 0.28;

export function estimateAnnualEnergy(sqft: number, band: EpcBand): number {
  const sqm = sqft / 10.7639;
  return Math.round(sqm * KWH_BY_BAND[band] * ENERGY_PRICE_PER_KWH);
}

// England average council tax 2024–25 by band (MHCLG)
const COUNCIL_TAX_AVG: Record<CouncilTaxBand, number> = {
  A: 1493, B: 1742, C: 1991, D: 2240, E: 2738, F: 3236, G: 3733, H: 4480,
};

export function estimateCouncilTax(band: CouncilTaxBand, regionMultiplier = 1): number {
  return Math.round(COUNCIL_TAX_AVG[band] * regionMultiplier);
}

// ABI: buildings ~£0.18 per £1k rebuild, contents ~£140 average
export function estimateInsurance(rebuildCost: number, contents = 30000): {
  buildings: number; contents: number; total: number;
} {
  const buildings = Math.round(rebuildCost * 0.00018);
  const contentsAnnual = Math.round(140 + (contents - 30000) * 0.003);
  return { buildings, contents: Math.max(80, contentsAnnual), total: buildings + Math.max(80, contentsAnnual) };
}

// Rough rebuild cost: BCIS national average ~£1,800/sqm = £167/sqft (2024).
export function estimateRebuildCost(sqft: number): number {
  return Math.round(sqft * 167);
}
