// One-click CSV + JSON export for the True Cost report. PDF is intentionally
// kept out of this lib to avoid pulling jsPDF on a non-PDF page; users who
// want PDF can use the browser print dialog from the export menu.
import { fmtFull } from "@/lib/format";

export interface TrueCostSnapshot {
  price: number;
  deposit: number;
  region: string;
  isFTB: boolean;
  isAdditional: boolean;
  nonResident: boolean;
  cashItems: { label: string; v: number }[];
  cashContingency: number;
  cashTotal: number;
  taxLabel: string;
  taxBase: number;
  taxSurchargeAdditional: number;
  taxSurchargeNonResident: number;
  taxEffectivePct: number;
  yearOneItems: { label: string; v: number }[];
  yearOneTotal: number;
  lifetimeYears: number;
  lifetimeRunning: number;
  lifetimeMortgageInterest: number;
  lifetimeTotal: number;
}

export function trueCostToCSV(s: TrueCostSnapshot): string {
  const rows: string[][] = [];
  const push = (...c: (string | number)[]) => rows.push(c.map((x) => `"${String(x).replace(/"/g, '""')}"`));
  push("First-Time Buyer Toolkit", "True Cost report");
  push("Generated", new Date().toISOString());
  push("");
  push("Inputs");
  push("Property price", s.price);
  push("Deposit", s.deposit);
  push("Region", s.region);
  push("First-time buyer", s.isFTB ? "yes" : "no");
  push("Additional property", s.isAdditional ? "yes" : "no");
  push("Non-UK resident", s.nonResident ? "yes" : "no");
  push("");
  push("Cash needed at completion");
  s.cashItems.forEach((i) => push(i.label, i.v));
  push("Contingency", s.cashContingency);
  push("Total cash", s.cashTotal);
  push("");
  push(`${s.taxLabel} breakdown`);
  push("Base", s.taxBase);
  push("Additional surcharge", s.taxSurchargeAdditional);
  push("Non-resident surcharge", s.taxSurchargeNonResident);
  push("Effective rate (%)", s.taxEffectivePct.toFixed(2));
  push("");
  push("Year 1 running costs");
  s.yearOneItems.forEach((i) => push(i.label, i.v));
  push("Year-1 total", s.yearOneTotal);
  push("");
  push(`Lifetime view (${s.lifetimeYears} years)`);
  push("Running costs (with inflation)", s.lifetimeRunning);
  push("Mortgage interest", s.lifetimeMortgageInterest);
  push("Lifetime total", s.lifetimeTotal);
  return rows.map((r) => r.join(",")).join("\n");
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Inflate annual running costs over N years at the given rate. */
export function projectRunningCosts(yearOne: number, years: number, inflationPct = 3): number {
  const r = inflationPct / 100;
  if (Math.abs(r) < 1e-9) return yearOne * years;
  return Math.round(yearOne * (Math.pow(1 + r, years) - 1) / r);
}

/** Total interest paid over N years on a fixed-rate amortising loan. */
export function projectMortgageInterest(loan: number, ratePct: number, termYears: number, years: number): number {
  if (loan <= 0 || ratePct <= 0) return 0;
  const r = ratePct / 100 / 12;
  const n = termYears * 12;
  const m = (loan * r) / (1 - Math.pow(1 + r, -n));
  let bal = loan;
  let interest = 0;
  const months = Math.min(years * 12, n);
  for (let k = 0; k < months; k++) {
    const i = bal * r;
    const p = m - i;
    interest += i;
    bal -= p;
    if (bal <= 0) break;
  }
  return Math.round(interest);
}
