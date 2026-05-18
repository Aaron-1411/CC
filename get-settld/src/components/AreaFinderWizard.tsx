import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ChevronRight, RotateCcw, ShieldAlert, Check } from "lucide-react";
import {
  BuyerBrief, AreaMatch, findAreas,
  LIFESTYLE_OPTIONS, MUST_HAVE_OPTIONS, DEAL_BREAKER_OPTIONS,
  type Lifestyle, type MustHave, type DealBreaker,
} from "@/lib/areaFinder";
import { REGIONS } from "@/data/areas";
import { fmt } from "@/lib/format";

interface Props {
  region: string;
  query: string;
  onPick: (areaId: string) => void;
}

export default function AreaFinderWizard({ region, query, onPick }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [budget, setBudget] = useState<number>(400_000);
  const [lifestyle, setLifestyle] = useState<Lifestyle>("first_time_buyer");
  const [mustHaves, setMustHaves] = useState<MustHave[]>(["affordable", "low_crime"]);
  const [dealBreakers, setDealBreakers] = useState<DealBreaker[]>(["above_budget"]);
  const [briefRegion, setBriefRegion] = useState<string>(region || "all");
  const [results, setResults] = useState<AreaMatch[] | null>(null);

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const run = () => {
    const brief: BuyerBrief = {
      budget, lifestyle, mustHaves, dealBreakers,
      region: briefRegion, query,
    };
    setResults(findAreas(brief, 8));
    setStep(5);
  };

  const reset = () => { setResults(null); setStep(1); };

  return (
    <Card className="p-6 shadow-soft border-brand/30 bg-gradient-to-br from-brand-muted/30 to-transparent">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-brand flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Find your area
          </p>
          <h3 className="font-serif text-xl font-bold text-brand mt-1">Tell us what you're looking for.</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Five quick questions. We rank UK areas against your brief and explain why.
          </p>
        </div>
        {results && (
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Start over
          </Button>
        )}
      </div>

      {!results && (
        <>
          <div className="flex gap-1 mb-5" aria-label={`Step ${step} of 4`}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={`h-1 flex-1 rounded-full ${n <= step ? "bg-brand" : "bg-muted"}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Your max budget</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-mono text-muted-foreground">£</span>
                  <Input
                    type="number" min={50_000} step={5_000} value={budget}
                    onChange={(e) => setBudget(Math.max(50_000, Number(e.target.value) || 0))}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">~ {fmt(budget)} — we allow 5% headroom on the median.</p>
              </div>
              <div>
                <Label>Region (optional)</Label>
                <Select value={briefRegion} onValueChange={setBriefRegion}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All UK regions</SelectItem>
                    {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <Label>Which best describes you?</Label>
              <div className="grid sm:grid-cols-2 gap-2 mt-1">
                {LIFESTYLE_OPTIONS.map((o) => (
                  <button key={o.v}
                    onClick={() => setLifestyle(o.v)}
                    className={`text-left rounded-lg border p-3 transition-colors ${
                      lifestyle === o.v ? "border-brand bg-brand-muted" : "border-border hover:bg-muted"
                    }`}>
                    <p className="font-semibold text-sm">{o.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{o.hint}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <Label>Must-haves <span className="text-xs text-muted-foreground font-normal">(pick any)</span></Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {MUST_HAVE_OPTIONS.map((o) => {
                  const active = mustHaves.includes(o.v);
                  return (
                    <button key={o.v}
                      onClick={() => setMustHaves((m) => toggle(m, o.v))}
                      className={`text-sm rounded-full px-3 py-1.5 border transition-colors ${
                        active ? "bg-brand text-brand-foreground border-brand" : "border-border hover:bg-muted"
                      }`}>
                      {active && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2">
              <Label>Deal-breakers <span className="text-xs text-muted-foreground font-normal">(we'll flag any area that hits one)</span></Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DEAL_BREAKER_OPTIONS.map((o) => {
                  const active = dealBreakers.includes(o.v);
                  return (
                    <button key={o.v}
                      onClick={() => setDealBreakers((d) => toggle(d, o.v))}
                      className={`text-sm rounded-full px-3 py-1.5 border transition-colors ${
                        active ? "bg-destructive text-destructive-foreground border-destructive" : "border-border hover:bg-muted"
                      }`}>
                      {active && <ShieldAlert className="w-3 h-3 inline mr-1 -mt-0.5" />}
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => (s - 1) as any)}>
              Back
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep((s) => (s + 1) as any)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={run}>Show my matches <Sparkles className="w-4 h-4 ml-1.5" /></Button>
            )}
          </div>
        </>
      )}

      {results && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Top {results.length} of {findAreas({ ...{} as any, lifestyle, mustHaves, dealBreakers, budget, region: briefRegion, query }).length}+ areas match your brief.
            Click any to add to comparison.
          </p>
          {results.map((m) => (
            <button key={m.area.id} onClick={() => onPick(m.area.id)}
              className="w-full text-left rounded-lg border bg-card hover:bg-muted/40 transition-colors p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif font-bold text-brand">{m.area.name}</span>
                    <span className="text-xs text-muted-foreground">{m.area.region}</span>
                    {m.blocked && (
                      <Badge variant="outline" className="border-destructive/40 text-destructive text-[10px]">
                        <ShieldAlert className="w-3 h-3 mr-1" /> {m.blocked}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmt(m.area.medianPrice)} median · {m.area.yield}% yield · +{m.area.growth5y}% / 5yr
                  </p>
                  {m.reasons.length > 0 && (
                    <p className="text-xs text-success mt-1.5">{m.reasons.join(" · ")}</p>
                  )}
                  {m.warnings.length > 0 && (
                    <p className="text-xs text-warning mt-0.5">⚠ {m.warnings.join(" · ")}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-2xl font-bold text-brand">{m.score}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
