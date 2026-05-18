// Leasehold deep-dive calculators.
// - Lease-extension premium estimator using the Leasehold Reform Act 1993
//   simplified formula (term + reversion + marriage value when <80yrs).
// - Ground rent escalation modeller (fixed, doubling, RPI-linked).
// These are indicative; a formal valuation is required for statutory claims.

export interface LeaseInput {
  currentLeaseYears: number;       // years remaining
  propertyValueFreehold: number;   // estimated FH value
  groundRentAnnual: number;
  groundRentReviewType: "fixed" | "doubling25" | "rpi" | "doubling10";
}

export interface LeaseExtensionResult {
  premium: number;
  marriageValueApplies: boolean;
  newLeaseYears: number;           // existing + 90
  noteworthy: string[];
}

// Capitalisation rate (Tribunal-typical 5%) and deferment rate (5% — Sportelli).
const CAP_RATE = 0.05;
const DEFERMENT_RATE = 0.05;

function reversionValue(fhValue: number, years: number) {
  return fhValue / Math.pow(1 + DEFERMENT_RATE, years);
}

function termValue(rent: number, years: number) {
  if (rent <= 0 || years <= 0) return 0;
  return rent * (1 - Math.pow(1 + CAP_RATE, -years)) / CAP_RATE;
}

// Relativity: simplified Savills 2002 graph (no Act assumption)
function relativity(years: number): number {
  if (years >= 80) return 0.96;
  if (years >= 70) return 0.91;
  if (years >= 60) return 0.85;
  if (years >= 50) return 0.77;
  if (years >= 40) return 0.68;
  return 0.55;
}

export function estimateLeaseExtension(input: LeaseInput): LeaseExtensionResult {
  const fh = input.propertyValueFreehold;
  const y = input.currentLeaseYears;
  const newY = y + 90;

  const reversionNow = reversionValue(fh, y);
  const reversionAfter = reversionValue(fh, newY);
  const term = termValue(input.groundRentAnnual, y);

  const lhValueExisting = relativity(y) * fh;
  const lhValueExtended = 0.99 * fh; // after extension: peppercorn, ~FH

  const marriageValueApplies = y < 80;
  const marriageValue = marriageValueApplies
    ? Math.max(0, (lhValueExtended + fh - reversionAfter) - (lhValueExisting + fh - reversionNow)) * 0.5
    : 0;

  const landlordLoss = (reversionNow - reversionAfter) + term;
  const premium = Math.max(0, Math.round(landlordLoss + marriageValue));

  const notes: string[] = [];
  if (y < 80) notes.push("Lease under 80 years — marriage value applies, premium rises sharply.");
  if (y < 60) notes.push("Lease under 60 years — most lenders refuse mortgages until extended.");
  if (input.groundRentAnnual > fh * 0.001) notes.push("Ground rent above 0.1% of value may breach lender criteria.");
  if (input.groundRentReviewType === "doubling10") notes.push("Doubling every 10y — likely an unmortgageable 'toxic' lease.");
  if (input.groundRentReviewType === "doubling25") notes.push("Doubling every 25y — acceptable to most lenders but reduces resale.");

  return { premium, marriageValueApplies, newLeaseYears: newY, noteworthy: notes };
}

export function projectGroundRent(input: LeaseInput, years = 30): { year: number; rent: number }[] {
  const out: { year: number; rent: number }[] = [];
  let rent = input.groundRentAnnual;
  for (let y = 0; y <= years; y++) {
    out.push({ year: y, rent: Math.round(rent) });
    if (input.groundRentReviewType === "doubling10" && y > 0 && y % 10 === 0) rent *= 2;
    if (input.groundRentReviewType === "doubling25" && y > 0 && y % 25 === 0) rent *= 2;
    if (input.groundRentReviewType === "rpi") rent *= 1.03;
  }
  return out;
}
