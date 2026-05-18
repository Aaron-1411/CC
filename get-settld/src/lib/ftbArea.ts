// Plain-English helpers for first-time buyers.
// All numbers are indicative — surface alongside FreshnessPill / methodology.

export function ftbDeposit(price: number, ltv = 90): number {
  return Math.round(price * (1 - ltv / 100));
}

// SDLT for FTBs in England & NI (Apr 2025 rules):
// 0% to £300k, 5% on £300k–£500k, no relief above £500k (full standard rates apply).
export function ftbStampDuty(price: number): number {
  if (price <= 300_000) return 0;
  if (price <= 500_000) return Math.round((price - 300_000) * 0.05);
  // Above £500k: standard rates apply (no FTB relief).
  let tax = 0;
  const bands: [number, number][] = [
    [125_000, 0],
    [125_000, 0.02], // 125k–250k
    [675_000, 0.05], // 250k–925k
    [575_000, 0.10], // 925k–1.5m
    [Infinity, 0.12],
  ];
  let remaining = price;
  for (const [size, rate] of bands) {
    const slice = Math.min(remaining, size);
    tax += slice * rate;
    remaining -= slice;
    if (remaining <= 0) break;
  }
  return Math.round(tax);
}

// Monthly capital + interest payment.
export function ftbMonthly(price: number, ratePct: number, years = 30, ltv = 90): number {
  const principal = price * (ltv / 100);
  const r = ratePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(principal / n);
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -n)));
}

export function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}
