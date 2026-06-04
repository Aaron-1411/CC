import { UK_FIGURES } from "../../content/constants";

// Pure UK tax/NI/SDLT maths. EVERY figure comes from UK_FIGURES (verified
// against gov.uk for the current tax year) — no magic numbers here.
// England, Wales & Northern Ireland Income Tax; Scotland differs (noted in
// lessons). Figures are annual unless stated.

export function personalAllowance(salary: number): number {
  const { personalAllowance: pa, personalAllowanceTaperThreshold: taper } = UK_FIGURES.incomeTax;
  if (salary <= taper) return pa;
  const reduction = Math.floor((salary - taper) / 2);
  return Math.max(0, pa - reduction);
}

export function incomeTax(salary: number): number {
  const f = UK_FIGURES.incomeTax;
  const taxable = Math.max(0, salary - personalAllowance(salary));
  const basic = Math.min(taxable, f.basicRateBandUpper) * f.basicRate;
  const higher =
    Math.max(0, Math.min(taxable, f.higherRateBandUpper) - f.basicRateBandUpper) * f.higherRate;
  const additional = Math.max(0, taxable - f.higherRateBandUpper) * f.additionalRate;
  return basic + higher + additional;
}

export function employeeNI(salary: number): number {
  const f = UK_FIGURES.nationalInsurance;
  const main =
    Math.max(0, Math.min(salary, f.upperEarningsLimitAnnual) - f.primaryThresholdAnnual) *
    f.employeeMainRate;
  const upper = Math.max(0, salary - f.upperEarningsLimitAnnual) * f.employeeUpperRate;
  return main + upper;
}

export function employerNI(salary: number): number {
  const f = UK_FIGURES.nationalInsurance;
  return Math.max(0, salary - f.secondaryThresholdAnnual) * f.employerRate;
}

/** Stamp Duty Land Tax (England & NI), residential main home. */
export function stampDuty(price: number, firstTimeBuyer: boolean): number {
  const p = UK_FIGURES.property;
  if (firstTimeBuyer && price <= p.sdltFirstTimeBuyerMaxPrice) {
    // 0% up to the FTB threshold, 5% on the slice above it.
    return Math.max(0, price - p.sdltFirstTimeBuyerThreshold) * 0.05;
  }
  let tax = 0;
  let prev = 0;
  for (const band of p.sdltBands) {
    const upper = band.upTo ?? Infinity;
    if (price <= prev) break;
    tax += (Math.min(price, upper) - prev) * band.rate;
    prev = upper;
  }
  return tax;
}

/** Standard monthly repayment-mortgage payment. */
export function monthlyMortgagePayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}
