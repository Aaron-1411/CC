// UK eligibility / opportunity engine. Returns prioritised actions based on user state.
import type { AppState } from "./store";
import { UK, computeTakeHome } from "./uk-tax";

export type EligibilityStatus = "eligible" | "review" | "not-eligible";

export interface Opportunity {
  id: string;
  title: string;
  status: EligibilityStatus;
  category: "ISA" | "Pension" | "Tax" | "Property" | "Family" | "Savings";
  summary: string;
  details: string;
  potentialBenefit?: string;
  ctaRoute?: string;
}

export function computeOpportunities(s: AppState): Opportunity[] {
  const out: Opportunity[] = [];
  const { profile } = s;
  const isaUsed = s.isas.reduce((a, i) => a + i.thisYearContribution, 0);
  const isaRemaining = Math.max(0, UK.isaAllowance - isaUsed);
  const lisa = s.isas.find((i) => i.type === "lisa");
  const lisaThisYear = lisa?.thisYearContribution ?? 0;
  const lisaRemaining = Math.max(0, UK.lisaAllowance - lisaThisYear);
  const th = computeTakeHome({
    grossSalary: profile.grossSalary,
    studentLoan: profile.studentLoanPlan,
  });

  // ISA allowance
  out.push({
    id: "isa-allowance",
    title: `Use your £20,000 ISA allowance`,
    status: isaRemaining > 0 ? "eligible" : "not-eligible",
    category: "ISA",
    summary:
      isaRemaining > 0
        ? `You have £${isaRemaining.toLocaleString()} of unused ISA allowance this tax year.`
        : "You've maxed your ISA allowance for this tax year — well done.",
    details:
      "Every UK adult can shelter £20,000/year across Stocks & Shares, Cash, Lifetime and Innovative Finance ISAs. Allowance resets every 6 April and doesn't roll over.",
    potentialBenefit: isaRemaining > 0 ? `Tax-free growth on up to £${isaRemaining.toLocaleString()}` : undefined,
    ctaRoute: "/isas",
  });

  // LISA — eligibility 18-39 to open, contributions until 50
  const lisaEligibleAge = profile.age >= 18 && profile.age < 40;
  out.push({
    id: "lisa",
    title: "Lifetime ISA — 25% government bonus",
    status: lisaEligibleAge ? "eligible" : profile.age < 50 && lisa ? "review" : "not-eligible",
    category: "ISA",
    summary: lisaEligibleAge
      ? `Contribute up to £${lisaRemaining.toLocaleString()} more this year for up to £${(lisaRemaining * 0.25).toFixed(0)} bonus.`
      : "LISA must be opened before age 40. Existing holders can contribute until 50.",
    details:
      "Pay in up to £4,000/year (counts within £20k ISA cap). HMRC adds 25%. Use for first home (≤£450k) or after age 60 — otherwise 25% withdrawal penalty applies.",
    potentialBenefit: `Up to £1,000/year free money`,
    ctaRoute: "/isas",
  });

  // Help to Buy ISA — closed to new accounts since Nov 2019; existing can contribute to Nov 2029
  if (s.isas.some((i) => i.type === "h2b")) {
    out.push({
      id: "h2b",
      title: "Help to Buy ISA — claim by Dec 2030",
      status: "review",
      category: "Property",
      summary: "Existing H2B holders can contribute until Nov 2029 and claim the bonus by Dec 2030.",
      details:
        "25% bonus on savings up to £12,000 (max £3,000 bonus). Property cap £250k (£450k London). You can transfer H2B into a LISA before the deadline.",
      ctaRoute: "/isas",
    });
  }

  // Higher-rate pension relief opportunity
  if (th.bands.higher > 0 || th.bands.additional > 0) {
    out.push({
      id: "pension-higher",
      title: "Boost pension to escape the 40% band",
      status: "eligible",
      category: "Pension",
      summary: `£${th.bands.higher.toLocaleString(undefined,{maximumFractionDigits:0})} of your income sits in the 40% band. Pension contributions get full marginal-rate relief.`,
      details:
        "Salary sacrifice or relief-at-source — both reduce higher-rate tax. £1 sacrificed costs you ~58p take-home but adds £1 (plus employer match) to your pot.",
      potentialBenefit: `Save up to ${(0.4 + 0.02).toFixed(2)} pence in tax+NI per £1 sacrificed`,
      ctaRoute: "/pensions",
    });
  }

  // Annual allowance check
  const totalPensionAnnual = s.pensions.reduce(
    (a, p) => a + (p.monthlyOwn + p.monthlyEmployer) * 12,
    0,
  );
  if (totalPensionAnnual > UK.annualAllowance * 0.8) {
    out.push({
      id: "aa",
      title: "Watch the £60,000 Annual Allowance",
      status: "review",
      category: "Pension",
      summary: `You're contributing ~£${totalPensionAnnual.toLocaleString(undefined,{maximumFractionDigits:0})}/yr across all pensions.`,
      details: "Exceeding £60k (or tapered amount if income > £260k) triggers an AA charge. Carry-forward unused allowance from last 3 years if available.",
      ctaRoute: "/pensions",
    });
  }

  // Personal Savings Allowance
  out.push({
    id: "psa",
    title: "Personal Savings Allowance",
    status: "eligible",
    category: "Savings",
    summary:
      th.bands.higher > 0
        ? "As a higher-rate taxpayer, your PSA is £500/year of tax-free interest."
        : "As a basic-rate taxpayer, you get £1,000/year of tax-free interest.",
    details:
      "Interest from non-ISA savings within the PSA is tax-free. Above this, taxed at your marginal rate — moving cash into a Cash ISA can shelter it.",
    ctaRoute: "/savings",
  });

  // Marriage Allowance
  if (profile.marriedOrCivilPartner && profile.partnerLowerEarner && th.bands.higher === 0) {
    out.push({
      id: "marriage",
      title: "Claim the Marriage Allowance",
      status: "eligible",
      category: "Family",
      summary: "Lower-earning partner can transfer £1,260 of personal allowance to you.",
      details:
        "Worth up to £252/year. Eligible if recipient is a basic-rate taxpayer and partner earns below the personal allowance. Backdate up to 4 tax years.",
      potentialBenefit: "Up to £252/year",
    });
  }

  // First-time buyer SDLT relief
  if (profile.isFirstTimeBuyer) {
    out.push({
      id: "ftb-sdlt",
      title: "First-time buyer Stamp Duty relief",
      status: "eligible",
      category: "Property",
      summary: "No SDLT on first £300,000; 5% on portion £300k–£500k. Property must be ≤£500k.",
      details:
        "Available to individuals buying their first home in England/NI. Doesn't apply if either buyer has previously owned property anywhere in the world.",
      ctaRoute: "/mortgage",
    });
  }

  // Child Benefit High Income tax charge
  if (profile.hasChildren && profile.grossSalary > 60000) {
    out.push({
      id: "hicbc",
      title: "High Income Child Benefit Charge",
      status: "review",
      category: "Family",
      summary: "Charge applies between £60k–£80k adjusted net income (2025/26 rules).",
      details:
        "1% of Child Benefit per £200 over £60k; fully clawed back at £80k. Pension contributions reduce 'adjusted net income' — useful lever.",
    });
  }

  // CGT allowance
  out.push({
    id: "cgt",
    title: "£3,000 Capital Gains Tax allowance",
    status: "eligible",
    category: "Tax",
    summary: "Realise up to £3,000 of gains tax-free per year outside ISAs.",
    details:
      "Use 'Bed & ISA' to crystallise gains within allowance and re-buy inside an ISA — locking in tax-free future growth. Allowance doesn't carry over.",
  });

  // Emergency fund check
  const cash = s.savings.reduce((a, x) => a + x.balance, 0);
  const monthlyEssentials = th.takeHome * 0.6;
  if (cash < monthlyEssentials * 3) {
    out.push({
      id: "ef",
      title: "Build a 3–6 month emergency fund",
      status: "review",
      category: "Savings",
      summary: `You have £${cash.toLocaleString(undefined,{maximumFractionDigits:0})} in cash — target ~£${(monthlyEssentials*3).toLocaleString(undefined,{maximumFractionDigits:0})}.`,
      details:
        "Hold easy-access cash before locking funds away in pensions/investments. A high-interest Cash ISA or easy-access account works well.",
      ctaRoute: "/savings",
    });
  }

  return out;
}
