// Strategy & optimisation engine — actionable, prioritised recommendations
// based on the user's full state (profile, accounts, goals).
import type { AppState } from "./store";
import { UK, computeTakeHome, projectGrowth, mortgagePayment } from "./uk-tax";

export type Priority = "critical" | "high" | "medium" | "low";
export type Effort = "easy" | "moderate" | "involved";

export interface Recommendation {
  id: string;
  title: string;
  category: "Foundation" | "Tax" | "Pension" | "ISA" | "Debt" | "Property" | "Goal" | "Allocation";
  priority: Priority;
  effort: Effort;
  why: string;             // why this matters for THIS user (concrete numbers)
  action: string;          // exactly what to do next
  estimatedBenefit?: string; // £ or % gain estimate
  ctaRoute?: string;
  ctaLabel?: string;
}

export interface GoalProgress {
  id: string;
  name: string;
  target: number;
  current: number;
  pct: number;             // 0-1
  monthsToGoal: number | null;
  onTrack: boolean | null;
  shortfall?: number;      // £ short at target year
  monthlyNeeded?: number;  // £/mo to reach goal
  note: string;
}

const RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function scoreFinancialHealth(s: AppState): { score: number; pillars: { label: string; score: number; note: string }[] } {
  const pillars: { label: string; score: number; note: string }[] = [];
  const th = computeTakeHome({ grossSalary: s.profile.grossSalary, studentLoan: s.profile.studentLoanPlan });
  const cash = s.savings.reduce((a, x) => a + x.balance, 0);
  const monthlyEss = th.takeHome * 0.6;
  const efMonths = monthlyEss > 0 ? cash / monthlyEss : 0;
  const efTarget = s.goals.emergencyFundMonths || 3;
  pillars.push({
    label: "Emergency fund",
    score: Math.min(100, (efMonths / efTarget) * 100),
    note: `${efMonths.toFixed(1)} of ${efTarget} months covered`,
  });

  // Pension contribution rate (target ~half your age %)
  const pensionMonthly = s.pensions.reduce((a, p) => a + p.monthlyOwn + p.monthlyEmployer, 0);
  const pensionPct = s.profile.grossSalary > 0 ? (pensionMonthly * 12) / s.profile.grossSalary : 0;
  const pensionTarget = Math.min(0.20, (s.profile.age / 2) / 100);
  pillars.push({
    label: "Pension rate",
    score: Math.min(100, (pensionPct / Math.max(0.05, pensionTarget)) * 100),
    note: `${(pensionPct * 100).toFixed(1)}% of salary going in (rule of thumb: ${(pensionTarget * 100).toFixed(0)}%)`,
  });

  // ISA usage
  const isaUsed = s.isas.reduce((a, i) => a + i.thisYearContribution, 0);
  pillars.push({
    label: "ISA allowance used",
    score: Math.min(100, (isaUsed / UK.isaAllowance) * 100),
    note: `£${isaUsed.toLocaleString()} of £20,000 used this year`,
  });

  // Debt — high-interest danger
  const mortgageRate = s.mortgage.enabled ? s.mortgage.rate : 0;
  const debtScore = s.profile.studentLoanBalance > 0 || (s.mortgage.enabled && s.mortgage.outstandingBalance > 0)
    ? Math.max(0, 100 - mortgageRate * 1000)
    : 100;
  pillars.push({
    label: "Debt position",
    score: debtScore,
    note: s.mortgage.enabled ? `Mortgage at ${(mortgageRate * 100).toFixed(2)}%` : "No mortgage",
  });

  // Diversification — penalise >70% in any single bucket
  const buckets = [
    s.pensions.reduce((a, p) => a + p.currentValue, 0),
    s.isas.reduce((a, i) => a + i.currentValue, 0),
    s.savings.reduce((a, x) => a + x.balance, 0),
    s.customAssets.reduce((a, c) => a + c.currentValue, 0),
    s.mortgage.enabled ? Math.max(0, s.mortgage.propertyValue - s.mortgage.outstandingBalance) : 0,
  ];
  const total = buckets.reduce((a, b) => a + b, 0);
  const maxShare = total > 0 ? Math.max(...buckets) / total : 0;
  pillars.push({
    label: "Diversification",
    score: Math.max(0, 100 - Math.max(0, maxShare - 0.5) * 200),
    note: total > 0 ? `Largest bucket = ${(maxShare * 100).toFixed(0)}% of wealth` : "No assets yet",
  });

  const score = Math.round(pillars.reduce((a, p) => a + p.score, 0) / pillars.length);
  return { score, pillars };
}

export function buildRecommendations(s: AppState): Recommendation[] {
  const out: Recommendation[] = [];
  const th = computeTakeHome({ grossSalary: s.profile.grossSalary, studentLoan: s.profile.studentLoanPlan });
  const cash = s.savings.reduce((a, x) => a + x.balance, 0);
  const monthlyEss = th.takeHome * 0.6;
  const efTarget = (s.goals.emergencyFundMonths || 3) * monthlyEss;

  // 1. Emergency fund (foundation — comes first if missing)
  if (cash < efTarget * 0.5 && monthlyEss > 0) {
    out.push({
      id: "ef",
      title: "Build a starter emergency fund first",
      category: "Foundation",
      priority: "critical",
      effort: "moderate",
      why: `You have £${cash.toLocaleString()} in cash but need around £${efTarget.toLocaleString(undefined,{maximumFractionDigits:0})} (≈${s.goals.emergencyFundMonths} months of essentials). Without this, an unexpected bill could force you to dip into investments at the wrong time.`,
      action: `Open a high-interest easy-access account or Cash ISA and direct-debit a regular monthly amount until you reach £${efTarget.toLocaleString(undefined,{maximumFractionDigits:0})}.`,
      estimatedBenefit: `Peace of mind + avoid ~25% LISA penalty or selling investments at a loss`,
      ctaRoute: "/savings",
      ctaLabel: "Set up savings",
    });
  }

  // 2. Employer pension match — free money
  const employerMatchGap = s.pensions.find((p) => p.type === "workplace" && p.monthlyEmployer < p.monthlyOwn);
  if (s.pensions.length === 0 && s.profile.grossSalary >= UK.personalAllowance) {
    out.push({
      id: "auto-enrol",
      title: "Make sure you're in your workplace pension",
      category: "Pension",
      priority: "critical",
      effort: "easy",
      why: "If you earn over £10k and you're 22+, your employer must auto-enrol you and contribute at least 3% of qualifying earnings. Opting out is leaving free money on the table.",
      action: "Check your payslip or ask HR. If opted out, opt back in.",
      estimatedBenefit: `~£${Math.round(s.profile.grossSalary * 0.03).toLocaleString()}/yr employer top-up`,
      ctaRoute: "/pensions",
      ctaLabel: "Add pension",
    });
  } else if (employerMatchGap) {
    const extra = (employerMatchGap.monthlyOwn - employerMatchGap.monthlyEmployer) * 12;
    out.push({
      id: "match",
      title: "Capture the full employer pension match",
      category: "Pension",
      priority: "high",
      effort: "easy",
      why: `Your "${employerMatchGap.name}" employer contribution (£${employerMatchGap.monthlyEmployer}/mo) is below yours (£${employerMatchGap.monthlyOwn}/mo). Many employers match £-for-£ up to a cap — anything below the cap is unclaimed pay.`,
      action: "Ask HR for your matching policy and increase contributions to the matched ceiling.",
      estimatedBenefit: `Up to £${extra.toLocaleString()}/yr free`,
      ctaRoute: "/pensions",
    });
  }

  // 3. Higher-rate pension relief
  if (th.bands.higher > 0 || th.bands.additional > 0) {
    const sacrifice = Math.min(th.bands.higher + th.bands.additional, 10000);
    const benefit = sacrifice * (th.marginalRate);
    out.push({
      id: "higher-rate",
      title: "Drop out of the 40% / 45% tax band with pension",
      category: "Tax",
      priority: "high",
      effort: "easy",
      why: `£${(th.bands.higher + th.bands.additional).toLocaleString(undefined,{maximumFractionDigits:0})} of your income is taxed at ${th.marginalRate >= 0.45 ? "45%" : "40%"} plus 2% NI. Pension contributions get full marginal-rate relief — the most tax-efficient pound you'll ever save.`,
      action: `Increase salary-sacrifice pension by ~£${Math.round(sacrifice/12).toLocaleString()}/mo (or claim higher-rate relief via Self Assessment for relief-at-source contributions).`,
      estimatedBenefit: `Save ~£${Math.round(benefit).toLocaleString()}/yr in tax+NI`,
      ctaRoute: "/pensions",
    });
  }

  // 4. ISA allowance — use it or lose it
  const isaUsed = s.isas.reduce((a, i) => a + i.thisYearContribution, 0);
  const isaLeft = UK.isaAllowance - isaUsed;
  if (isaLeft > 1000 && cash > 5000) {
    out.push({
      id: "isa-fill",
      title: `Move £${Math.min(isaLeft, cash - 3000).toLocaleString()} into an ISA before 5 April`,
      category: "ISA",
      priority: "high",
      effort: "easy",
      why: `Your £20,000/yr ISA allowance resets every 6 April and doesn't roll over. You have £${isaLeft.toLocaleString()} unused, while £${cash.toLocaleString()} sits in taxable savings.`,
      action: "Transfer surplus cash (above your emergency fund) into a Stocks & Shares or Cash ISA.",
      estimatedBenefit: `Tax-free interest/growth — saves ~${th.bands.higher > 0 ? "40%" : "20%"} on returns`,
      ctaRoute: "/isas",
    });
  }

  // 5. LISA opportunity (under 40)
  const hasLisa = s.isas.some((i) => i.type === "lisa");
  if (!hasLisa && s.profile.age >= 18 && s.profile.age < 40) {
    out.push({
      id: "lisa",
      title: "Open a Lifetime ISA — 25% government bonus",
      category: "ISA",
      priority: s.goals.housePurchase.enabled || s.profile.age < 35 ? "high" : "medium",
      effort: "easy",
      why: "You're eligible to open a LISA (must be 18-39). Government adds 25% on up to £4,000/yr — that's £1,000 free. Use for first home (≤£450k) or after age 60.",
      action: "Open a LISA before your 40th birthday (you can keep contributing until 50). Even £1 in now preserves the option.",
      estimatedBenefit: "Up to £1,000/yr bonus",
      ctaRoute: "/isas",
    });
  }

  // 6. Personal Savings Allowance breach
  const savingsRate = s.savings.length > 0 ? s.savings.reduce((a, x) => a + x.balance * x.rate, 0) / Math.max(1, cash) : 0;
  const interest = cash * savingsRate;
  const psa = th.bands.higher > 0 ? UK.savingsAllowanceHigher : UK.savingsAllowanceBasic;
  if (interest > psa) {
    out.push({
      id: "psa",
      title: "Your savings interest is above the tax-free allowance",
      category: "Tax",
      priority: "medium",
      effort: "easy",
      why: `You'll earn ~£${Math.round(interest).toLocaleString()} interest, but your Personal Savings Allowance is only £${psa}. Anything above is taxed at your marginal rate.`,
      action: "Move excess cash into a Cash ISA or Premium Bonds.",
      estimatedBenefit: `Save ~£${Math.round((interest - psa) * th.marginalRate).toLocaleString()}/yr in tax`,
      ctaRoute: "/isas",
    });
  }

  // 7. Mortgage overpayment vs invest
  if (s.mortgage.enabled && s.mortgage.outstandingBalance > 0) {
    const realReturn = 0.05; // assumed real net investment return
    if (s.mortgage.rate > realReturn && s.mortgage.monthlyOverpayment === 0) {
      out.push({
        id: "mortgage-over",
        title: "Consider mortgage overpayments",
        category: "Debt",
        priority: "medium",
        effort: "easy",
        why: `Your mortgage rate (${(s.mortgage.rate * 100).toFixed(2)}%) is higher than typical net investment returns. £1 overpaid is a guaranteed ${(s.mortgage.rate * 100).toFixed(2)}% return.`,
        action: "Most lenders allow 10%/yr overpayment without ERC. Even £100/mo cuts years off the term.",
        estimatedBenefit: `~£${Math.round(s.mortgage.outstandingBalance * 0.02).toLocaleString()} interest saved over the term`,
        ctaRoute: "/mortgage",
      });
    } else if (s.mortgage.rate < realReturn) {
      out.push({
        id: "mortgage-keep",
        title: "Don't rush to overpay this cheap mortgage",
        category: "Debt",
        priority: "low",
        effort: "easy",
        why: `Your rate (${(s.mortgage.rate * 100).toFixed(2)}%) is below typical investment returns. Funds may grow faster inside an ISA or pension.`,
        action: "Prioritise pension/ISA contributions over overpayments while rates stay low.",
        ctaRoute: "/isas",
      });
    }
  }

  // 8. Annual allowance warning
  const totalPensionAnnual = s.pensions.reduce((a, p) => a + (p.monthlyOwn + p.monthlyEmployer) * 12, 0);
  if (totalPensionAnnual > UK.annualAllowance * 0.85) {
    out.push({
      id: "aa",
      title: "Approaching the £60k pension Annual Allowance",
      category: "Pension",
      priority: "high",
      effort: "moderate",
      why: `You're contributing ~£${totalPensionAnnual.toLocaleString(undefined,{maximumFractionDigits:0})}/yr. Exceeding £60k triggers an AA tax charge.`,
      action: "Check carry-forward from the past 3 years (you can use unused allowance), or scale back contributions.",
      ctaRoute: "/pensions",
    });
  }

  // 9. Marriage allowance
  if (s.profile.marriedOrCivilPartner && s.profile.partnerLowerEarner && th.bands.higher === 0 && s.profile.grossSalary > UK.personalAllowance) {
    out.push({
      id: "marriage",
      title: "Claim Marriage Allowance — worth £252/yr",
      category: "Tax",
      priority: "medium",
      effort: "easy",
      why: "Your partner earns under the personal allowance and you're a basic-rate taxpayer. They can transfer £1,260 of unused PA to you.",
      action: "Apply on gov.uk (Marriage Allowance) — backdate up to 4 tax years for ~£1,000 lump sum.",
      estimatedBenefit: "Up to £252/yr + ~£1,000 backdated",
    });
  }

  // 10. Diversification — too much in one place
  const buckets = {
    Cash: cash,
    Pensions: s.pensions.reduce((a, p) => a + p.currentValue, 0),
    ISAs: s.isas.reduce((a, i) => a + i.currentValue, 0),
    Property: s.mortgage.enabled ? Math.max(0, s.mortgage.propertyValue - s.mortgage.outstandingBalance) : 0,
    Custom: s.customAssets.reduce((a, c) => a + c.currentValue, 0),
  };
  const total = Object.values(buckets).reduce((a, b) => a + b, 0);
  if (total > 10000) {
    const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
    const [topName, topVal] = sorted[0];
    if (topVal / total > 0.7 && topName === "Cash") {
      out.push({
        id: "too-much-cash",
        title: "Too much wealth sitting in cash",
        category: "Allocation",
        priority: "high",
        effort: "moderate",
        why: `${((topVal/total)*100).toFixed(0)}% of your wealth (£${topVal.toLocaleString()}) is in cash. Inflation erodes purchasing power by ~2-3%/yr — over 10 years that's a quiet £${Math.round(topVal*0.22).toLocaleString()} loss in real terms.`,
        action: "Once your emergency fund is set, drip-feed surplus into a diversified Stocks & Shares ISA or pension.",
        ctaRoute: "/isas",
      });
    }
  }

  // 11. Retirement gap
  const retYears = Math.max(1, s.goals.retirementAge - s.profile.age);
  const pensionTotal = s.pensions.reduce((a, p) => a + p.currentValue, 0);
  const pensionMonthly = s.pensions.reduce((a, p) => a + p.monthlyOwn + p.monthlyEmployer, 0);
  const blended = s.pensions.length > 0 ? s.pensions.reduce((a, p) => a + p.expectedReturn * (p.currentValue || 1), 0) / Math.max(1, pensionTotal) : 0.05;
  const projAtRet = projectGrowth(pensionTotal, pensionMonthly, blended, retYears).slice(-1)[0]?.value ?? 0;
  // 4% safe withdrawal rule of thumb
  const sustainableIncome = projAtRet * 0.04;
  if (sustainableIncome < s.goals.retirementIncome * 0.85 && s.profile.grossSalary > 0) {
    const gap = s.goals.retirementIncome - sustainableIncome;
    const extraPotNeeded = gap / 0.04;
    // PMT formula to back into monthly
    const r = blended / 12; const n = retYears * 12;
    const extraMonthly = r > 0 ? (extraPotNeeded * r) / (Math.pow(1 + r, n) - 1) : extraPotNeeded / n;
    out.push({
      id: "ret-gap",
      title: "On-track for retirement? Not quite.",
      category: "Goal",
      priority: "high",
      effort: "moderate",
      why: `At age ${s.goals.retirementAge}, your pension projects to £${Math.round(projAtRet).toLocaleString()} — supporting ~£${Math.round(sustainableIncome).toLocaleString()}/yr (4% rule). Your goal is £${s.goals.retirementIncome.toLocaleString()}/yr.`,
      action: `Increase total pension contributions by ~£${Math.round(extraMonthly).toLocaleString()}/mo to close the gap (assumes ${(blended*100).toFixed(1)}% return).`,
      estimatedBenefit: `Reach goal income at ${s.goals.retirementAge}`,
      ctaRoute: "/pensions",
    });
  }

  // 12. House goal
  if (s.goals.housePurchase.enabled) {
    const yearsToBuy = Math.max(1, s.goals.housePurchase.targetYear - new Date().getFullYear());
    const depositMonthly = s.isas.filter((i) => i.type === "lisa" || i.type === "h2b" || i.type === "cash").reduce((a, i) => a + i.monthlyContribution, 0);
    const depositPot = s.isas.filter((i) => i.type === "lisa" || i.type === "h2b" || i.type === "cash").reduce((a, i) => a + i.currentValue, 0);
    const monthlyNeeded = (s.goals.housePurchase.targetDeposit - depositPot) / Math.max(1, yearsToBuy * 12);
    if (monthlyNeeded > depositMonthly + 50) {
      out.push({
        id: "house",
        title: "House deposit goal needs more saving",
        category: "Goal",
        priority: "high",
        effort: "moderate",
        why: `You want £${s.goals.housePurchase.targetDeposit.toLocaleString()} by ${s.goals.housePurchase.targetYear}. Current deposit pots: £${depositPot.toLocaleString()}, saving £${depositMonthly}/mo.`,
        action: `Add ~£${Math.round(monthlyNeeded - depositMonthly).toLocaleString()}/mo to deposit savings (LISA bonus helps if FTB & ≤£450k).`,
        ctaRoute: "/isas",
      });
    }
  }

  return out.sort((a, b) => RANK[a.priority] - RANK[b.priority]);
}

export function computeGoalProgress(s: AppState): GoalProgress[] {
  const out: GoalProgress[] = [];
  const th = computeTakeHome({ grossSalary: s.profile.grossSalary, studentLoan: s.profile.studentLoanPlan });

  // Emergency fund
  const cash = s.savings.reduce((a, x) => a + x.balance, 0);
  const efTarget = s.goals.emergencyFundMonths * th.takeHome * 0.6;
  out.push({
    id: "ef",
    name: "Emergency fund",
    target: efTarget,
    current: cash,
    pct: Math.min(1, cash / Math.max(1, efTarget)),
    monthsToGoal: null,
    onTrack: cash >= efTarget,
    note: `${s.goals.emergencyFundMonths} months of essentials in easy-access cash`,
  });

  // Retirement
  const retYears = Math.max(1, s.goals.retirementAge - s.profile.age);
  const pensionTotal = s.pensions.reduce((a, p) => a + p.currentValue, 0);
  const pensionMonthly = s.pensions.reduce((a, p) => a + p.monthlyOwn + p.monthlyEmployer, 0);
  const blended = s.pensions.length > 0 ? s.pensions.reduce((a, p) => a + p.expectedReturn * (p.currentValue || 1), 0) / Math.max(1, pensionTotal) : 0.05;
  const projAtRet = projectGrowth(pensionTotal, pensionMonthly, blended, retYears).slice(-1)[0]?.value ?? 0;
  const targetPot = s.goals.retirementIncome / 0.04;
  out.push({
    id: "retire",
    name: `Retire at ${s.goals.retirementAge}`,
    target: targetPot,
    current: projAtRet,
    pct: Math.min(1, projAtRet / Math.max(1, targetPot)),
    monthsToGoal: retYears * 12,
    onTrack: projAtRet >= targetPot * 0.95,
    shortfall: Math.max(0, targetPot - projAtRet),
    note: `Pot needed for £${s.goals.retirementIncome.toLocaleString()}/yr (4% rule)`,
  });

  // House
  if (s.goals.housePurchase.enabled) {
    const depositPot = s.isas.filter((i) => i.type === "lisa" || i.type === "h2b" || i.type === "cash").reduce((a, i) => a + i.currentValue, 0);
    const yearsTo = Math.max(0.1, s.goals.housePurchase.targetYear - new Date().getFullYear());
    out.push({
      id: "house",
      name: `House deposit by ${s.goals.housePurchase.targetYear}`,
      target: s.goals.housePurchase.targetDeposit,
      current: depositPot,
      pct: Math.min(1, depositPot / Math.max(1, s.goals.housePurchase.targetDeposit)),
      monthsToGoal: Math.round(yearsTo * 12),
      onTrack: depositPot / s.goals.housePurchase.targetDeposit >= (1 - yearsTo / Math.max(1, s.goals.housePurchase.targetYear - (s.profile.age - 18))),
      monthlyNeeded: Math.max(0, (s.goals.housePurchase.targetDeposit - depositPot) / (yearsTo * 12)),
      note: `Target property £${s.goals.housePurchase.targetPrice.toLocaleString()}`,
    });
  }

  // Custom goals
  for (const g of s.goals.customGoals) {
    const yearsTo = Math.max(0.1, g.targetYear - new Date().getFullYear());
    out.push({
      id: g.id,
      name: g.name,
      target: g.targetAmount,
      current: g.currentAmount,
      pct: Math.min(1, g.currentAmount / Math.max(1, g.targetAmount)),
      monthsToGoal: Math.round(yearsTo * 12),
      onTrack: null,
      monthlyNeeded: Math.max(0, (g.targetAmount - g.currentAmount) / (yearsTo * 12)),
      note: `Target ${g.targetYear}`,
    });
  }

  return out;
}

export function suggestAllocation(risk: AppState["goals"]["riskAppetite"], yearsToHorizon: number): { name: string; pct: number; note: string }[] {
  // Glide-path style allocation suggestion
  const baseEquity = risk === "growth" ? 90 : risk === "balanced" ? 70 : 50;
  // Reduce equity as horizon shortens
  const horizonAdjust = Math.max(0, 30 - Math.min(yearsToHorizon, 30)) * 1.5;
  const equity = Math.max(20, baseEquity - horizonAdjust);
  const bonds = Math.min(60, 100 - equity - 5);
  const cash = 5;
  return [
    { name: "Global equities (Stocks & Shares ISA / pension)", pct: equity, note: "Diversified low-cost index funds — engine of long-term growth." },
    { name: "Bonds / gilts", pct: bonds, note: "Smooths volatility, especially near retirement or major goals." },
    { name: "Cash / Premium Bonds", pct: cash, note: "Accessible buffer beyond your emergency fund." },
    { name: "Alternatives (property, custom assets)", pct: 100 - equity - bonds - cash, note: "Optional — only what you understand." },
  ].filter((a) => a.pct > 0);
}

// Just a reference to silence unused import in some bundles
export const _refs = { mortgagePayment };
