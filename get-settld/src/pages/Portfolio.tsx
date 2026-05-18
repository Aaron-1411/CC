import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Jargon from "@/components/Jargon";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Wallet } from "lucide-react";
import { fmt, sdltCalc } from "@/lib/format";
import { runInvestment, InvestmentInputs } from "@/lib/investment";

interface Holding {
  id: string;
  name: string;
  price: number;
  deposit: number;
  rate: number;
  termYears: number;
  monthlyRent: number;
  capitalGrowthPct: number;
  isInterestOnly: boolean;
}

const SEED: Holding[] = [
  { id: "h1", name: "Peckham SE15 - Foundry 4", price: 510_000, deposit: 127_500, rate: 5.2, termYears: 25, monthlyRent: 2200, capitalGrowthPct: 4, isInterestOnly: true },
  { id: "h2", name: "Wood Green N22 - Maple", price: 465_000, deposit: 116_250, rate: 5.0, termYears: 25, monthlyRent: 2050, capitalGrowthPct: 3.5, isInterestOnly: true },
];

const buildInputs = (h: Holding, holdYears: number): InvestmentInputs => ({
  price: h.price,
  deposit: h.deposit,
  rate: h.rate,
  termYears: h.termYears,
  holdYears,
  monthlyRent: h.monthlyRent,
  voidWeeks: 2,
  managementPct: 10,
  maintenancePct: 1,
  insuranceYr: 350,
  groundRentYr: 0,
  serviceChargeYr: 0,
  serviceChargeGrowthPct: 5,
  rentGrowthPct: 3,
  capitalGrowthPct: h.capitalGrowthPct,
  exitFeesPct: 2,
  sdlt: Math.round(sdltCalc(h.price) + h.price * 0.05),
  legalFees: 1800,
  refurb: 0,
  isInterestOnly: h.isInterestOnly,
});

export default function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>(SEED);
  const [holdYears, setHoldYears] = useState(10);

  const enriched = useMemo(() =>
    holdings.map((h) => ({ h, r: runInvestment(buildInputs(h, holdYears)) })),
    [holdings, holdYears]
  );

  const totals = useMemo(() => {
    const t = enriched.reduce((acc, { h, r }) => {
      acc.price += h.price;
      acc.equity += r.cashflows[r.cashflows.length - 1]?.equity ?? 0;
      acc.outlay += r.initialOutlay;
      acc.exit += r.exitNetProceeds;
      acc.cashflowYr1 += r.cashflows[0]?.netCashflow ?? 0;
      return acc;
    }, { price: 0, equity: 0, outlay: 0, exit: 0, cashflowYr1: 0 });

    // Portfolio IRR - sum cashflows year-by-year, then run IRR
    const series = [-t.outlay];
    for (let y = 1; y <= holdYears; y++) {
      let yearTotal = 0;
      enriched.forEach(({ r }) => {
        const c = r.cashflows[y - 1];
        if (!c) return;
        yearTotal += c.netCashflow + (y === holdYears ? r.exitNetProceeds : 0);
      });
      series.push(yearTotal);
    }
    // local IRR (bisection)
    const npv = (rate: number) => series.reduce((s, cf, i) => s + cf / Math.pow(1 + rate, i), 0);
    let lo = -0.99, hi = 5;
    let irrPct = 0;
    if (npv(lo) * npv(hi) <= 0) {
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (Math.abs(npv(mid)) < 1) { irrPct = mid * 100; break; }
        if (npv(lo) * npv(mid) < 0) hi = mid; else lo = mid;
      }
      irrPct = ((lo + hi) / 2) * 100;
    }
    return { ...t, irrPct: +irrPct.toFixed(2) };
  }, [enriched, holdYears]);

  const addHolding = () => {
    const id = `h${Date.now()}`;
    setHoldings((s) => [...s, { id, name: `New holding ${s.length + 1}`, price: 300_000, deposit: 75_000, rate: 5.0, termYears: 25, monthlyRent: 1400, capitalGrowthPct: 3, isInterestOnly: true }]);
  };

  const update = (id: string, patch: Partial<Holding>) =>
    setHoldings((s) => s.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  const remove = (id: string) => setHoldings((s) => s.filter((h) => h.id !== id));

  return (
    <>
      <PageHeader
        eyebrow="Tool · Portfolio"
        title={<>Aggregate cashflow, equity and <Jargon term="IRR" /> across every property</>}
        documentTitle="Portfolio cashflow, equity and IRR"
        description="Build a watch-list or live portfolio, stress-test and compare blended returns."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Card className="p-6 shadow-card bg-gradient-brand text-brand-foreground border-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-5">
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-70">Holdings</p>
              <p className="font-serif text-2xl font-bold mt-1">{holdings.length}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-70">Total value</p>
              <p className="font-serif text-2xl font-bold mt-1">{fmt(totals.price)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-70">Equity ({holdYears}y)</p>
              <p className="font-serif text-2xl font-bold mt-1">{fmt(totals.equity)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-70">Yr1 cashflow</p>
              <p className="font-mono text-2xl font-bold mt-1">{fmt(totals.cashflowYr1)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-70">Portfolio IRR</p>
              <p className="font-serif text-2xl font-bold mt-1">{totals.irrPct.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Hold period (yrs)</Label>
            <NumberInput value={holdYears} onChange={setHoldYears} className="w-20 font-mono" />
          </div>
          <Button onClick={addHolding} size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90 ml-auto">
            <Plus className="w-3 h-3 mr-1" /> Add holding
          </Button>
        </div>

        <Card className="p-6 shadow-soft">
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-2 py-2">Property</th>
                  <th className="px-2 py-2 text-right">Price</th>
                  <th className="px-2 py-2 text-right">Deposit</th>
                  <th className="px-2 py-2 text-right">Rate%</th>
                  <th className="px-2 py-2 text-right">Rent £/mo</th>
                  <th className="px-2 py-2 text-right">Growth%</th>
                  <th className="px-2 py-2 text-right">Yr1 CF</th>
                  <th className="px-2 py-2 text-right">IRR</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {enriched.map(({ h, r }) => (
                  <tr key={h.id} className="border-t align-top">
                    <td className="px-2 py-3"><Input value={h.name} onChange={(e) => update(h.id, { name: e.target.value })} className="h-8 font-medium" /></td>
                    <td className="px-2 py-3"><NumberInput value={h.price} onChange={(n) => update(h.id, { price: n })} className="h-8 font-mono w-28 text-right" /></td>
                    <td className="px-2 py-3"><NumberInput value={h.deposit} onChange={(n) => update(h.id, { deposit: n })} className="h-8 font-mono w-24 text-right" /></td>
                    <td className="px-2 py-3"><NumberInput step="0.1" value={h.rate} onChange={(n) => update(h.id, { rate: n })} className="h-8 font-mono w-16 text-right" /></td>
                    <td className="px-2 py-3"><NumberInput value={h.monthlyRent} onChange={(n) => update(h.id, { monthlyRent: n })} className="h-8 font-mono w-20 text-right" /></td>
                    <td className="px-2 py-3"><NumberInput step="0.5" value={h.capitalGrowthPct} onChange={(n) => update(h.id, { capitalGrowthPct: n })} className="h-8 font-mono w-16 text-right" /></td>
                    <td className={`px-2 py-3 text-right font-mono ${(r.cashflows[0]?.netCashflow ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>{fmt(r.cashflows[0]?.netCashflow ?? 0)}</td>
                    <td className="px-2 py-3 text-right font-mono font-semibold text-brand">{r.irrPct.toFixed(1)}%</td>
                    <td className="px-2 py-3 text-right">
                      <button onClick={() => remove(h.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-brand-muted/40 border-brand/20 flex items-start gap-3">
          <Wallet className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            Portfolio IRR is computed on the blended cashflow series (yearly net cashflow across every holding plus a single exit
            lump-sum at the chosen hold period). Diversification benefits and tax treatment are simplified - consult a broker for
            cross-collateralisation and SPV structures.
          </p>
        </Card>
      </div>
    </>
  );
}
