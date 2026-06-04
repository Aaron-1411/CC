import { useState } from "react";
import { stampDuty, monthlyMortgagePayment } from "./calc";
import { gbp, NumberField, ToggleRow, ResultStat, ResultRow, Assumptions, useFireOnce } from "./shared";

const BUYING_FEES = 2000; // rough legal, survey & mortgage fees
const MAINTENANCE_RATE = 0.01; // ~1% of value a year

export function RentVsBuyTool({ onUse }: { onUse: () => void }) {
  const fire = useFireOnce(onUse);
  const [rent, setRent] = useState(1100);
  const [price, setPrice] = useState(250000);
  const [deposit, setDeposit] = useState(25000);
  const [rate, setRate] = useState(4.5);
  const [term, setTerm] = useState(25);
  const [ftb, setFtb] = useState(true);
  const [horizon, setHorizon] = useState(10);

  const yrs = Math.min(Math.max(Math.floor(horizon), 1), 40);
  const loan = Math.max(0, price - deposit);
  const monthlyPayment = monthlyMortgagePayment(loan, rate / 100, term);
  const sdlt = stampDuty(price, ftb);

  // Simulate the mortgage to split interest from principal over the horizon.
  const r = rate / 100 / 12;
  let balance = loan;
  let interestPaid = 0;
  const months = Math.min(yrs * 12, term * 12);
  for (let m = 0; m < months; m++) {
    const interest = balance * r;
    const principal = Math.min(monthlyPayment - interest, balance);
    interestPaid += interest;
    balance -= principal;
    if (balance <= 0) break;
  }
  const principalPaid = loan - Math.max(0, balance);
  const maintenance = price * MAINTENANCE_RATE * yrs;

  // "Money you don't get back" — equity (deposit + principal repaid) stays yours.
  const buyCost = sdlt + BUYING_FEES + interestPaid + maintenance;
  const rentCost = rent * 12 * yrs;
  const equityBuilt = deposit + principalPaid;
  const buyingCheaper = buyCost <= rentCost;

  const touch = () => fire();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">Renting</div>
        <NumberField label="Monthly rent" value={rent} onChange={(n) => { setRent(n); touch(); }} />
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">Buying</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Property price" value={price} onChange={(n) => { setPrice(n); touch(); }} />
          <NumberField label="Deposit" value={deposit} onChange={(n) => { setDeposit(n); touch(); }} />
          <NumberField label="Mortgage rate" value={rate} prefix="" suffix="%" max={20} onChange={(n) => { setRate(n); touch(); }} />
          <NumberField label="Mortgage term" value={term} prefix="" suffix="yrs" max={40} onChange={(n) => { setTerm(n); touch(); }} />
        </div>
        <div className="mt-3">
          <ToggleRow label="First-time buyer" checked={ftb} onChange={(v) => { setFtb(v); touch(); }} />
        </div>
      </div>

      <NumberField label="Compare over how many years?" value={horizon} prefix="" suffix="yrs" max={40} onChange={(n) => { setHorizon(n); touch(); }} />

      <div className="grid grid-cols-2 gap-3">
        <ResultStat label={`Renting (${yrs} yrs)`} value={gbp(rentCost)} accent={!buyingCheaper} sub="Money you don't get back" />
        <ResultStat label={`Buying (${yrs} yrs)`} value={gbp(buyCost)} accent={buyingCheaper} sub="Excludes your equity" />
      </div>

      <div className="rounded-2xl border border-navy-100 p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-navy-500">Buying breakdown</div>
        <ResultRow label="Monthly mortgage payment" value={gbp(monthlyPayment)} />
        <ResultRow label="Stamp Duty (SDLT)" value={gbp(sdlt)} />
        <ResultRow label="Buying fees (est.)" value={gbp(BUYING_FEES)} />
        <ResultRow label={`Mortgage interest (${yrs} yrs)`} value={gbp(interestPaid)} />
        <ResultRow label={`Maintenance (${yrs} yrs)`} value={gbp(maintenance)} />
        <div className="my-1 border-t border-navy-100" />
        <ResultRow label="Equity you'd build" value={gbp(equityBuilt)} strong />
      </div>

      <Assumptions>
        We compare the money you <strong>don't</strong> get back: total rent vs. the Stamp Duty, fees,
        mortgage interest and maintenance of buying. Your deposit and the mortgage principal you repay
        ({gbp(equityBuilt)}) stay yours as equity, so they're shown separately. We assume rent and the
        mortgage rate stay flat, maintenance is ~1% of the price a year, and we ignore house-price changes
        (which can go up or down). Stamp Duty uses England &amp; NI rates; Scotland (LBTT) and Wales (LTT)
        differ. A guide, not advice.
      </Assumptions>
    </div>
  );
}
