// UK property purchase taxes - England (SDLT), Scotland (LBTT), Wales (LTT)
// Includes first-time buyer relief, additional dwelling surcharge (BTL/2nd home)
// and non-resident surcharge (England/NI only).

export type Region = "england" | "scotland" | "wales" | "ni";

export interface TaxInputs {
  price: number;
  region: Region;
  isFTB: boolean;
  isAdditional: boolean;   // BTL or 2nd home
  isNonResident: boolean;  // overseas buyer (Eng/NI only adds 2%)
}

interface Band { from: number; rate: number; }

const SDLT_STD: Band[] = [
  { from: 0, rate: 0 },
  { from: 250_000, rate: 0.05 },
  { from: 925_000, rate: 0.10 },
  { from: 1_500_000, rate: 0.12 },
];
const SDLT_FTB: Band[] = [
  { from: 0, rate: 0 },
  { from: 300_000, rate: 0.05 },
  // FTB relief vanishes above £500k → fall back to standard
];
const LBTT: Band[] = [
  { from: 0, rate: 0 },
  { from: 145_000, rate: 0.02 },
  { from: 250_000, rate: 0.05 },
  { from: 325_000, rate: 0.10 },
  { from: 750_000, rate: 0.12 },
];
const LBTT_FTB: Band[] = [
  { from: 0, rate: 0 },
  { from: 175_000, rate: 0.02 },
  { from: 250_000, rate: 0.05 },
  { from: 325_000, rate: 0.10 },
  { from: 750_000, rate: 0.12 },
];
const LTT: Band[] = [
  { from: 0, rate: 0 },
  { from: 225_000, rate: 0.06 },
  { from: 400_000, rate: 0.075 },
  { from: 750_000, rate: 0.10 },
  { from: 1_500_000, rate: 0.12 },
];

const applyBands = (price: number, bands: Band[]): number => {
  let tax = 0;
  for (let i = 0; i < bands.length; i++) {
    const lo = bands[i].from;
    const hi = i + 1 < bands.length ? bands[i + 1].from : Infinity;
    if (price <= lo) break;
    const slice = Math.min(price, hi) - lo;
    tax += slice * bands[i].rate;
  }
  return tax;
};

export interface TaxBreakdown {
  label: string;        // SDLT / LBTT / LTT
  base: number;
  surchargeAdditional: number;
  surchargeNonResident: number;
  total: number;
  effectiveRatePct: number;
  notes: string[];
}

export const computePurchaseTax = (i: TaxInputs): TaxBreakdown => {
  const notes: string[] = [];
  let base = 0;
  let label = "SDLT";
  if (i.region === "scotland") {
    label = "LBTT";
    const useFtb = i.isFTB && i.price <= 175_000 + 1; // FTB relief applies to first £175k threshold
    base = applyBands(i.price, useFtb ? LBTT_FTB : LBTT);
    if (i.isFTB) notes.push("LBTT first-time buyer relief raises 0% threshold to £175k.");
  } else if (i.region === "wales") {
    label = "LTT";
    base = applyBands(i.price, LTT);
    notes.push("Wales LTT has no first-time buyer relief.");
  } else {
    // England / NI
    if (i.isFTB && i.price <= 500_000) {
      base = applyBands(i.price, SDLT_FTB);
      notes.push("FTB relief: 0% to £300k, 5% to £500k. Vanishes above £500k.");
    } else {
      base = applyBands(i.price, SDLT_STD);
    }
  }

  // Additional dwelling surcharge - applies in England/NI (5% from Oct 2024), Scotland ADS (8%), Wales (5%/6% banded - use 5% for simplicity).
  let surchargeAdditional = 0;
  if (i.isAdditional) {
    const rate = i.region === "scotland" ? 0.08 : 0.05;
    surchargeAdditional = i.price * rate;
    notes.push(`Additional dwelling surcharge applied at ${(rate * 100).toFixed(0)}%.`);
  }

  // Non-resident surcharge - England/NI only, 2%
  let surchargeNonResident = 0;
  if (i.isNonResident && (i.region === "england" || i.region === "ni")) {
    surchargeNonResident = i.price * 0.02;
    notes.push("Non-UK resident surcharge of 2% added (England & NI).");
  }

  const total = Math.round(base + surchargeAdditional + surchargeNonResident);
  return {
    label,
    base: Math.round(base),
    surchargeAdditional: Math.round(surchargeAdditional),
    surchargeNonResident: Math.round(surchargeNonResident),
    total,
    effectiveRatePct: i.price > 0 ? +((total / i.price) * 100).toFixed(2) : 0,
    notes,
  };
};
