// Mortgage in Principle readiness scorer.
// Rule-based, deterministic — uses published high-street lender criteria.
// Sources: Nationwide, Halifax, Santander, NatWest, Skipton 99% LTV product
// criteria as of 2025. Used as a soft pre-flight, not a regulated decision.

export type Employment = "employed" | "selfEmployed" | "contract" | "other";
export type CreditBand = "excellent" | "good" | "fair" | "poor" | "unknown";
export type DepositSource = "savings" | "gift" | "lisa" | "equity" | "mixed";

export interface MipInput {
  // Affordability
  grossAnnualIncome: number;     // sum of all applicants
  monthlyDebtPayments: number;   // credit cards, loans, BNPL, car finance
  dependants: number;
  employment: Employment;
  monthsInRole: number;
  // Deposit
  depositAmount: number;
  propertyPrice: number;
  depositSource: DepositSource;
  // Risk
  creditBand: CreditBand;
  missedPaymentsLast12m: number;
  bankruptOrIVA: boolean;
  ukResidentYears: number;
}

export interface LenderVerdict {
  name: string;
  status: "likely" | "borderline" | "unlikely";
  reason: string;
}

export interface MipResult {
  borrowingMultiple: number;       // estimated × income
  estimatedMaxBorrow: number;
  ltv: number;                      // loan / price
  lendersLikely: number;
  lendersBorderline: number;
  lendersUnlikely: number;
  lenders: LenderVerdict[];
  flags: string[];                  // user-facing warnings
  strengths: string[];
}

// Standard high-street panel
const LENDERS = [
  "Nationwide", "Halifax", "Santander", "NatWest", "Barclays",
  "HSBC", "Skipton", "Yorkshire BS", "Coventry BS", "Virgin Money",
] as const;

export function scoreMip(input: MipInput): MipResult {
  const ltv = input.propertyPrice > 0
    ? Math.min(0.99, (input.propertyPrice - input.depositAmount) / input.propertyPrice)
    : 0;

  // Income multiple: 4.5× standard, 4.75–5.5× professional/high earners,
  // 4.0× for self-employed <2y. Adjust for debt service.
  let multiple = 4.5;
  if (input.grossAnnualIncome >= 75_000) multiple = 5.0;
  if (input.grossAnnualIncome >= 100_000) multiple = 5.5;
  if (input.employment === "selfEmployed" && input.monthsInRole < 24) multiple = 4.0;
  if (input.employment === "contract" && input.monthsInRole < 12) multiple = 4.0;

  // Deduct 10× monthly debt from borrowing capacity
  const debtDrag = input.monthlyDebtPayments * 12 * 2.5;
  const estimatedMaxBorrow = Math.max(0, input.grossAnnualIncome * multiple - debtDrag);

  const flags: string[] = [];
  const strengths: string[] = [];

  if (ltv > 0.95) flags.push("Above 95% LTV — only Skipton Track Record and a few BS panel lenders.");
  if (ltv > 0.90 && ltv <= 0.95) flags.push("95% LTV — fewer products and rates 0.4–0.8% higher.");
  if (ltv <= 0.85) strengths.push("Strong deposit (≥15%) opens up the full lender market.");
  if (ltv <= 0.75) strengths.push("Excellent LTV — best rates available.");

  if (input.creditBand === "poor") flags.push("Poor credit excludes most high-street lenders — broker route advised.");
  if (input.creditBand === "excellent") strengths.push("Excellent credit unlocks all high-street lenders.");
  if (input.missedPaymentsLast12m > 0) flags.push(`${input.missedPaymentsLast12m} missed payment(s) in last 12m — disclose at MIP.`);
  if (input.bankruptOrIVA) flags.push("Bankruptcy/IVA history — specialist lender only.");

  if (input.employment === "selfEmployed" && input.monthsInRole < 24) {
    flags.push("Self-employed under 2 years — most lenders require 2 SA302s.");
  }
  if (input.depositSource === "gift") flags.push("Gifted deposit — lender will require a gifted-deposit letter.");
  if (input.ukResidentYears < 3) flags.push("UK residency under 3 years — limits the panel; HSBC/Halifax most accommodating.");

  // Per-lender verdict
  const lenders: LenderVerdict[] = LENDERS.map((name) => {
    let score = 100;
    let reason = "Standard criteria met";
    if (ltv > 0.95 && name !== "Skipton") { score -= 60; reason = "Above 95% LTV — outside criteria"; }
    if (ltv > 0.90 && ltv <= 0.95) score -= 20;
    if (input.creditBand === "poor") { score -= 50; reason = "Credit profile below threshold"; }
    if (input.creditBand === "fair") score -= 20;
    if (input.bankruptOrIVA) { score -= 80; reason = "Bankruptcy/IVA history"; }
    if (input.missedPaymentsLast12m >= 2) score -= 30;
    if (input.employment === "selfEmployed" && input.monthsInRole < 24 && name !== "Halifax" && name !== "Nationwide") {
      score -= 30; reason = "Self-employed history insufficient";
    }
    if (input.ukResidentYears < 3 && !["HSBC", "Halifax", "Barclays"].includes(name)) {
      score -= 25;
    }
    const status: LenderVerdict["status"] = score >= 70 ? "likely" : score >= 40 ? "borderline" : "unlikely";
    return { name, status, reason };
  });

  return {
    borrowingMultiple: multiple,
    estimatedMaxBorrow: Math.round(estimatedMaxBorrow / 1000) * 1000,
    ltv,
    lendersLikely: lenders.filter(l => l.status === "likely").length,
    lendersBorderline: lenders.filter(l => l.status === "borderline").length,
    lendersUnlikely: lenders.filter(l => l.status === "unlikely").length,
    lenders,
    flags,
    strengths,
  };
}
