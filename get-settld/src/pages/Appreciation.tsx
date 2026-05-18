import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Jargon from "@/components/Jargon";
import FreshnessPill from "@/components/FreshnessPill";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Train, GraduationCap, Hammer, Building2, Sparkles, Sliders } from "lucide-react";
import { fmt } from "@/lib/format";
import { useScenario as useScenarioCtx } from "@/context/ScenarioContext";
import { AREAS } from "@/data/areas";
import { deriveAppreciation } from "@/lib/autoScore";
import MethodologyPopover from "@/components/MethodologyPopover";
import CitationsPanel from "@/components/CitationsPanel";
import CitationsCoveragePanel from "@/components/CitationsCoveragePanel";

const ICONS: Record<string, any> = {
  "Transport & connectivity": Train,
  "School quality": GraduationCap,
  "Regeneration & investment": Hammer,
  "Supply pressure (scarcity)": Building2,
  "Property condition vs area": Sparkles,
  "Demographic momentum": TrendingUp,
};

export default function Appreciation() {
  const { scenario, setScenario } = useScenarioCtx();
  const price = scenario.price;
  const setPrice = (price: number) => setScenario({ price });

  const [areaId, setAreaId] = useState<string>(AREAS[0].id);
  const area = useMemo(() => AREAS.find((a) => a.id === areaId) ?? AREAS[0], [areaId]);

  // Derived scores from the area dataset - this is the default.
  const derived = useMemo(() => deriveAppreciation(area), [area]);

  // Expert override mode: user can adjust factor sliders manually.
  const [override, setOverride] = useState(false);
  const [overrides, setOverrides] = useState<number[]>(derived.factors.map((f) => f.value));
  // Reset overrides whenever the underlying derivation changes
  useEffect(() => { setOverrides(derived.factors.map((f) => f.value)); }, [derived]);

  const factorValues = override ? overrides : derived.factors.map((f) => f.value);
  const wArr = [0.22, 0.18, 0.18, 0.15, 0.12, 0.15];
  const score = Math.round(factorValues.reduce((s, v, i) => s + v * wArr[i], 0) * 10);
  const implied = +(1 + (score / 100) * 5).toFixed(2);

  const v5 = price * Math.pow(1 + implied / 100, 5);
  const v10 = price * Math.pow(1 + implied / 100, 10);
  const gain5 = v5 - price;
  const gain10 = v10 - price;

  // Monte Carlo (deferred to idle for first paint)
  const [mcReady, setMcReady] = useState(false);
  useEffect(() => {
    const id = (window as any).requestIdleCallback
      ? (window as any).requestIdleCallback(() => setMcReady(true))
      : window.setTimeout(() => setMcReady(true), 0);
    return () => {
      if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [score, price]);

  const monteCarlo = useMemo(() => {
    if (!mcReady) return null;
    const sigma = (8 - (score / 100) * 4) / 100;
    const horizon = 10;
    const sims = 600;
    let h = score * 1000 + 1;
    const rand = () => { h = (h * 1664525 + 1013904223) | 0; return ((h >>> 0) / 0xffffffff); };
    const norm = () => {
      const u1 = Math.max(1e-9, rand()); const u2 = rand();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    };
    const finals: number[][] = Array.from({ length: horizon + 1 }, () => []);
    finals[0] = Array(sims).fill(price);
    for (let s = 0; s < sims; s++) {
      let v = price;
      for (let y = 1; y <= horizon; y++) {
        const drift = implied / 100;
        v *= Math.exp(drift - 0.5 * sigma * sigma + sigma * norm());
        finals[y].push(v);
      }
    }
    const percentile = (arr: number[], p: number) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length * p)];
    };
    return Array.from({ length: horizon + 1 }, (_, y) => ({
      year: y,
      p10: Math.round(percentile(finals[y], 0.10)),
      p50: Math.round(percentile(finals[y], 0.50)),
      p90: Math.round(percentile(finals[y], 0.90)),
    }));
  }, [price, implied, score, mcReady]);

  const grade =
    score >= 80 ? { label: "Outstanding", color: "text-success", bg: "bg-success/10" } :
    score >= 65 ? { label: "Strong", color: "text-brand", bg: "bg-brand-muted" } :
    score >= 50 ? { label: "Steady", color: "text-warning", bg: "bg-warning/10" } :
                  { label: "Cautious", color: "text-destructive", bg: "bg-destructive/10" };

  return (
    <div>
      <PageHeader
        eyebrow="Tool · Appreciation"
        title="Will this property hold its value - and grow?"
        description={<>Auto-derived from Land Registry, ONS <Jargon term="HPI" />, Ofsted, DfT and regen pipeline data. Each factor explains itself - you don't have to score anything.</>}
        actions={<FreshnessPill source="ONS HPI · HM Land Registry" />}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h3 className="font-serif text-lg font-bold text-brand">Auto-derived factors</h3>
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
              <Label htmlFor="ovr" className="text-xs text-muted-foreground">Expert override</Label>
              <Switch id="ovr" checked={override} onCheckedChange={setOverride} />
            </div>
          </div>

          <div className="mb-6 grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Area</Label>
              <Select value={areaId} onValueChange={setAreaId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {AREAS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Current price</Label>
                <span className="font-mono text-sm font-semibold text-brand">{fmt(price)}</span>
              </div>
              <Slider value={[price]} min={150_000} max={1_500_000} step={5_000} onValueChange={(v) => setPrice(v[0])} />
            </div>
          </div>

          <div className="space-y-5">
            {derived.factors.map((f, i) => {
              const Icon = ICONS[f.label] ?? TrendingUp;
              const val = factorValues[i];
              return (
                <div key={f.label}>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm flex items-center gap-2 text-foreground">
                      <Icon className="w-4 h-4 text-brand" /> {f.label}
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-brand">{val.toFixed(1)}/10</span>
                      <MethodologyPopover trace={f} />
                    </div>
                  </div>
                  <Slider
                    value={[val]} min={0} max={10} step={0.1}
                    disabled={!override}
                    onValueChange={(v) => setOverrides((arr) => arr.map((x, idx) => idx === i ? v[0] : x))}
                  />
                  {!override && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Auto: {f.formula} · {f.source}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="lg:col-span-5 space-y-6">
          <Card className="p-7 bg-gradient-brand text-brand-foreground shadow-card border-0 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] opacity-75">Appreciation Score</p>
            <p className="font-serif text-7xl font-bold mt-3 tracking-tight">{score}</p>
            <p className="opacity-80 mt-1">out of 100 · {override ? "expert override" : "auto-derived"}</p>
            <Badge className={`mt-4 ${grade.bg} ${grade.color} hover:${grade.bg} border-0 px-3 py-1 text-sm`}>
              {grade.label}
            </Badge>
          </Card>

          <Card className="p-6 shadow-soft">
            <h4 className="font-serif font-bold text-brand mb-4">Implied 10‑year forecast</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Derived growth rate <span className="font-mono font-semibold text-foreground">{implied.toFixed(1)}%</span>/yr.
            </p>
            <div className="space-y-3">
              {[
                { l: "Today", v: price, gain: 0, year: "2026" },
                { l: "5 years", v: v5, gain: gain5, year: "2031" },
                { l: "10 years", v: v10, gain: gain10, year: "2036" },
              ].map((row) => (
                <div key={row.l} className="flex items-baseline justify-between border-b last:border-0 pb-3 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{row.l}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{row.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-brand">{fmt(row.v)}</p>
                    {row.gain > 0 && (
                      <p className="text-xs font-mono text-success flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" /> +{fmt(row.gain)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 shadow-soft">
            <h4 className="font-serif font-bold text-brand mb-1">Probabilistic forecast (10y)</h4>
            <p className="text-xs text-muted-foreground mb-4">600-path Monte Carlo. Bands show P10 / P50 / P90.</p>
            {!monteCarlo ? (
              <p className="text-xs text-muted-foreground">Computing…</p>
            ) : (
              <div className="space-y-1.5">
                {monteCarlo.filter((_, i) => i === 0 || i === 3 || i === 5 || i === 10).map((row) => {
                  const minV = monteCarlo[0].p10;
                  const maxV = monteCarlo[10].p90;
                  const range = Math.max(1, maxV - minV);
                  const left = ((row.p10 - minV) / range) * 100;
                  const width = ((row.p90 - row.p10) / range) * 100;
                  const mid = ((row.p50 - minV) / range) * 100;
                  return (
                    <div key={row.year} className="grid grid-cols-12 items-center gap-2 text-xs">
                      <span className="col-span-1 font-mono text-muted-foreground">Y{row.year}</span>
                      <div className="col-span-8 relative h-3 bg-muted rounded-full">
                        <div className="absolute h-full rounded-full bg-brand/30" style={{ left: `${left}%`, width: `${width}%` }} />
                        <div className="absolute h-full w-0.5 bg-brand" style={{ left: `${mid}%` }} />
                      </div>
                      <span className="col-span-3 font-mono text-right">{fmt(row.p10)}-{fmt(row.p90)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <CitationsPanel
            traces={derived.factors.map((f) => ({
              trace: f,
              location: `Appreciation · ${f.label}`,
            }))}
          />

          <CitationsCoveragePanel
            traces={derived.factors.map((f) => ({
              trace: f,
              location: `Appreciation · ${f.label}`,
            }))}
          />

          <Card className="p-5 shadow-soft bg-accent/10 border-accent/30">
            <p className="text-xs text-foreground leading-relaxed flex items-start gap-2">
              <TrendingDown className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <span>
                Property values can fall as well as rise. Scores derive from public data - not a guarantee.
                Always combine with a survey and broker advice.
              </span>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
