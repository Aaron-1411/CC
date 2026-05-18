// Remortgage comparator — best-in-class.
//
// Improvements over v1:
//  • Apples-to-apples: every option is costed over the SAME chosen horizon.
//    "Stay" correctly models current rate for the remaining ERC period, then
//    reverts to SVR for the rest of the horizon.
//  • Overpayments (monthly + lump sum) — the single biggest lever a homeowner
//    has. Recurring overpayments are applied each month, lump sum at month 0.
//  • Cashback and broker fee fields — match real-world product comparisons.
//  • "Net cost of borrowing" = interest + fees − cashback over horizon.
//    This is the only fair single-number score across different fix lengths.
//  • ERC-free booking window timeline (most lenders allow 6 months early).
//  • "What if rates fall / rise" both directions on the stress chart.
//  • Plain-English jargon (ERC, SVR, LTV) inline.
//  • Recommendation explains *why* with the trade-offs, not just the winner.
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Trash2, TrendingDown, TrendingUp, AlertTriangle, Info,
  ArrowRight, Sparkles, CalendarClock, Shield, PiggyBank, Wallet, FileDown,
} from "lucide-react";
import { exportRemortgagePdf } from "@/lib/remortgageExport";
import { toast } from "@/hooks/use-toast";
import { fmt, fmtFull, monthlyPayment, pct as pctFmt } from "@/lib/format";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid,
  LineChart, Line, Legend, ReferenceLine,
} from "recharts";
import { useLiveMortgageRates, rateForLtv } from "@/hooks/use-live-mortgage-rates";
import { useBoeRates } from "@/hooks/use-boe-rates";
import FreshnessPill from "@/components/FreshnessPill";
import LiveRateBanner from "@/components/LiveRateBanner";
import Jargon from "@/components/Jargon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Option = {
  id: string;
  label: string;
  rate: number;          // % APR initial period
  initialYears: number;  // 0 = "stay/SVR" path
  productFee: number;    // £, can be added to loan in real life — we charge upfront for clarity
  followOnRate: number;  // % SVR after deal ends
  cashback: number;      // £ cashback at completion
  isStay?: boolean;      // marks the "do nothing" baseline
};

const newId = () => Math.random().toString(36).slice(2, 9);

// ----- Calculations ----------------------------------------------------------

/**
 * Simulate month-by-month over `horizonMonths`. Supports a rate that switches
 * after `initialMonths` to `followOnRate`, plus monthly overpayments and an
 * upfront lump sum reduction. Returns total paid, interest, ending balance.
 */
function simulate(opts: {
  startBalance: number;
  termYears: number;
  initialRate: number;
  initialMonths: number;
  followOnRate: number;
  horizonMonths: number;
  monthlyOverpay: number;
  lumpSum: number;
  upfrontFees: number;
  cashback: number;
}) {
  const {
    startBalance, termYears, initialRate, initialMonths, followOnRate,
    horizonMonths, monthlyOverpay, lumpSum, upfrontFees, cashback,
  } = opts;

  let balance = Math.max(0, startBalance - lumpSum);
  let interestPaid = 0;
  let principalPaid = lumpSum;
  let scheduledPaid = 0;
  let overpaid = 0;
  let monthsRemaining = termYears * 12;
  let mpInitial = monthlyPayment(balance, initialRate, monthsRemaining / 12);
  let mpFollow = monthlyPayment(balance, followOnRate, monthsRemaining / 12);

  for (let m = 0; m < horizonMonths; m++) {
    if (balance <= 0) break;
    const inInitial = m < initialMonths;
    const ratePct = inInitial ? initialRate : followOnRate;
    const r = ratePct / 100 / 12;
    const interest = balance * r;
    // Recompute scheduled payment when reverting (re-amortise over remaining term).
    if (m === initialMonths) {
      mpFollow = monthlyPayment(balance, followOnRate, Math.max(1, monthsRemaining) / 12);
    }
    const mp = inInitial ? mpInitial : mpFollow;
    const capital = Math.min(balance, mp - interest);
    balance -= capital;
    interestPaid += interest;
    principalPaid += capital;
    scheduledPaid += mp;
    monthsRemaining -= 1;
    // Apply overpayment after scheduled payment, capped at balance.
    if (monthlyOverpay > 0 && balance > 0) {
      const op = Math.min(balance, monthlyOverpay);
      balance -= op;
      principalPaid += op;
      overpaid += op;
    }
  }
  const totalCash = scheduledPaid + overpaid + upfrontFees - cashback + lumpSum;
  // "Net cost of borrowing" over horizon = interest + fees − cashback.
  // (Capital repayment isn't a cost — it's equity built.)
  const netCost = interestPaid + upfrontFees - cashback;
  return {
    monthlyInitial: mpInitial,
    monthlyFollow: mpFollow,
    interestPaid,
    principalPaid,
    overpaid,
    balanceEnd: balance,
    totalCash,
    netCost,
  };
}

const ercFor = (balance: number, ercPct: number) => Math.max(0, balance * (ercPct / 100));

// ----- Component -------------------------------------------------------------

export default function Remortgage() {
  // Current situation
  const [balance, setBalance] = useState(220_000);
  const [propertyValue, setPropertyValue] = useState(330_000);
  const [termRemaining, setTermRemaining] = useState(22);
  const [currentRate, setCurrentRate] = useState(2.49);
  const [currentSvr, setCurrentSvr] = useState(7.99);
  const [monthsLeftOnDeal, setMonthsLeftOnDeal] = useState(4);
  const [ercPct, setErcPct] = useState(2);
  const [legalFees, setLegalFees] = useState(300);
  const [brokerFee, setBrokerFee] = useState(0);

  // Levers
  const [monthlyOverpay, setMonthlyOverpay] = useState(0);
  const [lumpSum, setLumpSum] = useState(0);
  const [horizonYears, setHorizonYears] = useState(5);

  // Affordability check
  const [affordEnabled, setAffordEnabled] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState(4200);
  const [monthlyExpenses, setMonthlyExpenses] = useState(1800);

  const [exporting, setExporting] = useState(false);

  const ltv = Math.min(100, Math.round((balance / Math.max(1, propertyValue)) * 100));
  const horizonMonths = horizonYears * 12;

  const live = useLiveMortgageRates();
  const boe = useBoeRates();
  const baseRate = boe.data?.latest;

  const [options, setOptions] = useState<Option[]>(() => [
    { id: newId(), label: "Do nothing (revert to SVR)", rate: 0, initialYears: 0, productFee: 0, followOnRate: 7.99, cashback: 0, isStay: true },
    { id: newId(), label: "5-year fixed", rate: 4.29, initialYears: 5, productFee: 999, followOnRate: 7.99, cashback: 250 },
    { id: newId(), label: "2-year fixed", rate: 4.59, initialYears: 2, productFee: 0, followOnRate: 7.99, cashback: 0 },
  ]);

  const fillFromLive = () => {
    if (!baseRate) return;
    const r5 = rateForLtv(ltv, baseRate);
    const r2 = Number((r5 + 0.3).toFixed(2));
    const r3 = Number((r5 - 0.1).toFixed(2));
    setOptions([
      { id: newId(), label: "Do nothing (revert to SVR)", rate: 0, initialYears: 0, productFee: 0, followOnRate: currentSvr, cashback: 0, isStay: true },
      { id: newId(), label: `Live 2-yr fix @ ${ltv}% LTV`, rate: r2, initialYears: 2, productFee: 999, followOnRate: currentSvr, cashback: 250 },
      { id: newId(), label: `Live 3-yr fix @ ${ltv}% LTV`, rate: r3, initialYears: 3, productFee: 999, followOnRate: currentSvr, cashback: 250 },
      { id: newId(), label: `Live 5-yr fix @ ${ltv}% LTV`, rate: r5, initialYears: 5, productFee: 999, followOnRate: currentSvr, cashback: 250 },
    ]);
  };

  // --- Baseline: the cheapest reference for "vs today" comparisons.
  const currentMonthly = useMemo(
    () => monthlyPayment(balance, currentRate, termRemaining),
    [balance, currentRate, termRemaining],
  );


  // Per-option simulation over the SHARED horizon.
  const rows = useMemo(() => {
    return options.map((o) => {
      const isStay = !!o.isStay;
      const initialRate = isStay ? currentRate : o.rate;
      const initialMonths = isStay ? monthsLeftOnDeal : Math.min(o.initialYears * 12, horizonMonths);
      const followOnRate = o.followOnRate;
      const ercCost = isStay ? 0 : (monthsLeftOnDeal > 0 ? ercFor(balance, ercPct) : 0);
      const legalAndBroker = isStay ? 0 : (legalFees + brokerFee);
      const productFee = isStay ? 0 : o.productFee;
      const upfrontFees = ercCost + legalAndBroker + productFee;
      const cashback = isStay ? 0 : o.cashback;

      const sim = simulate({
        startBalance: balance,
        termYears: termRemaining,
        initialRate,
        initialMonths,
        followOnRate,
        horizonMonths,
        monthlyOverpay,
        lumpSum,
        upfrontFees,
        cashback,
      });

      const monthlyDelta = sim.monthlyInitial - currentMonthly;
      const monthlySaving = -monthlyDelta;
      const breakevenMonths = !isStay && monthlySaving > 0
        ? Math.ceil((upfrontFees - cashback) / monthlySaving)
        : null;

      return {
        ...o,
        ...sim,
        initialMonths,
        upfrontFees,
        ercCost,
        legalAndBroker,
        productFee,
        monthlyDelta,
        monthlySaving,
        breakevenMonths,
      };
    });
  }, [options, balance, termRemaining, currentRate, currentMonthly, horizonMonths, monthlyOverpay, lumpSum, monthsLeftOnDeal, ercPct, legalFees, brokerFee]);

  // Best = lowest net cost of borrowing over the horizon.
  const best = useMemo(
    () => rows.reduce((a, b) => (a && a.netCost < b.netCost ? a : b), rows[0]),
    [rows],
  );
  const stayRow = rows.find((r) => r.isStay);
  const savingsVsStay = stayRow && best ? stayRow.netCost - best.netCost : 0;

  // ----- Charts --------------------------------------------------------------

  const truncate = (s: string) => (s.length > 22 ? s.slice(0, 20) + "…" : s);

  const monthlyChart = rows.map((r) => ({
    name: truncate(r.label),
    monthly: Math.round(r.monthlyInitial),
  }));

  const stressChart = useMemo(() => {
    // Show payment under different SVR-shock scenarios at re-fix time.
    const shocks = [-1, 0, 1, 2, 3];
    return shocks.map((s) => {
      const point: Record<string, number | string> = { stress: s === 0 ? "today" : `${s > 0 ? "+" : ""}${s}%` };
      rows.forEach((r) => {
        const sim2 = simulate({
          startBalance: balance,
          termYears: termRemaining,
          initialRate: r.isStay ? currentRate : r.rate,
          initialMonths: r.initialMonths,
          followOnRate: (r.isStay ? currentSvr : r.followOnRate) + s,
          horizonMonths,
          monthlyOverpay,
          lumpSum,
          upfrontFees: 0,
          cashback: 0,
        });
        // Reported metric: monthly payment in final month of horizon.
        point[truncate(r.label)] = Math.round(
          monthlyPayment(sim2.balanceEnd, (r.isStay ? currentSvr : r.followOnRate) + s,
            Math.max(1, termRemaining - horizonYears)),
        );
      });
      return point;
    });
  }, [rows, balance, termRemaining, currentRate, currentSvr, horizonMonths, horizonYears, monthlyOverpay, lumpSum]);

  const updateOpt = (id: string, patch: Partial<Option>) =>
    setOptions((arr) => arr.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const addOpt = () =>
    setOptions((arr) => [...arr, { id: newId(), label: `Option ${arr.length + 1}`, rate: 4.5, initialYears: 5, productFee: 999, followOnRate: currentSvr, cashback: 0 }]);
  const removeOpt = (id: string) => setOptions((arr) => arr.filter((o) => o.id !== id));

  const palette = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--brand))", "hsl(var(--warning))", "hsl(var(--destructive))"];

  // ERC-free booking window: most lenders let you secure a new deal up to 6
  // months before the current one ends.
  const bookingWindowOpensInMonths = Math.max(0, monthsLeftOnDeal - 6);

  // Affordability calc — base disposable income before housing.
  const baseDisposable = monthlyIncome - monthlyExpenses;

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportRemortgagePdf({
        inputs: {
          balance, propertyValue, ltv, termRemaining, currentRate, currentSvr,
          monthsLeftOnDeal, ercPct, legalFees, brokerFee,
          monthlyOverpay, lumpSum, horizonYears, currentMonthly,
        },
        rows: rows.map((r) => ({
          id: r.id, label: r.label, isStay: r.isStay,
          rate: r.rate, initialYears: r.initialYears, followOnRate: r.followOnRate,
          monthlyInitial: r.monthlyInitial, monthlyDelta: r.monthlyDelta,
          interestPaid: r.interestPaid, productFee: r.productFee,
          ercCost: r.ercCost, legalAndBroker: r.legalAndBroker,
          cashback: r.cashback, overpaid: r.overpaid,
          netCost: r.netCost, balanceEnd: r.balanceEnd,
          breakevenMonths: r.breakevenMonths,
        })),
        bestId: best?.id,
        affordability: { enabled: affordEnabled, monthlyIncome, monthlyExpenses },
        chartElementIds: ["remortgage-chart-monthly", "remortgage-chart-stress"],
      });
      toast({ title: "PDF ready", description: "Your comparison has been downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Couldn't generate PDF", description: "Please try again.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="For homeowners"
        title="Remortgage comparator"
        description="One honest number per option: net cost of borrowing over your chosen horizon. Includes fees, cashback, ERCs and overpayments."
        documentTitle="Remortgage comparator"
        actions={
          <div className="flex items-center gap-2">
            {baseRate != null && <FreshnessPill source={`BoE base rate · ${baseRate}%`} updatedAt={new Date()} />}
            <Button size="sm" onClick={handleExportPdf} disabled={exporting}>
              <FileDown className="h-3.5 w-3.5 mr-1.5" />
              {exporting ? "Generating…" : "Download PDF"}
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <LiveRateBanner ltv={ltv} />

        {/* Inputs */}
        <Card className="shadow-soft">
          <CardContent className="p-6 grid md:grid-cols-3 gap-5">
            <div className="space-y-1">
              <Label>Mortgage balance outstanding</Label>
              <NumberInput value={balance} onChange={(v) => setBalance(v ?? 0)} step={1000} />
            </div>
            <div className="space-y-1">
              <Label>Estimated property value</Label>
              <NumberInput value={propertyValue} onChange={(v) => setPropertyValue(v ?? 0)} step={5000} />
              <p className="text-[11px] text-muted-foreground">
                <Jargon term="LTV" />: <span className="font-mono font-semibold text-foreground">{ltv}%</span>
                {ltv >= 90 && <span className="text-warning ml-1">— rates jump above 90%</span>}
                {ltv <= 60 && <span className="text-success ml-1">— you'll see the sharpest rates</span>}
              </p>
            </div>
            <div className="space-y-1">
              <Label>Term remaining (years)</Label>
              <Slider min={5} max={35} step={1} value={[termRemaining]} onValueChange={(v) => setTermRemaining(v[0])} />
              <p className="text-[11px] text-muted-foreground font-mono">{termRemaining} years</p>
            </div>

            <div className="space-y-1">
              <Label>Your current rate (%)</Label>
              <NumberInput value={currentRate} onChange={(v) => setCurrentRate(v ?? 0)} step={0.05} />
            </div>
            <div className="space-y-1">
              <Label>
                Months left on current deal{" "}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 inline-block ml-0.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Most lenders let you lock in your next rate up to <strong>6 months early</strong> with no
                    Early Repayment Charge. We highlight that window below.
                  </TooltipContent>
                </Tooltip>
              </Label>
              <NumberInput value={monthsLeftOnDeal} onChange={(v) => setMonthsLeftOnDeal(v ?? 0)} step={1} />
            </div>
            <div className="space-y-1">
              <Label>
                ERC %{" "}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 inline-block ml-0.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <strong>Early Repayment Charge</strong> — typically 1–5% of the balance, only if you exit
                    the fix early. Drops each year of the deal. Check your offer letter.
                  </TooltipContent>
                </Tooltip>
              </Label>
              <NumberInput value={ercPct} onChange={(v) => setErcPct(v ?? 0)} step={0.5} />
              <p className="text-[11px] text-muted-foreground">
                ≈ {fmtFull(ercFor(balance, ercPct))} if you switch now
              </p>
            </div>

            <div className="space-y-1">
              <Label>Lender's <Jargon term="SVR" /> (revert rate, %)</Label>
              <NumberInput value={currentSvr} onChange={(v) => setCurrentSvr(v ?? 0)} step={0.05} />
              <p className="text-[11px] text-muted-foreground">
                Standard Variable Rate — what you fall on to if you do nothing.
              </p>
            </div>
            <div className="space-y-1">
              <Label>Legal / valuation fees</Label>
              <NumberInput value={legalFees} onChange={(v) => setLegalFees(v ?? 0)} step={50} />
            </div>
            <div className="space-y-1">
              <Label>Broker fee</Label>
              <NumberInput value={brokerFee} onChange={(v) => setBrokerFee(v ?? 0)} step={50} />
            </div>
          </CardContent>
        </Card>

        {/* Levers */}
        <Card className="shadow-soft border-accent/30 bg-accent/[0.03]">
          <CardContent className="p-6 grid md:grid-cols-3 gap-5">
            <div className="md:col-span-3 flex items-center gap-2 -mb-1">
              <PiggyBank className="h-4 w-4 text-accent" />
              <h2 className="font-serif text-lg text-brand font-bold">Pull the levers</h2>
              <span className="text-xs text-muted-foreground">— overpayments and horizon change which deal wins.</span>
            </div>
            <div className="space-y-1">
              <Label>Compare over (years)</Label>
              <Slider min={1} max={Math.min(termRemaining, 30)} step={1} value={[horizonYears]} onValueChange={(v) => setHorizonYears(v[0])} />
              <p className="text-[11px] text-muted-foreground font-mono">{horizonYears}-year horizon</p>
            </div>
            <div className="space-y-1">
              <Label>Monthly overpayment (£)</Label>
              <NumberInput value={monthlyOverpay} onChange={(v) => setMonthlyOverpay(v ?? 0)} step={50} />
              <p className="text-[11px] text-muted-foreground">Most lenders allow up to 10%/yr penalty-free.</p>
            </div>
            <div className="space-y-1">
              <Label>One-off lump sum now (£)</Label>
              <NumberInput value={lumpSum} onChange={(v) => setLumpSum(v ?? 0)} step={1000} />
              <p className="text-[11px] text-muted-foreground">Applied at month 0 to every option fairly.</p>
            </div>
          </CardContent>
        </Card>

        {/* ERC-free booking window */}
        {monthsLeftOnDeal > 0 && (
          <Card className="shadow-soft border-primary/30 bg-primary/[0.03]">
            <CardContent className="p-5 flex items-start gap-3">
              <CalendarClock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-brand text-sm">ERC-free booking window</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Most lenders let you reserve a new rate up to 6 months before your current deal ends — no penalty.
                </p>
                <div className="mt-3 relative h-2 bg-muted rounded-full overflow-hidden">
                  {(() => {
                    const total = Math.max(monthsLeftOnDeal, 6);
                    const windowStart = (bookingWindowOpensInMonths / total) * 100;
                    return (
                      <>
                        <div className="absolute inset-y-0 left-0 bg-warning/40" style={{ width: `${windowStart}%` }} />
                        <div className="absolute inset-y-0 bg-accent" style={{ left: `${windowStart}%`, right: 0 }} />
                      </>
                    );
                  })()}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-mono">
                  <span>now</span>
                  <span className={cn(bookingWindowOpensInMonths === 0 ? "text-accent font-semibold" : "text-warning")}>
                    {bookingWindowOpensInMonths === 0 ? "✓ Window OPEN — book now" : `Window opens in ${bookingWindowOpensInMonths} mo`}
                  </span>
                  <span>deal ends ({monthsLeftOnDeal} mo)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Options table */}
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="font-serif text-xl text-brand font-bold">Compare options</h2>
                <p className="text-xs text-muted-foreground">
                  All costed over the same {horizonYears}-year horizon. Edit fields, or pull live rates.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={fillFromLive} disabled={!baseRate}>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Use live rates
                </Button>
                <Button size="sm" onClick={addOpt}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add option
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {options.map((o, i) => {
                const row = rows[i];
                const isBest = best && row.id === best.id;
                return (
                  <div key={o.id} className={cn(
                    "rounded-lg border p-4 space-y-3 transition-colors",
                    isBest && "border-accent ring-1 ring-accent/40 bg-accent/5",
                    o.isStay && "bg-muted/30",
                  )}>
                    <div className="grid md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Label</Label>
                        <Input value={o.label} onChange={(e) => updateOpt(o.id, { label: e.target.value })} />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Initial rate %</Label>
                        <NumberInput value={o.rate} onChange={(v) => updateOpt(o.id, { rate: v ?? 0 })} step={0.05} disabled={o.isStay} />
                      </div>
                      <div className="md:col-span-1 space-y-1">
                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Fix yrs</Label>
                        <NumberInput value={o.initialYears} onChange={(v) => updateOpt(o.id, { initialYears: v ?? 0 })} step={1} disabled={o.isStay} />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Product fee £</Label>
                        <NumberInput value={o.productFee} onChange={(v) => updateOpt(o.id, { productFee: v ?? 0 })} step={50} disabled={o.isStay} />
                      </div>
                      <div className="md:col-span-1 space-y-1">
                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Cashback £</Label>
                        <NumberInput value={o.cashback} onChange={(v) => updateOpt(o.id, { cashback: v ?? 0 })} step={50} disabled={o.isStay} />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Reverts to %</Label>
                        <NumberInput value={o.followOnRate} onChange={(v) => updateOpt(o.id, { followOnRate: v ?? 0 })} step={0.05} />
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        {!o.isStay && (
                          <Button variant="ghost" size="icon" onClick={() => removeOpt(o.id)} aria-label="Remove option">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                      <Stat label="Monthly" value={fmtFull(row.monthlyInitial)} />
                      <Stat
                        label="vs. now"
                        value={
                          Math.abs(row.monthlyDelta) < 1
                            ? "same"
                            : `${row.monthlyDelta > 0 ? "+" : "−"}${fmtFull(Math.abs(row.monthlyDelta))}`
                        }
                        tone={row.monthlyDelta < -1 ? "good" : row.monthlyDelta > 1 ? "warn" : "neutral"}
                        icon={row.monthlyDelta < -1 ? TrendingDown : row.monthlyDelta > 1 ? TrendingUp : undefined}
                      />
                      <Stat
                        label={`Net cost / ${horizonYears}y`}
                        value={fmt(row.netCost)}
                        hint="Interest + fees − cashback"
                        emphasized={isBest}
                      />
                      <Stat label="Interest paid" value={fmt(row.interestPaid)} />
                      <Stat label="Balance at end" value={fmt(row.balanceEnd)} />
                      <Stat
                        label="Breakeven on fees"
                        value={
                          row.isStay
                            ? "—"
                            : row.breakevenMonths == null
                              ? "—"
                              : row.breakevenMonths > horizonMonths
                                ? "Beyond horizon"
                                : `${row.breakevenMonths} mo`
                        }
                        tone={
                          row.isStay
                            ? "neutral"
                            : row.breakevenMonths != null && row.breakevenMonths <= horizonMonths
                              ? "good"
                              : row.breakevenMonths != null
                                ? "warn"
                                : "neutral"
                        }
                      />
                    </div>

                    {isBest && !row.isStay && (
                      <Badge className="bg-accent text-accent-foreground border-0">
                        Lowest net cost over {horizonYears} years
                      </Badge>
                    )}
                    {!row.isStay && row.initialMonths < horizonMonths && (
                      <p className="text-[11px] text-muted-foreground">
                        Reverts to {row.followOnRate}% after {o.initialYears}yr — re-mortgage again then to lock a new rate.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Visualisations */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-soft" id="remortgage-chart-monthly">
            <CardContent className="p-6">
              <h3 className="font-serif font-bold text-brand mb-1">Monthly payment</h3>
              <p className="text-xs text-muted-foreground mb-4">
                The dashed red line is what you pay today.
              </p>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={monthlyChart} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} interval={0} />
                    <YAxis tickFormatter={(v) => `£${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11 }} />
                    <RTooltip formatter={(v: number) => fmtFull(v)} />
                    <ReferenceLine y={Math.round(currentMonthly)} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Now", position: "right", fontSize: 10 }} />
                    <Bar dataKey="monthly" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft" id="remortgage-chart-stress">
            <CardContent className="p-6">
              <h3 className="font-serif font-bold text-brand mb-1">Stress test: what if rates move?</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Monthly payment after the fix ends, on the remaining balance, if SVR moves from −1% to +3%.
              </p>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={stressChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="stress" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `£${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11 }} />
                    <RTooltip formatter={(v: number) => fmtFull(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {rows.map((r, i) => (
                      <Line key={r.id} type="monotone" dataKey={truncate(r.label)}
                        stroke={palette[i % palette.length]} strokeWidth={2} dot />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed cost breakdown */}
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <h3 className="font-serif text-xl font-bold text-brand mb-1">Detailed cost breakdown</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Where the money actually goes over your {horizonYears}-year horizon. Costs reduce your wealth (−),
              credits add to it (+). Capital repayment is equity built — not a cost.
            </p>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="text-left p-2">Option</th>
                    <th className="text-right p-2">Interest</th>
                    <th className="text-right p-2">ERC</th>
                    <th className="text-right p-2">Legal/Broker</th>
                    <th className="text-right p-2">Product fee</th>
                    <th className="text-right p-2">Cashback</th>
                    <th className="text-right p-2">Overpaid</th>
                    <th className="text-right p-2">Net cost</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[13px]">
                  {rows.map((r) => {
                    const isBest = best && r.id === best.id;
                    return (
                      <tr key={r.id} className={cn("border-t border-border/50", isBest && "bg-accent/5")}>
                        <td className="p-2 font-sans text-foreground">
                          {r.label} {isBest && <span className="text-accent">★</span>}
                        </td>
                        <td className="p-2 text-right">{fmt(r.interestPaid)}</td>
                        <td className={cn("p-2 text-right", r.ercCost > 0 && "text-warning")}>
                          {r.ercCost > 0 ? `−${fmt(r.ercCost)}` : "—"}
                        </td>
                        <td className={cn("p-2 text-right", r.legalAndBroker > 0 && "text-warning")}>
                          {r.legalAndBroker > 0 ? `−${fmt(r.legalAndBroker)}` : "—"}
                        </td>
                        <td className={cn("p-2 text-right", r.productFee > 0 && "text-warning")}>
                          {r.productFee > 0 ? `−${fmt(r.productFee)}` : "—"}
                        </td>
                        <td className={cn("p-2 text-right", r.cashback > 0 && "text-success")}>
                          {r.cashback > 0 ? `+${fmt(r.cashback)}` : "—"}
                        </td>
                        <td className="p-2 text-right text-muted-foreground">
                          {r.overpaid > 0 ? fmt(r.overpaid) : "—"}
                        </td>
                        <td className={cn("p-2 text-right font-semibold", isBest && "text-accent")}>
                          {fmt(r.netCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Affordability headroom */}
        <Card className="shadow-soft border-accent/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-brand mb-1 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-accent" /> Affordability stress check
                </h3>
                <p className="text-xs text-muted-foreground">
                  How much room each option leaves in your monthly budget — today, and if rates rise +3%.
                </p>
              </div>
              <Button
                size="sm"
                variant={affordEnabled ? "default" : "outline"}
                onClick={() => setAffordEnabled((v) => !v)}
              >
                {affordEnabled ? "Hide check" : "Run affordability check"}
              </Button>
            </div>

            {affordEnabled && (
              <>
                <div className="grid md:grid-cols-3 gap-4 mb-5">
                  <div className="space-y-1">
                    <Label>Monthly take-home (£)</Label>
                    <NumberInput value={monthlyIncome} onChange={(v) => setMonthlyIncome(v ?? 0)} step={100} />
                    <p className="text-[11px] text-muted-foreground">After tax & pension.</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Monthly expenses ex-mortgage (£)</Label>
                    <NumberInput value={monthlyExpenses} onChange={(v) => setMonthlyExpenses(v ?? 0)} step={100} />
                    <p className="text-[11px] text-muted-foreground">Bills, food, transport, childcare, etc.</p>
                  </div>
                  <div className="space-y-1 md:pt-6">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Available for housing</p>
                    <p className={cn("font-mono text-lg font-semibold", baseDisposable > 0 ? "text-foreground" : "text-destructive")}>
                      {fmtFull(baseDisposable)}/mo
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm border-separate border-spacing-0">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        <th className="text-left p-2">Option</th>
                        <th className="text-right p-2">New monthly</th>
                        <th className="text-right p-2">Headroom today</th>
                        <th className="text-right p-2">Headroom @ +3%</th>
                        <th className="text-left p-2 pl-4">Stress verdict</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-[13px]">
                      {rows.map((r) => {
                        const headroom = baseDisposable - r.monthlyInitial;
                        const balForStress = r.balanceEnd > 0 ? r.balanceEnd : balance;
                        const stressedRate = (r.isStay ? currentSvr : r.followOnRate) + 3;
                        const yearsLeft = Math.max(1, termRemaining - horizonYears);
                        const stressedMp = monthlyPayment(balForStress, stressedRate, yearsLeft);
                        const stressedHeadroom = baseDisposable - stressedMp;
                        const verdict =
                          stressedHeadroom < 0 ? { label: "At risk", tone: "text-destructive" } :
                          stressedHeadroom < baseDisposable * 0.1 ? { label: "Tight", tone: "text-warning" } :
                          { label: "Comfortable", tone: "text-success" };
                        return (
                          <tr key={r.id} className="border-t border-border/50">
                            <td className="p-2 font-sans text-foreground">{r.label}</td>
                            <td className="p-2 text-right">{fmtFull(r.monthlyInitial)}</td>
                            <td className={cn("p-2 text-right", headroom < 0 && "text-destructive", headroom > 0 && "text-success")}>
                              {headroom >= 0 ? "+" : "−"}{fmtFull(Math.abs(headroom))}
                            </td>
                            <td className={cn("p-2 text-right", stressedHeadroom < 0 && "text-destructive", stressedHeadroom > 0 && "text-foreground")}>
                              {stressedHeadroom >= 0 ? "+" : "−"}{fmtFull(Math.abs(stressedHeadroom))}
                            </td>
                            <td className={cn("p-2 pl-4 font-sans font-semibold", verdict.tone)}>{verdict.label}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <details className="mt-3 group text-[11px] text-muted-foreground">
                  <summary className="cursor-pointer font-semibold text-foreground/70 list-none inline-flex items-center gap-1">
                    <Info className="h-3 w-3" /> How these numbers are calculated
                  </summary>
                  <ul className="mt-2 space-y-1.5 leading-relaxed pl-1">
                    <li><span className="font-semibold text-foreground/80">Available for housing</span> = Monthly take-home − Monthly expenses ({fmtFull(monthlyIncome)} − {fmtFull(monthlyExpenses)} = <span className="font-mono">{fmtFull(baseDisposable)}</span>).</li>
                    <li><span className="font-semibold text-foreground/80">Headroom today</span> = Available for housing − the option's new monthly payment. Negative = you'd need to dip into savings each month.</li>
                    <li><span className="font-semibold text-foreground/80">Headroom @ +3%</span> applies a 3-percentage-point shock to each option's revert rate (matches the FCA/PRA stress test lenders use), recomputes the payment over your remaining term, and subtracts from your available for housing.</li>
                    <li><span className="font-semibold text-foreground/80">Verdict bands</span>: At risk = stressed headroom &lt; 0. Tight = stressed headroom &lt; 10% of available for housing. Comfortable = above that.</li>
                  </ul>
                </details>
              </>
            )}
          </CardContent>
        </Card>

        {/* Decision summary */}
        <Card className="shadow-soft border-primary/30 bg-gradient-warm">
          <CardContent className="p-6">
            <h3 className="font-serif text-xl font-bold text-brand mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              What this means for you
            </h3>
            <ul className="space-y-2.5 text-sm text-foreground">
              {best && stayRow && best.id !== stayRow.id && savingsVsStay > 0 && (
                <li className="flex gap-2">
                  <ArrowRight className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <span>
                    <strong>{best.label}</strong> looks cheapest over {horizonYears} years —
                    saving roughly <strong className="text-accent">{fmt(savingsVsStay)}</strong> in net
                    borrowing cost vs. doing nothing. Monthly payment {best.monthlyDelta < 0 ? "drops" : "rises"} by{" "}
                    <strong>{fmtFull(Math.abs(best.monthlyDelta))}</strong>.
                  </span>
                </li>
              )}
              {best && stayRow && best.id === stayRow.id && (
                <li className="flex gap-2">
                  <Info className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <span>
                    Doing nothing is currently cheapest over {horizonYears} years — usually because your
                    fix hasn't ended yet and the ERC outweighs any switching benefit. Re-check inside the
                    booking window above.
                  </span>
                </li>
              )}
              {monthsLeftOnDeal > 0 && bookingWindowOpensInMonths === 0 && (
                <li className="flex gap-2">
                  <CalendarClock className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <span>
                    You're inside the 6-month booking window — you can <strong>lock a new rate now without
                    paying any ERC</strong>. If rates fall before completion, you can usually re-book.
                  </span>
                </li>
              )}
              {monthsLeftOnDeal > 0 && bookingWindowOpensInMonths > 0 && (
                <li className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <span>
                    Switching today would trigger an ERC of about{" "}
                    <strong>{fmtFull(ercFor(balance, ercPct))}</strong>. Your penalty-free window opens
                    in <strong>{bookingWindowOpensInMonths} months</strong>.
                  </span>
                </li>
              )}
              {monthlyOverpay > 0 && best && (
                <li className="flex gap-2">
                  <PiggyBank className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <span>
                    Your {fmtFull(monthlyOverpay)}/mo overpayment cuts the balance to{" "}
                    <strong>{fmt(best.balanceEnd)}</strong> after {horizonYears} years on the winning
                    option — saving years of interest at the back end.
                  </span>
                </li>
              )}
              <li className="flex gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>
                  We score every option by <em>net cost of borrowing</em> (interest + fees − cashback) over
                  the same horizon — the only fair way to compare a 2-year fix against a 5-year fix.
                  Capital you repay isn't a cost; it's equity you keep.
                </span>
              </li>
              <li className="flex gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>
                  Indicative only — not financial advice. A whole-of-market broker can find products this
                  tool can't see (exclusives, lender quirks, eligibility).
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Stat({
  label, value, tone = "neutral", icon: Icon, hint, emphasized,
}: {
  label: string; value: string; tone?: "good" | "warn" | "neutral";
  icon?: React.ComponentType<{ className?: string }>; hint?: string; emphasized?: boolean;
}) {
  const toneClass = tone === "good" ? "text-success" : tone === "warn" ? "text-warning" : "text-foreground";
  return (
    <div className={cn(
      "rounded-md p-2.5",
      emphasized ? "bg-accent/15 ring-1 ring-accent/40" : "bg-muted/40",
    )}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
        {label}
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-2.5 w-2.5 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{hint}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className={cn("font-mono text-sm font-semibold flex items-center gap-1 mt-0.5", toneClass)}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {value}
      </div>
    </div>
  );
}
