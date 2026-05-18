import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { fmt, fmtFull, monthlyPayment, amortSchedule, sdltCalc, pct } from "@/lib/format";
import { MORTGAGE_STORAGE_KEY } from "@/data/journey";
import { useScenario } from "@/context/ScenarioContext";
import LiveRateBanner from "@/components/LiveRateBanner";
import Jargon from "@/components/Jargon";
import Comparator from "@/components/Comparator";

interface Product {
  label: string;
  initialYears: number;
  productFee: number;
  ltvBands: Record<number, number | null>;
}
const SVR = 7.99; // assumed reversion rate after initial period

const RATES_DB: Record<string, Product> = {
  "2yr_fix": { label: "2-Year Fixed", initialYears: 2, productFee: 999, ltvBands: { 60: 3.89, 70: 4.05, 75: 4.09, 80: 4.19, 85: 4.44, 90: 4.69, 95: 5.09 } },
  "5yr_fix": { label: "5-Year Fixed", initialYears: 5, productFee: 999, ltvBands: { 60: 3.79, 70: 3.93, 75: 3.99, 80: 4.09, 85: 4.29, 90: 4.49, 95: 4.89 } },
  "10yr_fix": { label: "10-Year Fixed", initialYears: 10, productFee: 1499, ltvBands: { 60: 4.05, 70: 4.15, 75: 4.20, 80: 4.35, 85: 4.55, 90: 4.79, 95: null } },
  tracker: { label: "Tracker (BoE+)", initialYears: 2, productFee: 0, ltvBands: { 60: 4.99, 70: 5.09, 75: 5.14, 80: 5.24, 85: 5.44, 90: 5.69, 95: null } },
};

const getRateForLTV = (productKey: string, ltv: number) => {
  const bands = RATES_DB[productKey]?.ltvBands || {};
  const sorted = Object.keys(bands).map(Number).sort((a, b) => a - b);
  for (const band of sorted) if (ltv <= band) return bands[band];
  return bands[sorted[sorted.length - 1]];
};

// Total cost over an initial period: monthly payments × months at initial rate, + product fee.
const totalCostInitial = (principal: number, ratePct: number, termYears: number, initialYears: number, fee: number) => {
  const r = ratePct / 100 / 12;
  const n = termYears * 12;
  const mp = r === 0 ? principal / n : (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  return mp * initialYears * 12 + fee;
};

export default function Mortgage() {
  const { scenario, setScenario, depositPct: scenarioDepositPct } = useScenario();
  const saved = (() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(MORTGAGE_STORAGE_KEY) || "null"); } catch { return null; }
  })();

  const price = scenario.price;
  const setPrice = (price: number) => setScenario({ price });
  const depositPct = Math.round(scenarioDepositPct);
  const setDepositPct = (pct: number) => setScenario({ deposit: Math.round(scenario.price * pct / 100) });
  const term = scenario.term;
  const setTerm = (term: number) => setScenario({ term });
  const income = scenario.income;
  const setIncome = (income: number) => setScenario({ income });

  const [productKey, setProductKey] = useState<string>(saved?.productKey ?? "5yr_fix");
  const [overpay, setOverpay] = useState<number>(saved?.overpay ?? 0);

  useEffect(() => {
    try {
      localStorage.setItem(
        MORTGAGE_STORAGE_KEY,
        JSON.stringify({ price, depositPct, term, productKey, income, overpay })
      );
    } catch {
      // ignore localStorage errors
    }
  }, [price, depositPct, term, productKey, income, overpay]);

  const deposit = Math.round((price * depositPct) / 100);
  const principal = price - deposit;
  const ltv = Math.round((principal / price) * 100);
  const ltvBand = [60, 70, 75, 80, 85, 90, 95].find((b) => ltv <= b) ?? 95;
  const rate = getRateForLTV(productKey, ltv) ?? 5;
  // Push the indicative rate back into the shared scenario so other tools see it
  useEffect(() => { if (rate && rate !== scenario.rate) setScenario({ rate }); }, [rate, scenario.rate, setScenario]);
  const mp = monthlyPayment(principal, rate, term);
  const totalPaid = mp * term * 12;
  const totalInt = totalPaid - principal;
  const sdlt = sdltCalc(price);
  const amort = useMemo(() => amortSchedule(principal, rate, term), [principal, rate, term]);

  // APRC: representative APR including reversion to SVR after the initial period.
  const product = RATES_DB[productKey];
  const aprc = useMemo(() => {
    const initialMonths = product.initialYears * 12;
    const remainingMonths = term * 12 - initialMonths;
    const initialMp = mp;
    // approximate balance at end of initial period
    let bal = principal;
    const r0 = rate / 100 / 12;
    for (let m = 0; m < Math.min(initialMonths, term * 12); m++) {
      bal = bal * (1 + r0) - initialMp;
    }
    bal = Math.max(0, bal);
    // Monthly payment after reversion (re-amortise residual over remaining months)
    const r1 = SVR / 100 / 12;
    const revertMp = remainingMonths > 0 && bal > 0
      ? (bal * (r1 * Math.pow(1 + r1, remainingMonths))) / (Math.pow(1 + r1, remainingMonths) - 1)
      : 0;
    const totalPaid = initialMp * Math.min(initialMonths, term * 12) + revertMp * Math.max(0, remainingMonths) + product.productFee;
    const blendedRate = ((totalPaid - principal) / principal / term) * 100; // simplified APRC proxy
    return { revertMp, totalPaid, blendedRate, balanceAtRefix: bal };
  }, [product, term, mp, principal, rate, productKey]);

  // Compare every product side-by-side at total cost over initial period
  const productCompare = useMemo(() =>
    Object.entries(RATES_DB).map(([k, p]) => {
      const r = getRateForLTV(k, ltv);
      if (r == null) return { k, label: p.label, rate: null, monthly: 0, totalInitial: 0, fee: p.productFee, initialYears: p.initialYears };
      const monthly = monthlyPayment(principal, r, term);
      const totalInitial = totalCostInitial(principal, r, term, p.initialYears, p.productFee);
      return { k, label: p.label, rate: r, monthly, totalInitial, fee: p.productFee, initialYears: p.initialYears };
    }), [principal, term, ltv]);

  // Overpayment
  const overpayResult = useMemo(() => {
    if (overpay <= 0) return { yearsSaved: 0, intSaved: 0, newTerm: term };
    const r = rate / 100 / 12;
    let bal = principal;
    let months = 0;
    const target = mp + overpay;
    while (bal > 0 && months < term * 12) {
      const interest = bal * r;
      const cap = Math.min(target - interest, bal);
      bal = bal - cap;
      months++;
    }
    return {
      yearsSaved: Math.round(((term * 12 - months) / 12) * 10) / 10,
      intSaved: Math.round((term * 12 - months) * mp * 0.55),
      newTerm: Math.round((months / 12) * 10) / 10,
    };
  }, [overpay, principal, rate, mp, term]);

  // Affordability
  const maxBorrow = income * 4.5;
  const stressMp = monthlyPayment(principal, 7, term);
  const stressPct = income > 0 ? Math.round((stressMp / (income / 12)) * 100) : 0;
  const stressOk = stressPct <= 40;

  return (
    <div>
      <PageHeader
        eyebrow="Tool · Mortgage"
        title="Calculate, compare and stress‑test your mortgage."
        description="Live UK rates by LTV band, with affordability checks and overpayment modelling. Designed for first‑time buyers."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <LiveRateBanner ltv={ltv} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 grid lg:grid-cols-12 gap-6">
        {/* Inputs */}
        <Card className="lg:col-span-4 p-6 h-fit lg:sticky lg:top-20 shadow-soft">
          <h3 className="font-serif text-lg font-bold text-brand mb-5">Your numbers</h3>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Property price</Label>
                <span className="font-mono text-sm font-semibold text-brand">{fmtFull(price)}</span>
              </div>
              <Slider value={[price]} min={100_000} max={1_500_000} step={5_000} onValueChange={(v) => setPrice(v[0])} />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Deposit</Label>
                <span className="font-mono text-sm font-semibold text-brand">{depositPct}% · {fmtFull(deposit)}</span>
              </div>
              <Slider value={[depositPct]} min={5} max={95} step={1} onValueChange={(v) => setDepositPct(v[0])} />
              <p className="text-xs text-muted-foreground mt-2">
                <Jargon term="LTV" />: <span className="font-mono font-semibold text-foreground">{ltv}%</span> - applied band: {ltvBand}%
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Term</Label>
                <span className="font-mono text-sm font-semibold text-brand">{term} years</span>
              </div>
              <Slider value={[term]} min={5} max={40} step={1} onValueChange={(v) => setTerm(v[0])} />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Mortgage product</Label>
              <Select value={productKey} onValueChange={setProductKey}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RATES_DB).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Gross annual income</Label>
              <NumberInput
                value={income}
                onChange={setIncome}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Max borrow @ 4.5×: <span className="font-mono font-semibold text-foreground">{fmtFull(maxBorrow)}</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="lg:col-span-8 space-y-6">
          {/* Headline */}
          <Card className="p-7 bg-gradient-brand text-brand-foreground shadow-card border-0">
            <p className="text-[11px] uppercase tracking-[0.2em] opacity-75">Monthly repayment</p>
            <p className="font-serif text-5xl font-bold mt-2 tracking-tight">{fmtFull(mp)}</p>
            <p className="opacity-80 mt-2 text-sm">
              {RATES_DB[productKey].label} at <span className="font-mono font-semibold">{pct(rate)}</span> · {term}‑year term
            </p>

            <Separator className="my-5 bg-brand-foreground/20" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {[
                { l: "Loan", v: fmt(principal) },
                { l: "Deposit", v: fmt(deposit) },
                { l: "Total interest", v: fmt(totalInt) },
                { l: "Stamp duty", v: fmt(sdlt) },
              ].map((x) => (
                <div key={x.l}>
                  <p className="text-[10px] uppercase tracking-widest opacity-70">{x.l}</p>
                  <p className="font-mono text-xl font-semibold mt-1">{x.v}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Affordability + stress */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="p-6 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-bold text-brand">Affordability</h4>
                <Badge className={principal <= maxBorrow ? "bg-success/15 text-success border-0" : "bg-destructive/15 text-destructive border-0"}>
                  {principal <= maxBorrow ? "Within reach" : "Over limit"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                You're borrowing <Comparator
                  value={`${(principal / Math.max(income, 1)).toFixed(1)}×`}
                  context={principal <= maxBorrow ? "within typical 4.5× cap" : "above typical 4.5× cap"}
                  tone={principal <= maxBorrow ? "good" : "bad"}
                  className="!inline-flex !flex-row !items-baseline !gap-2 align-baseline"
                /> your income.
              </p>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${principal <= maxBorrow ? "bg-success" : "bg-destructive"}`}
                  style={{ width: `${Math.min(100, (principal / maxBorrow) * 100)}%` }}
                />
              </div>
            </Card>

            <Card className="p-6 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-bold text-brand">Stress test @ 7%</h4>
                <Badge className={stressOk ? "bg-success/15 text-success border-0" : "bg-warning/20 text-warning border-0"}>
                  {stressOk ? <TrendingUp className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                  {stressOk ? "Likely pass" : "Stretched"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                At a 7% stress rate your payment would be <span className="font-mono font-semibold text-foreground">{fmtFull(stressMp)}</span> - {stressPct}% of monthly income.
              </p>
            </Card>
          </div>

          {/* Tabs: rates | overpay | schedule */}
          <Card className="p-6 shadow-soft">
            <Tabs defaultValue="compare">
              <TabsList className="mb-5">
                <TabsTrigger value="compare">Product compare</TabsTrigger>
                <TabsTrigger value="rates">Rate finder</TabsTrigger>
                <TabsTrigger value="refix">Refix horizon</TabsTrigger>
                <TabsTrigger value="overpay">Overpayments</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>

              <TabsContent value="compare" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Total cost over the initial period - rate × monthly × months + product fee. Cheapest headline isn't always cheapest in cash.
                </p>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                        <th className="px-2 py-2">Product</th>
                        <th className="px-2 py-2 text-right">Rate</th>
                        <th className="px-2 py-2 text-right">Monthly</th>
                        <th className="px-2 py-2 text-right">Initial yrs</th>
                        <th className="px-2 py-2 text-right">Product fee</th>
                        <th className="px-2 py-2 text-right">Total over initial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productCompare
                        .slice()
                        .sort((a, b) => (a.rate == null ? 1 : b.rate == null ? -1 : a.totalInitial - b.totalInitial))
                        .map((p, i) => (
                          <tr
                            key={p.k}
                            onClick={() => p.rate != null && setProductKey(p.k)}
                            className={`cursor-pointer border-t hover:bg-muted/50 ${p.k === productKey ? "bg-brand-muted/40" : ""}`}
                          >
                            <td className="px-2 py-3 font-medium">
                              {i === 0 && p.rate != null && <Badge className="bg-success/15 text-success border-0 mr-2 text-[10px]">Cheapest</Badge>}
                              {p.label}
                            </td>
                            <td className="px-2 py-3 text-right font-mono">{p.rate ? pct(p.rate) : "-"}</td>
                            <td className="px-2 py-3 text-right font-mono">{p.rate ? fmtFull(p.monthly) : "-"}</td>
                            <td className="px-2 py-3 text-right font-mono">{p.initialYears}</td>
                            <td className="px-2 py-3 text-right font-mono">{fmtFull(p.fee)}</td>
                            <td className="px-2 py-3 text-right font-mono font-semibold">{p.rate ? fmtFull(p.totalInitial) : "-"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="refix" className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  After your {product.initialYears}-year initial period ends, payments revert to the lender's SVR ({SVR}%) unless you remortgage.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { l: "Initial monthly", v: fmtFull(mp) },
                    { l: "Reversion monthly", v: fmtFull(aprc.revertMp) },
                    { l: "Balance at refix", v: fmt(aprc.balanceAtRefix) },
                    { l: "APRC (proxy)", v: pct(Math.max(0, aprc.blendedRate)) },
                  ].map((s) => (
                    <div key={s.l} className="border-l-2 border-brand/40 pl-3">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.l}</p>
                      <p className="font-mono text-lg font-semibold text-brand mt-1">{s.v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Payment shock at refix: <span className={`font-mono font-semibold ${aprc.revertMp > mp ? "text-destructive" : "text-success"}`}>
                    {aprc.revertMp > mp ? "+" : ""}{fmtFull(aprc.revertMp - mp)}/mo
                  </span>. Plan to remortgage 6 months before the fix ends.
                </p>
              </TabsContent>

              <TabsContent value="rates" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Live indicative UK rates by LTV band. Click a row to apply. Your LTV: <span className="font-mono font-semibold text-foreground">{ltv}%</span>.
                </p>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                        <th className="px-2 py-2">Product</th>
                        {[60, 70, 75, 80, 85, 90, 95].map((b) => (
                          <th key={b} className={`px-2 py-2 text-right ${b === ltvBand ? "text-brand" : ""}`}>
                            {b}%{b === ltvBand ? " ◀" : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(RATES_DB).map(([pk, prod]) => (
                        <tr
                          key={pk}
                          onClick={() => setProductKey(pk)}
                          className={`cursor-pointer border-t hover:bg-muted/50 ${pk === productKey ? "bg-brand-muted/40" : ""}`}
                        >
                          <td className="px-2 py-3 font-medium">{prod.label}</td>
                          {[60, 70, 75, 80, 85, 90, 95].map((b) => {
                            const r = prod.ltvBands[b];
                            const isYou = b === ltvBand && pk === productKey;
                            return (
                              <td key={b} className={`px-2 py-3 text-right font-mono ${isYou ? "text-brand font-bold" : "text-foreground"}`}>
                                {r ? pct(r) : "-"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="overpay" className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Monthly overpayment</Label>
                    <span className="font-mono text-sm font-semibold text-brand">
                      {overpay === 0 ? "None" : fmtFull(overpay) + "/mo"}
                    </span>
                  </div>
                  <Slider value={[overpay]} min={0} max={2000} step={50} onValueChange={(v) => setOverpay(v[0])} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  {[
                    { l: "New term", v: overpay > 0 ? `${overpayResult.newTerm} yrs` : `${term} yrs` },
                    { l: "Years saved", v: overpay > 0 ? `${overpayResult.yearsSaved} yrs` : "-" },
                    { l: "Interest saved", v: overpay > 0 ? fmt(overpayResult.intSaved) : "-" },
                  ].map((s) => (
                    <div key={s.l} className="border-l-2 border-brand/40 pl-3">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.l}</p>
                      <p className="font-mono text-lg font-semibold text-brand mt-1">{s.v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <TrendingDown className="w-3.5 h-3.5 mt-0.5 shrink-0 text-success" />
                  Most UK lenders allow up to 10% of the balance per year overpayment without an early repayment charge.
                </p>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-3">
                <p className="text-sm text-muted-foreground">First 10 years of your repayment schedule.</p>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                        <th className="px-2 py-2">Year</th>
                        <th className="px-2 py-2 text-right">Capital</th>
                        <th className="px-2 py-2 text-right">Interest</th>
                        <th className="px-2 py-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {amort.slice(0, 10).map((row) => (
                        <tr key={row.year} className="border-t">
                          <td className="px-2 py-2.5 font-mono">{row.year}</td>
                          <td className="px-2 py-2.5 text-right font-mono text-success">{fmtFull(row.capitalPaid)}</td>
                          <td className="px-2 py-2.5 text-right font-mono text-muted-foreground">{fmtFull(row.interestPaid)}</td>
                          <td className="px-2 py-2.5 text-right font-mono font-semibold">{fmt(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
