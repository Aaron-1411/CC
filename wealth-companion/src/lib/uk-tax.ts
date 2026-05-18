// UK tax & financial rules (2025/26 tax year — England & NI; Scotland differs)
// Centralised so calculators stay consistent. All amounts in GBP.

export const UK = {
  taxYear: "2025/26",
  personalAllowance: 12570,
  basicRateLimit: 50270,        // top of basic rate band (income)
  higherRateLimit: 125140,      // additional rate threshold
  paTaperStart: 100000,         // PA tapers £1 per £2 above this
  basicRate: 0.20,
  higherRate: 0.40,
  additionalRate: 0.45,
  // National Insurance (employee, 2025/26)
  niPrimaryThreshold: 12570,
  niUpperEarnings: 50270,
  niMain: 0.08,
  niUpper: 0.02,
  // Allowances
  isaAllowance: 20000,
  lisaAllowance: 4000,          // counts towards ISA total
  lisaBonus: 0.25,
  jisaAllowance: 9000,
  cgtAllowance: 3000,
  dividendAllowance: 500,
  savingsAllowanceBasic: 1000,
  savingsAllowanceHigher: 500,
  marriageAllowance: 1260,
  // Pensions
  annualAllowance: 60000,
  taperedAAStart: 260000,       // adjusted income threshold
  taperedAAFloor: 10000,
  mpaa: 10000,
  // Student Loan Plan 2 (typical)
  slPlan2Threshold: 27295,
  slPlan2Rate: 0.09,
  slPlan2InterestMax: 0.062,    // RPI + 3% cap (illustrative)
};

export type StudentLoanPlan = "none" | "plan1" | "plan2" | "plan4" | "plan5" | "postgrad";

const SL: Record<StudentLoanPlan, { threshold: number; rate: number }> = {
  none: { threshold: Infinity, rate: 0 },
  plan1: { threshold: 26065, rate: 0.09 },
  plan2: { threshold: 27295, rate: 0.09 },
  plan4: { threshold: 32745, rate: 0.09 },
  plan5: { threshold: 25000, rate: 0.09 },
  postgrad: { threshold: 21000, rate: 0.06 },
};

export function fmtGBP(n: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
    ...opts,
  }).format(isFinite(n) ? n : 0);
}

export function fmtPct(n: number, dp = 1) {
  return `${(n * 100).toFixed(dp)}%`;
}

/** Effective personal allowance after high-income taper. */
export function effectivePA(adjustedIncome: number) {
  if (adjustedIncome <= UK.paTaperStart) return UK.personalAllowance;
  const reduction = Math.floor((adjustedIncome - UK.paTaperStart) / 2);
  return Math.max(0, UK.personalAllowance - reduction);
}

/** Income tax on employment income (England). */
export function incomeTax(taxableSalary: number) {
  const pa = effectivePA(taxableSalary);
  const basicTop = UK.basicRateLimit;       // PA included in this £50,270 line
  const higherTop = UK.higherRateLimit;
  let tax = 0;
  const inBasic = Math.max(0, Math.min(taxableSalary, basicTop) - pa);
  const inHigher = Math.max(0, Math.min(taxableSalary, higherTop) - basicTop);
  const inAdditional = Math.max(0, taxableSalary - higherTop);
  tax += inBasic * UK.basicRate;
  tax += inHigher * UK.higherRate;
  tax += inAdditional * UK.additionalRate;
  return { tax, pa, inBasic, inHigher, inAdditional };
}

/** Class 1 employee NI (annualised). */
export function nationalInsurance(salary: number) {
  const inMain = Math.max(0, Math.min(salary, UK.niUpperEarnings) - UK.niPrimaryThreshold);
  const inUpper = Math.max(0, salary - UK.niUpperEarnings);
  return inMain * UK.niMain + inUpper * UK.niUpper;
}

/** Student loan annual repayment. */
export function studentLoan(salary: number, plan: StudentLoanPlan) {
  const cfg = SL[plan];
  if (!cfg || salary <= cfg.threshold) return 0;
  return (salary - cfg.threshold) * cfg.rate;
}

export interface TakeHomeInput {
  grossSalary: number;
  pensionSalSacPct?: number;     // % of gross
  pensionReliefAtSourcePct?: number; // post-tax (relief-at-source) — adds 25% via HMRC
  studentLoan?: StudentLoanPlan;
}

export interface TakeHomeResult {
  gross: number;
  salSacAmount: number;
  taxableSalary: number;
  incomeTaxAmount: number;
  niAmount: number;
  studentLoanAmount: number;
  rasNet: number;
  rasGrossedUp: number;          // including 25% basic-rate relief
  takeHome: number;              // monthly take-home base (annual/12)
  effectiveTaxRate: number;
  marginalRate: number;
  bands: { pa: number; basic: number; higher: number; additional: number };
}

export function computeTakeHome(input: TakeHomeInput): TakeHomeResult {
  const gross = input.grossSalary;
  const salSacAmount = ((input.pensionSalSacPct ?? 0) / 100) * gross;
  const taxableSalary = Math.max(0, gross - salSacAmount);
  const { tax, pa, inBasic, inHigher, inAdditional } = incomeTax(taxableSalary);
  const ni = nationalInsurance(taxableSalary);
  const sl = studentLoan(taxableSalary, input.studentLoan ?? "none");
  const rasNet = ((input.pensionReliefAtSourcePct ?? 0) / 100) * gross;
  const rasGrossedUp = rasNet * 1.25;
  const takeHomeAnnual = taxableSalary - tax - ni - sl - rasNet;

  // Marginal rate (next £1 earned)
  let marginal = 0;
  if (taxableSalary < pa) marginal = 0;
  else if (taxableSalary < UK.basicRateLimit) marginal = UK.basicRate + UK.niMain;
  else if (taxableSalary < UK.higherRateLimit) marginal = UK.higherRate + UK.niUpper;
  else marginal = UK.additionalRate + UK.niUpper;
  if ((input.studentLoan ?? "none") !== "none" && taxableSalary > SL[input.studentLoan ?? "none"].threshold) {
    marginal += SL[input.studentLoan ?? "none"].rate;
  }

  return {
    gross,
    salSacAmount,
    taxableSalary,
    incomeTaxAmount: tax,
    niAmount: ni,
    studentLoanAmount: sl,
    rasNet,
    rasGrossedUp,
    takeHome: takeHomeAnnual / 12,
    effectiveTaxRate: gross > 0 ? (tax + ni + sl) / gross : 0,
    marginalRate: marginal,
    bands: { pa, basic: inBasic, higher: inHigher, additional: inAdditional },
  };
}

/** Compound projection: future value with monthly contributions. */
export function projectGrowth(
  startValue: number,
  monthlyContribution: number,
  annualReturn: number,
  years: number,
): { year: number; value: number; contributions: number; growth: number }[] {
  const r = annualReturn / 12;
  const months = Math.round(years * 12);
  let v = startValue;
  let totalContrib = startValue;
  const out: { year: number; value: number; contributions: number; growth: number }[] = [
    { year: 0, value: startValue, contributions: startValue, growth: 0 },
  ];
  for (let m = 1; m <= months; m++) {
    v = v * (1 + r) + monthlyContribution;
    totalContrib += monthlyContribution;
    if (m % 12 === 0) {
      out.push({ year: m / 12, value: v, contributions: totalContrib, growth: v - totalContrib });
    }
  }
  return out;
}

/** Mortgage monthly payment (repayment). */
export function mortgagePayment(principal: number, annualRate: number, termYears: number) {
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** Amortisation schedule (yearly snapshots). */
export function mortgageSchedule(
  principal: number,
  annualRate: number,
  termYears: number,
  overpaymentMonthly = 0,
) {
  const r = annualRate / 12;
  const basePayment = mortgagePayment(principal, annualRate, termYears);
  const out: { year: number; balance: number; interestPaid: number; principalPaid: number }[] = [];
  let balance = principal;
  let interestPaid = 0;
  let principalPaid = 0;
  let m = 0;
  while (balance > 0.01 && m < termYears * 12) {
    m++;
    const interest = balance * r;
    let pay = basePayment + overpaymentMonthly;
    if (pay > balance + interest) pay = balance + interest;
    const princ = pay - interest;
    balance -= princ;
    interestPaid += interest;
    principalPaid += princ;
    if (m % 12 === 0 || balance <= 0.01) {
      out.push({ year: m / 12, balance: Math.max(0, balance), interestPaid, principalPaid });
    }
  }
  return { schedule: out, monthsToPayoff: m, basePayment };
}

/** Student loan payoff projection. */
export function studentLoanPayoff(
  balance: number,
  salary: number,
  plan: StudentLoanPlan,
  annualInterest: number,
  extraMonthly = 0,
) {
  const monthlyRequired = studentLoan(salary, plan) / 12;
  const r = annualInterest / 12;
  let bal = balance;
  let m = 0;
  let interestPaid = 0;
  const out: { year: number; balance: number }[] = [{ year: 0, balance: bal }];
  while (bal > 0.01 && m < 30 * 12) {
    m++;
    const interest = bal * r;
    interestPaid += interest;
    bal += interest;
    const pay = Math.min(bal, monthlyRequired + extraMonthly);
    bal -= pay;
    if (m % 12 === 0 || bal <= 0.01) out.push({ year: m / 12, balance: Math.max(0, bal) });
  }
  return { schedule: out, monthsToClear: m, interestPaid, monthlyRequired };
}
