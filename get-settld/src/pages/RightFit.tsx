import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ThumbsUp, ThumbsDown, Sliders, Search, MapPin } from "lucide-react";
import { computeFit, DEFAULT_PRIORITIES, Lifestyle, Priorities, PropertyFit } from "@/lib/rightFit";
import { AREAS, REGIONS } from "@/data/areas";
import { deriveAreaFit } from "@/lib/autoScore";
import MethodologyPopover from "@/components/MethodologyPopover";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import FreshnessPill from "@/components/FreshnessPill";

const LIFESTYLES: { v: Lifestyle; label: string }[] = [
  { v: "city_pro", label: "City professional" },
  { v: "young_family", label: "Young family" },
  { v: "growing_family", label: "Growing family" },
  { v: "downsizer", label: "Downsizer" },
  { v: "remote_worker", label: "Remote worker" },
  { v: "investor", label: "Investor" },
];

const FIELDS: { k: keyof Priorities; label: string }[] = [
  { k: "commute", label: "Commute" },
  { k: "schools", label: "Schools" },
  { k: "greenSpace", label: "Green space" },
  { k: "nightlife", label: "Nightlife & culture" },
  { k: "safety", label: "Safety" },
  { k: "affordability", label: "Affordability" },
  { k: "spaceInside", label: "Internal space" },
  { k: "futureGrowth", label: "Future growth" },
];

export default function RightFit() {
  const [lifestyle, setLifestyle] = useState<Lifestyle>("young_family");
  const [prio, setPrio] = useState<Priorities>(DEFAULT_PRIORITIES.young_family);
  const [overridePrio, setOverridePrio] = useState(false);
  const [region, setRegion] = useState<string>("all");
  const [query, setQuery] = useState("");

  const applyPreset = (l: Lifestyle) => {
    setLifestyle(l);
    setPrio(DEFAULT_PRIORITIES[l]);
  };

  // Pull from the full UK dataset, narrowed by the user's region + search.
  // Score up to 200 candidates against priorities then surface the best 8 —
  // keeps the page snappy without losing geographic coverage.
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AREAS.filter((a) => {
      if (region !== "all" && a.region !== region) return false;
      if (q && !a.name.toLowerCase().includes(q) && !a.region.toLowerCase().includes(q)) return false;
      return true;
    }).slice(0, 200);
  }, [region, query]);

  const scored = useMemo(() => candidates.map((a) => {
    const fit = deriveAreaFit(a);
    const propFit: PropertyFit = { id: a.id, name: a.name, scores: fit.scores };
    const result = computeFit(propFit, prio);
    return { area: a, fit, propFit, result };
  }).sort((x, y) => y.result.total - x.result.total).slice(0, 8), [candidates, prio]);

  return (
    <>
      <PageHeader
        eyebrow="Tool · Right-fit score"
        title="Is this property actually right for the life you want?"
        description="Auto-derived from public data - every factor explains itself. Pick a lifestyle, we do the rest."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 p-6 h-fit lg:sticky lg:top-20 shadow-soft space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-brand">Your priorities</h3>
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
              <Switch checked={overridePrio} onCheckedChange={setOverridePrio} />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Lifestyle preset</Label>
            <Select value={lifestyle} onValueChange={(v: any) => applyPreset(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LIFESTYLES.map((l) => <SelectItem key={l.v} value={l.v}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">Toggle "expert override" to fine-tune weights.</p>
          </div>

          <div className="grid gap-3 pt-2 border-t">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Region (anywhere in UK)
              </Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">All UK regions</SelectItem>
                  {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5 flex items-center gap-1">
                <Search className="w-3 h-3" /> Search town / postcode
              </Label>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Manchester, BS6, Cambridge…" />
              <p className="text-[10px] text-muted-foreground mt-1">
                Scoring against {candidates.length.toLocaleString()} of {AREAS.length.toLocaleString()} areas — top 8 surfaced.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {FIELDS.map((f) => (
              <div key={f.k}>
                <div className="flex justify-between mb-1.5">
                  <Label className="text-sm">{f.label}</Label>
                  <span className="font-mono text-sm font-semibold text-brand">{prio[f.k]}/10</span>
                </div>
                <Slider
                  value={[prio[f.k]]} min={0} max={10} step={1}
                  disabled={!overridePrio}
                  onValueChange={(v) => setPrio((p) => ({ ...p, [f.k]: v[0] }))}
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <ConfidenceMeter
              checks={[
                { id: "lifestyle", label: "Lifestyle preset chosen", complete: !!lifestyle },
                { id: "weights", label: "Weights customised", complete: overridePrio, hint: "Toggle Expert override to fine-tune" },
                { id: "candidates", label: `Areas to compare (${candidates.length})`, complete: candidates.length > 0 },
              ]}
            />
            <FreshnessPill source="ONS / Ofsted / DfT" />
          </div>
          {scored.map(({ area, fit, result }, i) => {
            const isWinner = i === 0;
            return (
              <Card key={area.id} className={`p-6 shadow-soft ${isWinner ? "border-brand/40 ring-1 ring-brand/20" : ""}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    {isWinner && <Badge className="bg-brand text-brand-foreground border-0 mb-2"><Heart className="w-3 h-3 mr-1" /> Best fit</Badge>}
                    <h3 className="font-serif text-xl font-bold text-brand">{area.name}</h3>
                    <p className="text-xs text-muted-foreground">{area.region} · {area.vibe}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Right-fit</p>
                    <p className="font-serif text-3xl font-bold text-brand">{result.total}<span className="text-sm text-muted-foreground font-sans">/100</span></p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {result.breakdown.map((b) => {
                    const trace = fit.traces[b.key as keyof typeof fit.traces];
                    return (
                      <div key={b.key} className="grid grid-cols-12 items-center gap-2 text-xs">
                        <span className="col-span-3 text-muted-foreground flex items-center gap-1">
                          {b.label}
                          {trace && <MethodologyPopover trace={trace} triggerLabel="" />}
                        </span>
                        <div className="col-span-7 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-brand" style={{ width: `${b.score}%` }} />
                        </div>
                        <span className="col-span-1 font-mono text-right">{b.score}</span>
                        <span className="col-span-1 text-right text-muted-foreground">×{b.weight}</span>
                      </div>
                    );
                  })}
                </div>

                {(result.strengths.length > 0 || result.weaknesses.length > 0) && (
                  <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
                    {result.strengths.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-success mb-1.5 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> Strengths for you
                        </p>
                        {result.strengths.map((s) => <p key={s} className="text-success">+ {s}</p>)}
                      </div>
                    )}
                    {result.weaknesses.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-destructive mb-1.5 flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3" /> Watch-outs
                        </p>
                        {result.weaknesses.map((s) => <p key={s} className="text-destructive">− {s}</p>)}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
