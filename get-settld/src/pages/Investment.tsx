import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles } from "lucide-react";
import { fmt, sdltCalc, sdltFTB } from "@/lib/format";
import { runInvestment, InvestmentInputs } from "@/lib/investment";
import { useScenario } from "@/context/ScenarioContext";
import Jargon from "@/components/Jargon";
import Comparator from "@/components/Comparator";

export default function Investment() {
  const { scenario } = useScenario();
  const [monthlyRent, setMonthlyRent] = useState(1850);
  const [voidWeeks, setVoidWeeks] = useState(2);
  const [managementPct, setManagementPct] = useState(10);
  const [maintenancePct, setMaintenancePct] = useState(1);
  const [serviceChargeYr, setServiceChargeYr] = useState(0);
  const [serviceChargeGrowthPct, setServiceChargeGrowthPct] = useState(5);
  const [groundRentYr, setGroundRentYr] = useState(0);
  const [insuranceYr, setInsuranceYr] = useState(350);
  const [rentGrowthPct, setRentGrowthPct] = useState(3);
  const [capitalGrowthPct, setCapitalGrowthPct] = useState(3.5);
  const [exitFeesPct, setExitFeesPct] = useState(2);
  const [refurb, setRefurb] = useState(0);
  const [isInterestOnly, setIsInterestOnly] = useState(scenario.tenure === "buy_to_let");
  // Stress overrides
  const [rateStress, setRateStress] = useState(0);
  const [voidStress, setVoidStress] = useState(0);
  const [growthStress, setGrowthStress] = useState(0);

  const sdlt = scenario.tenure === "buy_to_let"
    ? sdltCalc(scenario.price) + scenario.price * 0.05  // BTL surcharge approx
    : scenario.isFTB ? sdltFTB(scenario.price) : sdltCalc(scenario.price);

  const inputs: InvestmentInputs = {
    price: scenario.price,
    deposit: scenario.deposit,
    rate: scenario.rate + rateStress,
    termYears: scenario.term,
    holdYears: scenario.holdYears,
    monthlyRent,
    voidWeeks: voidWeeks + voidStress,
    managementPct,
    maintenancePct,
    insuranceYr,
    groundRentYr,
    serviceChargeYr,
    serviceChargeGrowthPct,
    rentGrowthPct,
    capitalGrowthPct: capitalGrowthPct + growthStress,
    exitFeesPct,
    sdlt: Math.round(sdlt),
    legalFees: 1800,
    refurb,
    isInterestOnly,
  };

  const result = useMemo(() => runInvestment(inputs), [inputs]);

  const grade =
    result.irrPct >= 12 ? { label: "Strong investment", tone: "text-success", bg: "bg-success/10" } :
    result.irrPct >= 8  ? { label: "Solid", tone: "text-brand", bg: "bg-brand-muted" } :
    result.irrPct >= 4  ? { label: "Marginal", tone: "text-warning", bg: "bg-warning/10" } :
                          { label: "Below threshold", tone: "text-destructive", bg: "bg-destructive/10" };

  return (
    <>
      <PageHeader
        eyebrow="Tool · Investment / IRR"
        title="Will this property actually pay you back?"
        description={<>Full <Jargon term="IRR" />, NPV, cashflow and stress-test model for buy-to-let and owner-occupier exits.</>}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 p-6 h-fit lg:sticky lg:top-20 shadow-soft space-y-5">
          <h3 className="font-serif text-lg font-bold text-brand">Income & costs</h3>
          <p className="text-xs text-muted-foreground">
            Price, deposit, rate, term and hold period are linked to the global scenario bar.
          </p>

          <div><Label className="text-xs">Monthly rent (£)</Label><NumberInput value={monthlyRent} onChange={setMonthlyRent} className="font-mono" /></div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Void weeks/yr</Label><NumberInput value={voidWeeks} onChange={setVoidWeeks} /></div>
            <div><Label className="text-xs">Mgmt %</Label><NumberInput value={managementPct} onChange={setManagementPct} /></div>
            <div><Label className="text-xs">Maintenance %</Label><NumberInput value={maintenancePct} onChange={setMaintenancePct} /></div>
            <div><Label className="text-xs">Insurance £</Label><NumberInput value={insuranceYr} onChange={setInsuranceYr} /></div>
            <div><Label className="text-xs">Service £/yr</Label><NumberInput value={serviceChargeYr} onChange={setServiceChargeYr} /></div>
            <div><Label className="text-xs">Service growth %</Label><NumberInput value={serviceChargeGrowthPct} onChange={setServiceChargeGrowthPct} /></div>
            <div><Label className="text-xs">Ground rent £</Label><NumberInput value={groundRentYr} onChange={setGroundRentYr} /></div>
            <div><Label className="text-xs">Refurb upfront £</Label><NumberInput value={refurb} onChange={setRefurb} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div><Label className="text-xs">Rent growth %/yr</Label><NumberInput value={rentGrowthPct} onChange={setRentGrowthPct} /></div>
            <div><Label className="text-xs">Capital growth %/yr</Label><NumberInput value={capitalGrowthPct} onChange={setCapitalGrowthPct} /></div>
            <div><Label className="text-xs">Exit fees %</Label><NumberInput value={exitFeesPct} onChange={setExitFeesPct} /></div>
            <div className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={isInterestOnly} onChange={(e) => setIsInterestOnly(e.target.checked)} /> Interest-only
            </div>
          </div>

          <div className="pt-3 border-t">
            <h4 className="font-serif text-sm font-bold text-brand mb-3">Stress tests</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1.5"><Label className="text-xs">Rate shock +</Label><span className="font-mono text-sm">{rateStress.toFixed(1)}%</span></div>
                <Slider value={[rateStress]} min={0} max={5} step={0.25} onValueChange={(v) => setRateStress(v[0])} />
              </div>
              <div>
                <div className="flex justify-between mb-1.5"><Label className="text-xs">Extra void weeks</Label><span className="font-mono text-sm">+{voidStress}</span></div>
                <Slider value={[voidStress]} min={0} max={12} step={1} onValueChange={(v) => setVoidStress(v[0])} />
              </div>
              <div>
                <div className="flex justify-between mb-1.5"><Label className="text-xs">Growth haircut</Label><span className="font-mono text-sm">{growthStress.toFixed(1)}%</span></div>
                <Slider value={[growthStress]} min={-5} max={0} step={0.25} onValueChange={(v) => setGrowthStress(v[0])} />
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-8 space-y-6">
          <Card className="p-7 bg-gradient-brand text-brand-foreground shadow-card border-0">
            <div className="flex justify-between items-baseline flex-wrap gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] opacity-75">{scenario.holdYears}-yr IRR</p>
                <p className="font-serif text-6xl font-bold mt-2 tracking-tight">{result.irrPct.toFixed(1)}%</p>
                <Badge className={`mt-3 ${grade.bg} ${grade.tone} hover:${grade.bg} border-0`}>{grade.label}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { l: "Gross yield", v: `${result.grossYieldPct.toFixed(2)}%`, j: "Yield" as const },
                  { l: "Net yield", v: `${result.netYieldPct.toFixed(2)}%`, j: "Yield" as const },
                  { l: "Cash-on-cash Y1", v: `${result.cashOnCashYr1Pct.toFixed(1)}%` },
                  { l: "Equity multiple", v: `${result.totalReturnMultiple.toFixed(2)}×` },
                ].map((m) => (
                  <div key={m.l}>
                    <p className="text-[10px] uppercase tracking-widest opacity-70">
                      {m.j ? <Jargon term={m.l} glossaryKey={m.j}>{m.l}</Jargon> : m.l}
                    </p>
                    <p className="font-mono text-lg font-semibold">{m.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="p-5 shadow-soft">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Initial outlay</p>
              <p className="font-serif text-2xl font-bold text-brand mt-1">{fmt(result.initialOutlay)}</p>
              <p className="text-xs text-muted-foreground mt-1">Deposit + SDLT + legal + refurb</p>
            </Card>
            <Card className="p-5 shadow-soft">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Net exit proceeds</p>
              <p className="font-serif text-2xl font-bold text-brand mt-1">{fmt(result.exitNetProceeds)}</p>
              <p className="text-xs text-muted-foreground mt-1">After loan + selling fees</p>
            </Card>
            <Card className="p-5 shadow-soft">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">NPV @ 5%</p>
              <p className={`font-serif text-2xl font-bold mt-1 ${result.npvAt5Pct >= 0 ? "text-success" : "text-destructive"}`}>{fmt(result.npvAt5Pct)}</p>
              <p className="text-xs text-muted-foreground mt-1">{result.npvAt5Pct >= 0 ? "Beats 5% hurdle" : "Below 5% hurdle"}</p>
            </Card>
          </div>

          <Card className="p-6 shadow-soft">
            <h4 className="font-serif font-bold text-brand mb-4">Annual cashflow</h4>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-2 py-2">Yr</th>
                    <th className="px-2 py-2 text-right">Gross rent</th>
                    <th className="px-2 py-2 text-right">Net rent</th>
                    <th className="px-2 py-2 text-right">Cashflow</th>
                    <th className="px-2 py-2 text-right">Cumulative</th>
                    <th className="px-2 py-2 text-right">Value</th>
                    <th className="px-2 py-2 text-right">Equity</th>
                  </tr>
                </thead>
                <tbody>
                  {result.cashflows.map((c) => (
                    <tr key={c.year} className="border-t">
                      <td className="px-2 py-2 font-mono">{c.year}</td>
                      <td className="px-2 py-2 text-right font-mono">{fmt(c.grossRent)}</td>
                      <td className="px-2 py-2 text-right font-mono">{fmt(c.netRent)}</td>
                      <td className={`px-2 py-2 text-right font-mono ${c.netCashflow >= 0 ? "text-success" : "text-destructive"}`}>{fmt(c.netCashflow)}</td>
                      <td className="px-2 py-2 text-right font-mono">{fmt(c.cumulative)}</td>
                      <td className="px-2 py-2 text-right font-mono">{fmt(c.propertyValue)}</td>
                      <td className="px-2 py-2 text-right font-mono font-semibold">{fmt(c.equity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5 bg-accent/10 border-accent/30 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">
              IRR uses bisection on the full cashflow series including the exit lump-sum. NPV discounts at a 5% hurdle.
              Returns are pre-tax - overlay your marginal tax rate, Section 24 for landlords, and CGT for an after-tax view.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
