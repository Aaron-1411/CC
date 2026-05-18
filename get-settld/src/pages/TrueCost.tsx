import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtFull } from "@/lib/format";
import { computePurchaseTax, Region } from "@/lib/taxes";
import { useScenario } from "@/context/ScenarioContext";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { estimateAnnualEnergy, estimateCouncilTax, estimateInsurance, estimateRebuildCost, type CouncilTaxBand, type EpcBand } from "@/lib/runningCosts";
import Jargon from "@/components/Jargon";
import Comparator from "@/components/Comparator";
import { useRegionTerm } from "@/components/RegionTerm";
import AnchorNav from "@/components/AnchorNav";
import FreshnessPill from "@/components/FreshnessPill";
import { Download, Printer } from "lucide-react";
import { trueCostToCSV, downloadCSV, projectRunningCosts, projectMortgageInterest, type TrueCostSnapshot } from "@/lib/trueCostExport";
import { toast } from "@/hooks/use-toast";

const COLORS = [
  "hsl(var(--brand))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--brand) / 0.6)",
];

interface Costs {
  survey: number; legal: number; searches: number;
  mortgageFee: number; broker: number; moving: number;
  contingencyPct: number;
}
const DEFAULT_COSTS: Costs = {
  survey: 600, legal: 1500, searches: 350,
  mortgageFee: 999, broker: 500, moving: 800, contingencyPct: 2,
};

interface ScenarioInputs {
  price: number; deposit: number; ftb: boolean; region: Region;
  isAdditional: boolean; nonResident: boolean;
  costs: Costs;
}

const computeAll = (i: ScenarioInputs) => {
  const tax = computePurchaseTax({
    price: i.price, region: i.region, isFTB: i.ftb,
    isAdditional: i.isAdditional, isNonResident: i.nonResident,
  });
  const items = [
    { label: "Deposit", v: i.deposit },
    { label: tax.label, v: tax.total },
    { label: "Solicitor", v: i.costs.legal },
    { label: "Searches", v: i.costs.searches },
    { label: "Survey", v: i.costs.survey },
    { label: "Mortgage fee", v: i.costs.mortgageFee },
    { label: "Broker", v: i.costs.broker },
    { label: "Removals", v: i.costs.moving },
  ];
  const subtotal = items.reduce((s, x) => s + x.v, 0);
  const contingency = Math.round((subtotal - i.deposit) * (i.costs.contingencyPct / 100));
  const total = subtotal + contingency;
  return { tax, items, contingency, total };
};

export default function TrueCost() {
  const { scenario, setScenario, loan } = useScenario();
  const [costs, setCosts] = useState<Costs>(DEFAULT_COSTS);
  const [nonResident, setNonResident] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [bPrice, setBPrice] = useState(scenario.price + 50_000);
  const [bDeposit, setBDeposit] = useState(scenario.deposit);
  const [bFtb, setBFtb] = useState(scenario.isFTB);
  const [epcBand, setEpcBand] = useState<EpcBand>("D");
  const [ctBand, setCtBand] = useState<CouncilTaxBand>("D");
  const [sqft, setSqft] = useState(750);

  const A = useMemo(() => computeAll({
    price: scenario.price, deposit: scenario.deposit, ftb: scenario.isFTB,
    region: scenario.region as Region, isAdditional: scenario.tenure === "buy_to_let",
    nonResident, costs,
  }), [scenario, nonResident, costs]);

  const B = useMemo(() => computeAll({
    price: bPrice, deposit: bDeposit, ftb: bFtb,
    region: scenario.region as Region, isAdditional: scenario.tenure === "buy_to_let",
    nonResident, costs,
  }), [bPrice, bDeposit, bFtb, scenario.region, scenario.tenure, nonResident, costs]);

  // Year 1 ownership running costs (real estimators)
  const yearOne = useMemo(() => {
    const monthlyMortgage = loan > 0 ? (loan * (scenario.rate / 100 / 12)) / (1 - Math.pow(1 + scenario.rate / 100 / 12, -scenario.term * 12)) : 0;
    const energy = estimateAnnualEnergy(sqft, epcBand);
    const ct = estimateCouncilTax(ctBand);
    const rebuild = estimateRebuildCost(sqft);
    const ins = estimateInsurance(rebuild);
    const items: { label: string; v: number; how: string }[] = [
      { label: "Mortgage payments", v: Math.round(monthlyMortgage * 12), how: `Monthly capital + interest on ${fmtFull(loan)} loan at ${scenario.rate}% over ${scenario.term} years = ${fmtFull(Math.round(monthlyMortgage))}/mo. Annualised × 12.` },
      { label: `Energy (EPC ${epcBand}, ${sqft} sqft @ Ofgem cap)`, v: energy, how: `EPC band ${epcBand} typical primary energy demand × floor area (${sqft} sqft → ${(sqft / 10.7639).toFixed(0)} m²) × Ofgem Q3-2025 blended price 28p/kWh.` },
      { label: `Council tax (band ${ctBand} avg)`, v: ct, how: `MHCLG England 2024–25 average for band ${ctBand}. Your local authority may charge ±15% — check their website for the exact figure.` },
      { label: "Buildings insurance (ABI avg)", v: ins.buildings, how: `Estimated rebuild cost ${fmtFull(rebuild)} (BCIS £1,800/m²) × ABI typical premium rate 0.018%.` },
      { label: "Contents insurance", v: ins.contents, how: `ABI 2024 national average ~£140/yr for £30k contents cover. Scales by ~£3 per £1k extra cover.` },
      { label: "Water (avg dual)", v: 480, how: `Ofwat 2024–25 England & Wales average combined water + wastewater bill (£473). Metered usage may differ.` },
      { label: "Repairs reserve (1% of price)", v: Math.round(scenario.price * 0.01), how: `Industry rule of thumb: budget 1% of property value annually for maintenance, replacements (boiler, roof) and unexpected repairs.` },
      { label: "Service charge (if leasehold)", v: scenario.tenure === "buy_to_let" ? 1800 : 0, how: scenario.tenure === "buy_to_let" ? `Typical leasehold flat service charge £1,500–£3,500/yr. Set to £0 if your property is freehold.` : `Set to £0 — not applied to freehold purchases. Toggle 'Additional property' to model a leasehold flat.` },
    ];
    return { items, total: items.reduce((s, x) => s + x.v, 0) };
  }, [loan, scenario, sqft, epcBand, ctBand]);

  // Lifetime view: hold years × inflated running costs + cumulative interest
  const [lifetimeYears, setLifetimeYears] = useState<number>(scenario.holdYears || 7);
  const [inflationPct, setInflationPct] = useState<number>(3);
  const lifetime = useMemo(() => {
    const running = projectRunningCosts(yearOne.total, lifetimeYears, inflationPct);
    const interest = projectMortgageInterest(loan, scenario.rate, scenario.term, lifetimeYears);
    return {
      running, interest,
      total: A.total + running + interest,
      chart: Array.from({ length: lifetimeYears }, (_, k) => {
        const y = k + 1;
        return {
          year: `Y${y}`,
          Running: projectRunningCosts(yearOne.total, y, inflationPct),
          Interest: projectMortgageInterest(loan, scenario.rate, scenario.term, y),
          Upfront: A.total,
        };
      }),
    };
  }, [yearOne.total, lifetimeYears, inflationPct, loan, scenario.rate, scenario.term, A.total]);

  const pieDataA = A.items.map((i) => ({ name: i.label, value: i.v }));

  const stampDutyShort = useRegionTerm("stampDuty");

  const buildSnapshot = (): TrueCostSnapshot => ({
    price: scenario.price,
    deposit: scenario.deposit,
    region: scenario.region,
    isFTB: scenario.isFTB,
    isAdditional: scenario.tenure === "buy_to_let",
    nonResident,
    cashItems: A.items,
    cashContingency: A.contingency,
    cashTotal: A.total,
    taxLabel: A.tax.label,
    taxBase: A.tax.base,
    taxSurchargeAdditional: A.tax.surchargeAdditional,
    taxSurchargeNonResident: A.tax.surchargeNonResident,
    taxEffectivePct: A.tax.effectiveRatePct,
    yearOneItems: yearOne.items,
    yearOneTotal: yearOne.total,
    lifetimeYears,
    lifetimeRunning: lifetime.running,
    lifetimeMortgageInterest: lifetime.interest,
    lifetimeTotal: lifetime.total,
  });

  const handleExportCSV = () => {
    try {
      downloadCSV(`true-cost-${Date.now()}.csv`, trueCostToCSV(buildSnapshot()));
      toast({ title: "CSV downloaded", description: "Open in Excel or Numbers." });
    } catch (e) {
      toast({ title: "Export failed", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Costs"
        title="True Cost of Buying"
        description={`Regional ${stampDutyShort} engine, donut breakdown, year-1 running costs, lifetime view, and side-by-side scenario compare.`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1.5" /> Print / PDF
            </Button>
          </>
        }
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-[200px_1fr] gap-6">
        <AnchorNav
          sections={[
            { id: "tc-cash", label: "Cash needed" },
            { id: "tc-tax", label: `${stampDutyShort} breakdown` },
            { id: "tc-year1", label: "Year-1 running costs" },
            { id: "tc-lifetime", label: "Lifetime view" },
          ]}
        />
        <div className="grid lg:grid-cols-5 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-4 h-fit">
          <h2 className="font-serif text-xl font-bold text-brand">Inputs</h2>
          <div><Label>Property price</Label><NumberInput value={scenario.price} onChange={(n) => setScenario({ price: n })} className="font-mono" /></div>
          <div><Label>Deposit</Label><NumberInput value={scenario.deposit} onChange={(n) => setScenario({ deposit: n })} className="font-mono" /></div>

          <div>
            <Label>Region (tax regime)</Label>
            <Select value={scenario.region} onValueChange={(v: any) => setScenario({ region: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="england">England (SDLT)</SelectItem>
                <SelectItem value="ni">Northern Ireland (SDLT)</SelectItem>
                <SelectItem value="scotland">Scotland (LBTT)</SelectItem>
                <SelectItem value="wales">Wales (LTT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <Label>First-time buyer relief</Label>
            <Switch checked={scenario.isFTB} onCheckedChange={(v) => setScenario({ isFTB: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Additional property (BTL / 2nd home)</Label>
            <Switch checked={scenario.tenure === "buy_to_let"} onCheckedChange={(v) => setScenario({ tenure: v ? "buy_to_let" : "buy_to_live" })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Non-UK resident</Label>
            <Switch checked={nonResident} onCheckedChange={setNonResident} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            {(Object.keys(costs) as (keyof Costs)[]).map((k) => (
              <div key={k}>
                <Label className="text-xs capitalize">{k.replace(/([A-Z])/g, " $1")}</Label>
                <NumberInput value={costs[k]} onChange={(n) => setCosts((c) => ({ ...c, [k]: n }))} />
              </div>
            ))}
          </div>

          <div className="border-t pt-3 flex items-center justify-between">
            <div>
              <Label>Compare a second scenario</Label>
              <p className="text-xs text-muted-foreground">e.g. £350k FTB vs £400k FTB</p>
            </div>
            <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} />
          </div>
          {compareEnabled && (
            <div className="space-y-2 border-l-2 border-accent pl-3">
              <div><Label className="text-xs">Price B</Label><NumberInput value={bPrice} onChange={setBPrice} /></div>
              <div><Label className="text-xs">Deposit B</Label><NumberInput value={bDeposit} onChange={setBDeposit} /></div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">FTB B</Label>
                <Switch checked={bFtb} onCheckedChange={setBFtb} />
              </div>
            </div>
          )}
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card id="tc-cash" className="p-6 bg-gradient-warm scroll-mt-32">
            <Badge className="bg-brand-muted text-brand border-0 mb-3">Cash needed on completion</Badge>
            <h2 className="font-serif text-4xl font-bold text-brand">{fmtFull(A.total)}</h2>
            <p className="text-muted-foreground mt-1">to buy a {fmtFull(scenario.price)} home — of which {fmtFull(A.total - scenario.deposit)} is on top of your deposit.</p>
            {scenario.deposit > 0 && (
              <Comparator
                className="mt-3"
                value={`${(A.total / scenario.deposit).toFixed(1)}× your deposit`}
                context="Most buyers underestimate by 8–12% — fees and tax stack up fast."
                tone={A.total / Math.max(scenario.deposit, 1) > 1.3 ? "warn" : "neutral"}
              /> 
            )}

            <div className="grid lg:grid-cols-2 gap-4 mt-6">
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieDataA} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={1}>
                      {pieDataA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtFull(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="divide-y border rounded-lg overflow-hidden bg-card text-sm">
                {A.items.map((i, idx) => (
                  <li key={i.label} className="flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                      {i.label}
                    </span>
                    <span className="font-mono font-semibold">{fmtFull(i.v)}</span>
                  </li>
                ))}
                <li className="flex items-center justify-between px-3 py-2 bg-muted/30">
                  <span className="text-muted-foreground">Contingency ({costs.contingencyPct}%)</span>
                  <span className="font-mono font-semibold">{fmtFull(A.contingency)}</span>
                </li>
              </ul>
            </div>
          </Card>

          {compareEnabled && (
            <Card className="p-5 border-accent/40">
              <h3 className="font-serif font-bold text-brand mb-3">Scenario A vs B</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">A · {fmtFull(scenario.price)}</p><p className="font-mono text-2xl font-bold text-brand mt-1">{fmtFull(A.total)}</p></div>
                <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">B · {fmtFull(bPrice)}</p><p className="font-mono text-2xl font-bold text-accent mt-1">{fmtFull(B.total)}</p></div>
                <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Difference</p><p className={`font-mono text-2xl font-bold mt-1 ${B.total - A.total > 0 ? "text-destructive" : "text-success"}`}>{B.total > A.total ? "+" : "−"}{fmtFull(Math.abs(B.total - A.total))}</p></div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">SDLT delta: {fmtFull(Math.abs(B.tax.total - A.tax.total))} - Effective tax {A.tax.effectiveRatePct.toFixed(2)}% vs {B.tax.effectiveRatePct.toFixed(2)}%.</p>
            </Card>
          )}

          <Card id="tc-tax" className="p-5 scroll-mt-32">
            <h3 className="font-serif font-bold text-brand mb-3">{A.tax.label} breakdown · <Jargon term={stampDutyShort} glossaryKey={stampDutyShort.replace(/\s/g, "")} /></h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Base</p>
                <p className="font-mono text-lg font-semibold mt-1">{fmtFull(A.tax.base)}</p>
              </div>
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Additional surcharge</p>
                <p className="font-mono text-lg font-semibold mt-1">{fmtFull(A.tax.surchargeAdditional)}</p>
              </div>
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Non-resident surcharge</p>
                <p className="font-mono text-lg font-semibold mt-1">{fmtFull(A.tax.surchargeNonResident)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Effective rate: <span className="font-mono font-semibold text-foreground">{A.tax.effectiveRatePct.toFixed(2)}%</span> of price.
            </p>
            {A.tax.notes.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {A.tax.notes.map((n) => <li key={n}>• {n}</li>)}
              </ul>
            )}
          </Card>

          <Card id="tc-year1" className="p-5 scroll-mt-32">
            <h3 className="font-serif font-bold text-brand mb-3">Year-1 running costs · <Jargon term="EPC" /></h3>
            <p className="text-xs text-muted-foreground mb-3 inline-flex items-center gap-2 flex-wrap">Estimated ownership costs in your first 12 months — beyond the completion-day cash above. <FreshnessPill source="Ofgem & MHCLG" updatedAt="2025-04-01" /></p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <Label className="text-xs">Sqft</Label>
                <NumberInput value={sqft} onChange={setSqft} />
              </div>
              <div>
                <Label className="text-xs">EPC band</Label>
                <Select value={epcBand} onValueChange={(v: EpcBand) => setEpcBand(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(["A","B","C","D","E","F","G"] as EpcBand[]).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Council tax band</Label>
                <Select value={ctBand} onValueChange={(v: CouncilTaxBand) => setCtBand(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(["A","B","C","D","E","F","G","H"] as CouncilTaxBand[]).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <ul className="divide-y border rounded-lg overflow-hidden bg-card text-sm">
              {yearOne.items.map((i) => (
                <li key={i.label} className="px-3 py-2">
                  <details className="group">
                    <summary className="flex items-center justify-between gap-2 cursor-pointer list-none">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{i.label}</span>
                        <span className="text-[10px] text-muted-foreground group-open:hidden">show maths</span>
                      </span>
                      <span className="font-mono font-semibold whitespace-nowrap">{fmtFull(i.v)}</span>
                    </summary>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{i.how}</p>
                  </details>
                </li>
              ))}
              <li className="flex items-center justify-between px-3 py-2 bg-brand-muted">
                <span className="font-semibold">Total year-1 cost of ownership</span>
                <span className="font-mono font-bold text-brand">{fmtFull(yearOne.total)}</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Insurance: ABI averages applied to estimated rebuild cost ({fmtFull(estimateRebuildCost(sqft))}). Council tax: MHCLG England 2024–25 band averages.
            </p>
          </Card>

          <Card id="tc-lifetime" className="p-5 scroll-mt-32">
            <h3 className="font-serif font-bold text-brand mb-1">Lifetime view · {lifetimeYears}-year total cost of ownership</h3>
            <p className="text-xs text-muted-foreground mb-4">Stacks completion-day cash, mortgage interest paid, and running costs (inflated annually). Hold-period and inflation rate are adjustable.</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-xs flex justify-between"><span>Hold period</span><span className="font-mono">{lifetimeYears} yrs</span></Label>
                <Slider value={[lifetimeYears]} onValueChange={([v]) => setLifetimeYears(v)} min={1} max={30} step={1} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs flex justify-between"><span>Cost inflation</span><span className="font-mono">{inflationPct}%</span></Label>
                <Slider value={[inflationPct]} onValueChange={([v]) => setInflationPct(v)} min={0} max={8} step={0.5} className="mt-2" />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-muted/50 rounded-md p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Upfront cash</p><p className="font-mono text-lg font-semibold mt-1">{fmtFull(A.total)}</p></div>
              <div className="bg-muted/50 rounded-md p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Mortgage interest</p><p className="font-mono text-lg font-semibold mt-1">{fmtFull(lifetime.interest)}</p></div>
              <div className="bg-muted/50 rounded-md p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Running costs</p><p className="font-mono text-lg font-semibold mt-1">{fmtFull(lifetime.running)}</p></div>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={lifetime.chart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `£${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Bar dataKey="Upfront" stackId="a" fill="hsl(var(--brand))" />
                  <Bar dataKey="Interest" stackId="a" fill="hsl(var(--warning))" />
                  <Bar dataKey="Running" stackId="a" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between bg-brand-muted rounded-md px-3 py-2">
              <span className="font-semibold text-brand">{lifetimeYears}-year true total</span>
              <span className="font-mono font-bold text-brand text-lg">{fmtFull(lifetime.total)}</span>
            </div>
          </Card>
        </div>
        </div>
      </div>
    </>
  );
}
