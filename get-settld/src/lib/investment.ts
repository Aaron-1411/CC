// Investment math - IRR / NPV / cashflow projections.
// Pure functions, fully deterministic, no external deps.

export interface InvestmentInputs {
  price: number;
  deposit: number;          // £
  rate: number;             // %/yr mortgage
  termYears: number;        // mortgage term
  holdYears: number;        // years held before exit
  monthlyRent: number;      // gross
  voidWeeks: number;        // per year
  managementPct: number;    // % of rent
  maintenancePct: number;   // % of price annually
  insuranceYr: number;      // £
  groundRentYr: number;     // £ (leasehold)
  serviceChargeYr: number;  // £
  serviceChargeGrowthPct: number; // %
  rentGrowthPct: number;    // %
  capitalGrowthPct: number; // %
  exitFeesPct: number;      // selling fees
  sdlt: number;             // upfront stamp duty
  legalFees: number;        // upfront
  refurb: number;           // upfront
  isInterestOnly?: boolean;
}

export interface YearlyCashflow {
  year: number;
  grossRent: number;
  netRent: number;
  mortgageInterest: number;
  mortgageCapital: number;
  serviceCharge: number;
  netCashflow: number;
  cumulative: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
}

export interface InvestmentResult {
  initialOutlay: number;
  cashflows: YearlyCashflow[];
  exitNetProceeds: number;
  totalEquityReturn: number;     // £ profit (cash-on-cash + capital)
  totalReturnMultiple: number;
  cashOnCashYr1Pct: number;
  grossYieldPct: number;
  netYieldPct: number;
  irrPct: number;
  npvAt5Pct: number;
}

const monthlyMortgage = (principal: number, ratePct: number, years: number, ioOnly = false) => {
  if (principal <= 0) return 0;
  if (ioOnly) return principal * (ratePct / 100 / 12);
  const r = ratePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
};

// Newton + bisection IRR for arbitrary cashflows. Returns annualised rate.
export const irr = (cashflows: number[], guess = 0.1): number => {
  if (cashflows.length < 2) return 0;
  const npv = (rate: number) =>
    cashflows.reduce((s, cf, i) => s + cf / Math.pow(1 + rate, i), 0);
  // Expand bracket until sign change is found (avoids infinite loops on edge series)
  let lo = -0.99, hi = 1;
  let nLo = npv(lo), nHi = npv(hi);
  for (let k = 0; k < 12 && nLo * nHi > 0; k++) { hi *= 2; nHi = npv(hi); }
  if (nLo * nHi > 0) return NaN;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const v = npv(mid);
    if (Math.abs(v) < 1) return mid;
    if (npv(lo) * v < 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
};

export const npv = (cashflows: number[], discountPct: number) =>
  cashflows.reduce((s, cf, i) => s + cf / Math.pow(1 + discountPct / 100, i), 0);

export const runInvestment = (i: InvestmentInputs): InvestmentResult => {
  const loan = Math.max(0, i.price - i.deposit);
  const initialOutlay = i.deposit + i.sdlt + i.legalFees + i.refurb;
  const mp = monthlyMortgage(loan, i.rate, i.termYears, i.isInterestOnly);
  const annualMortgage = mp * 12;

  const cashflows: YearlyCashflow[] = [];
  let balance = loan;
  let cumulative = -initialOutlay;
  let value = i.price;
  let rent = i.monthlyRent * 12;
  let svc = i.serviceChargeYr;

  for (let y = 1; y <= i.holdYears; y++) {
    // amortise this year
    let intYr = 0, capYr = 0;
    const r = i.rate / 100 / 12;
    for (let m = 0; m < 12; m++) {
      if (i.isInterestOnly) {
        intYr += balance * r;
      } else {
        const interest = balance * r;
        const capital = Math.min(mp - interest, balance);
        intYr += interest;
        capYr += capital;
        balance = Math.max(0, balance - capital);
      }
    }

    const voidLossPct = i.voidWeeks / 52;
    const grossRentEffective = rent * (1 - voidLossPct);
    const mgmt = grossRentEffective * (i.managementPct / 100);
    const maint = i.price * (i.maintenancePct / 100);
    const opex = mgmt + maint + i.insuranceYr + i.groundRentYr + svc;
    const netRent = grossRentEffective - opex;
    const netCashflow = netRent - annualMortgage;

    value *= 1 + i.capitalGrowthPct / 100;
    cumulative += netCashflow;

    cashflows.push({
      year: y,
      grossRent: Math.round(grossRentEffective),
      netRent: Math.round(netRent),
      mortgageInterest: Math.round(intYr),
      mortgageCapital: Math.round(capYr),
      serviceCharge: Math.round(svc),
      netCashflow: Math.round(netCashflow),
      cumulative: Math.round(cumulative),
      propertyValue: Math.round(value),
      loanBalance: Math.round(balance),
      equity: Math.round(value - balance),
    });

    rent *= 1 + i.rentGrowthPct / 100;
    svc *= 1 + i.serviceChargeGrowthPct / 100;
  }

  const last = cashflows[cashflows.length - 1];
  const exitFees = last.propertyValue * (i.exitFeesPct / 100);
  const exitNetProceeds = last.propertyValue - last.loanBalance - exitFees;

  // Build IRR cashflow series: -outlay, then yearly net, with exit added to last year
  const series: number[] = [-initialOutlay];
  cashflows.forEach((c, idx) => {
    series.push(c.netCashflow + (idx === cashflows.length - 1 ? exitNetProceeds : 0));
  });

  const irrPct = irr(series) * 100;
  const npvAt5Pct = npv(series, 5);

  const totalEquityReturn = series.slice(1).reduce((s, v) => s + v, 0) - initialOutlay + initialOutlay; // simpler: sum of all flows
  const sumIn = series.filter((v) => v > 0).reduce((s, v) => s + v, 0);
  const totalReturnMultiple = sumIn / initialOutlay;

  const grossYieldPct = (i.monthlyRent * 12 / i.price) * 100;
  const netYieldPct = (cashflows[0].netRent / i.price) * 100;
  const cashOnCashYr1Pct = (cashflows[0].netCashflow / initialOutlay) * 100;

  return {
    initialOutlay: Math.round(initialOutlay),
    cashflows,
    exitNetProceeds: Math.round(exitNetProceeds),
    totalEquityReturn: Math.round(totalEquityReturn - initialOutlay),
    totalReturnMultiple: +totalReturnMultiple.toFixed(2),
    cashOnCashYr1Pct: +cashOnCashYr1Pct.toFixed(1),
    grossYieldPct: +grossYieldPct.toFixed(2),
    netYieldPct: +netYieldPct.toFixed(2),
    irrPct: isFinite(irrPct) ? +irrPct.toFixed(2) : 0,
    npvAt5Pct: Math.round(npvAt5Pct),
  };
};
