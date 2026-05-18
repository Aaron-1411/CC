import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Sparkles, FileText, Clock } from "lucide-react";
import { useScenario } from "@/context/ScenarioContext";
import { evaluateSchemes, bestCombination } from "@/lib/schemes";
import { fmtFull } from "@/lib/format";
import { Region } from "@/lib/taxes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Jargon from "@/components/Jargon";
import RegionTerm from "@/components/RegionTerm";

export default function Schemes() {
  const { scenario, setScenario } = useScenario();
  const [age, setAge] = useState(30);
  const [monthsToBuy, setMonthsToBuy] = useState(24);
  const [lisaMonthly, setLisaMonthly] = useState(333);

  const inputs = useMemo(() => ({
    age, income: scenario.income, price: scenario.price, deposit: scenario.deposit,
    ftb: scenario.isFTB, region: scenario.region as Region,
    monthsToBuy, lisaMonthly,
  }), [age, scenario, monthsToBuy, lisaMonthly]);

  const evaluated = useMemo(() => evaluateSchemes(inputs), [inputs]);
  const visible = evaluated.filter((s) => s.regions.includes(inputs.region));
  const eligibleCount = visible.filter((s) => s.eligible).length;
  const combo = useMemo(() => bestCombination(visible), [visible]);

  return (
    <>
      <PageHeader
        eyebrow="Government schemes"
        title="Schemes Eligibility & Best Combination"
        description={<>Region-aware UK schemes (<Jargon term="LISA" />, <Jargon term="HPC" glossaryKey="HPC">Help to Buy</Jargon>, <RegionTerm term="stampDuty" /> relief…) with £ benefit quantified, optimal stacking, application timelines, and document checklists.</>}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1 space-y-4 h-fit">
          <h2 className="font-serif text-xl font-bold text-brand">Your situation</h2>
          <div><Label>Age</Label><NumberInput value={age} onChange={setAge} /></div>
          <div><Label>Annual income</Label><NumberInput value={scenario.income} onChange={(n) => setScenario({ income: n })} /></div>
          <div><Label>Target price</Label><NumberInput value={scenario.price} onChange={(n) => setScenario({ price: n })} /></div>
          <div><Label>Deposit</Label><NumberInput value={scenario.deposit} onChange={(n) => setScenario({ deposit: n })} /></div>
          <div>
            <Label>Region</Label>
            <Select value={scenario.region} onValueChange={(v: any) => setScenario({ region: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="england">England</SelectItem>
                <SelectItem value="scotland">Scotland</SelectItem>
                <SelectItem value="wales">Wales</SelectItem>
                <SelectItem value="ni">Northern Ireland</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Months to buy</Label><NumberInput value={monthsToBuy} onChange={setMonthsToBuy} /></div>
            <div><Label className="text-xs">LISA £/mo</Label><NumberInput value={lisaMonthly} onChange={(n) => setLisaMonthly(Math.min(333, n))} /></div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 bg-gradient-warm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Eligibility summary</p>
                <p className="font-serif text-2xl font-bold text-brand mt-1">{eligibleCount} of {visible.length} schemes</p>
                <p className="text-xs text-muted-foreground mt-1">filtered for {inputs.region.toUpperCase()}</p>
              </div>
              <Badge className="bg-brand-muted text-brand border-0">Indicative</Badge>
            </div>
            {combo.totalBenefit > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <p className="text-[11px] uppercase tracking-widest text-brand font-semibold">Best legal combination</p>
                </div>
                <p className="font-serif text-3xl font-bold text-brand">{fmtFull(combo.totalBenefit)} <span className="text-sm font-sans text-muted-foreground">total benefit</span></p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {combo.picked.map((s) => (
                    <Badge key={s.id} className="bg-success/15 text-success border-0">{s.name} · {fmtFull(s.benefit)}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {visible.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  {r.eligible ? <CheckCircle2 className="w-5 h-5 text-success" /> : <XCircle className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-brand">{r.name}</h3>
                      {r.eligible
                        ? <Badge className="bg-success/15 text-success border-0">Eligible</Badge>
                        : <Badge variant="secondary">Not eligible</Badge>}
                    </div>
                    {r.eligible && r.benefit > 0 && (
                      <span className="font-mono font-bold text-brand">{fmtFull(r.benefit)}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
                  <p className="text-xs mt-2 flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{r.reason}</p>
                  {r.eligible && (
                    <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-muted/40 rounded-md p-2.5">
                        <p className="font-semibold text-brand mb-1">£ benefit explained</p>
                        <p className="text-muted-foreground">{r.benefitNote}</p>
                      </div>
                      <div className="bg-muted/40 rounded-md p-2.5">
                        <p className="font-semibold text-brand mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Application timeline</p>
                        <p className="text-muted-foreground">{r.timeline}</p>
                      </div>
                      <div className="bg-muted/40 rounded-md p-2.5 sm:col-span-2">
                        <p className="font-semibold text-brand mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Documents needed</p>
                        <ul className="text-muted-foreground list-disc list-inside">
                          {r.docs.map((d) => <li key={d}>{d}</li>)}
                        </ul>
                      </div>
                      {r.conflictsWith && r.conflictsWith.length > 0 && (
                        <div className="bg-warning/10 text-warning-foreground rounded-md p-2.5 sm:col-span-2 border border-warning/30">
                          <p className="font-semibold mb-1">⚠ Cannot stack with</p>
                          <p>{r.conflictsWith.join(", ")}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
