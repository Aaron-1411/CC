export const fmt = (n: number) =>
  n >= 1_000_000 ? `£${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `£${Math.round(n / 1_000)}K` : `£${Math.round(n)}`;

export const fmtFull = (n: number) => `£${Math.round(n).toLocaleString()}`;
export const pct = (n: number) => `${n.toFixed(2)}%`;

export const monthlyPayment = (principal: number, annualRate: number, termYears: number, ioOnly = false) => {
  if (principal <= 0) return 0;
  if (ioOnly) return principal * (annualRate / 100 / 12);
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
};

export const amortSchedule = (principal: number, annualRate: number, termYears: number) => {
  const r = annualRate / 100 / 12;
  const mp = monthlyPayment(principal, annualRate, termYears);
  let balance = principal;
  const years: { year: number; balance: number; interestPaid: number; capitalPaid: number }[] = [];
  for (let y = 1; y <= termYears; y++) {
    let intPaid = 0,
      capPaid = 0;
    for (let m = 0; m < 12; m++) {
      const interest = balance * r;
      const capital = mp - interest;
      intPaid += interest;
      capPaid += capital;
      balance = Math.max(0, balance - capital);
    }
    years.push({ year: y, balance: Math.round(balance), interestPaid: Math.round(intPaid), capitalPaid: Math.round(capPaid) });
  }
  return years;
};

export const sdltCalc = (price: number) => {
  // Standard residential SDLT (England) - simplified
  if (price <= 250_000) return 0;
  if (price <= 925_000) return (price - 250_000) * 0.05;
  if (price <= 1_500_000) return 33_750 + (price - 925_000) * 0.1;
  return 33_750 + 57_500 + (price - 1_500_000) * 0.12;
};

// First-time buyer SDLT (England, post-April 2025): 0% to £300k, 5% £300k–£500k, standard above
export const sdltFTB = (price: number) => {
  if (price > 500_000) return sdltCalc(price);
  if (price <= 300_000) return 0;
  return (price - 300_000) * 0.05;
};
