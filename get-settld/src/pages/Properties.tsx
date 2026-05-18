import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bed, Bath, Maximize, Calendar, Zap, Trophy, Plus, X, TrendingUp, Heart, Sliders } from "lucide-react";
import { fmt, fmtFull } from "@/lib/format";
import { PROPS, scoreProperties, DEFAULT_WEIGHTS, Weights } from "@/data/properties";
import ShareMenu from "@/components/ShareMenu";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runAvm, buildComparables } from "@/lib/avm";
import { computeFit, DEFAULT_PRIORITIES, PropertyFit } from "@/lib/rightFit";
import { deriveWeightsFor } from "@/lib/autoScore";
import PropertyDisclosure from "@/components/PropertyDisclosure";

const TOP_PROP_KEY = "homestead-top-property-v1";

export default function Properties() {
  const [params, setParams] = useSearchParams();
  const initial = useMemo(() => {
    const fromUrl = params.get("ids")?.split(",").filter(Boolean);
    if (fromUrl?.length) {
      const valid = fromUrl.filter((id) => PROPS.some((p) => p.id === id));
      if (valid.length) return valid;
    }
    return PROPS.map((p) => p.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [selected, setSelected] = useState<string[]>(initial);
  const [profile, setProfile] = useState<"ftb" | "investor" | "family" | "downsizer">("ftb");
  const autoWeights = useMemo(() => deriveWeightsFor(profile), [profile]);
  const [override, setOverride] = useState(false);
  const [manualWeights, setManualWeights] = useState<Weights>(autoWeights.weights);
  useEffect(() => { if (!override) setManualWeights(autoWeights.weights); }, [autoWeights, override]);
  const weights = override ? manualWeights : autoWeights.weights;

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (selected.length && selected.length !== PROPS.length) next.set("ids", selected.join(","));
    else next.delete("ids");
    setParams(next, { replace: true });
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = PROPS.filter((p) => selected.includes(p.id));
  const remaining = PROPS.filter((p) => !selected.includes(p.id));
  const scored = useMemo(() => scoreProperties(filtered, weights), [filtered, weights]);
  const winner = scored[0];
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // AVM + Right-fit per shortlisted property
  const enriched = useMemo(() => scored.map((p) => {
    const seedPpsf = Math.round(p.price / p.sqft);
    const comps = buildComparables(seedPpsf, p.sqft, 6, p.id);
    const avm = runAvm({
      area: p.area, sqft: p.sqft, beds: p.beds, yearBuilt: p.yearBuilt,
      epc: p.epc, tenure: p.tenure, leaseYears: p.tenure === "Leasehold" ? 84 : undefined,
      conditionScore: Math.max(0, Math.min(10, 10 - (2025 - p.yearBuilt) / 15)),
    }, comps);

    // Right-fit using the area's general scores as proxy and tenure for affordability
    const fitProp: PropertyFit = {
      id: p.id, name: p.address,
      scores: {
        commute: 70, schools: 70, greenSpace: 65, nightlife: 55,
        safety: 75, affordability: Math.max(20, Math.min(100, 100 - (p.price / 8000))),
        spaceInside: Math.min(100, (p.sqft / 10)), futureGrowth: p.epc === "B" ? 80 : 60,
      },
    };
    const fit = computeFit(fitProp, DEFAULT_PRIORITIES.young_family);

    const stance: "below" | "around" | "above" =
      p.price < avm.p10 ? "below" : p.price > avm.p90 ? "above" : "around";

    return { ...p, avm, fit, stance };
  }), [scored]);


  // Persist winner for the cross-tool PDF report
  useEffect(() => {
    if (!winner) return;
    try { localStorage.setItem(TOP_PROP_KEY, JSON.stringify(winner)); } catch {}
  }, [winner]);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/properties${selected.length !== PROPS.length ? "?ids=" + selected.join(",") : ""}`
    : "";

  const summaryText = useMemo(() => {
    const lines = [
      "HOMESTEAD LEDGER - PROPERTY COMPARISON",
      "Generated " + new Date().toLocaleDateString("en-GB"),
      "=".repeat(48),
      "",
    ];
    scored.forEach((p, i) => {
      lines.push(`${i === 0 ? "★ " : "  "}${p.address} - ${p.area}`);
      lines.push(`   Score: ${p.total}/100   Price: ${fmt(p.price)} (£${p.pricePerSqft}/sqft)`);
      lines.push(`   ${p.beds} bed · ${p.baths} bath · ${p.sqft} sqft · Built ${p.yearBuilt} · EPC ${p.epc} · ${p.tenure}`);
      if (p.serviceCharge > 0) lines.push(`   Service charge: ${fmtFull(p.serviceCharge)}/yr`);
      lines.push("   + " + p.pros.join("\n   + "));
      lines.push("   - " + p.cons.join("\n   - "));
      lines.push("");
    });
    if (winner) lines.push(`Best match: ${winner.address} (${winner.total}/100)`);
    lines.push("Open this comparison: " + shareUrl);
    return lines.join("\n");
  }, [scored, winner, shareUrl]);

  return (
    <div>
      <PageHeader
        eyebrow="Tool · Properties"
        title="Weigh up properties on what really matters."
        description="Side-by-side comparison with a weighted score on price, size, condition, tenure and energy rating."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mr-2">Add property:</span>
          {remaining.map((p) => (
            <Button key={p.id} variant="outline" size="sm" onClick={() => toggle(p.id)} className="border-brand/30 text-brand hover:bg-brand-muted">
              <Plus className="w-3 h-3 mr-1" /> {p.address}
            </Button>
          ))}
          {remaining.length === 0 && <span className="text-sm text-muted-foreground">All sample properties added.</span>}
          <div className="ml-auto">
            <ShareMenu
              shareUrl={shareUrl}
              summaryText={summaryText}
              filename="property-comparison.txt"
              title="Share property comparison"
            />
          </div>
        </div>

        <div className={`grid gap-5 ${enriched.length === 1 ? "md:grid-cols-1" : enriched.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {enriched.map((p) => {
            const isWinner = p.id === winner?.id;
            const stanceColor = p.stance === "below" ? "text-success bg-success/10 border-success/30"
              : p.stance === "above" ? "text-destructive bg-destructive/10 border-destructive/30"
              : "text-muted-foreground bg-muted border-muted-foreground/20";
            const stanceLabel = p.stance === "below" ? "Below AVM range" : p.stance === "above" ? "Above AVM range" : "Within AVM range";
            return (
              <Card key={p.id} className={`p-6 shadow-soft relative ${isWinner ? "border-brand/40 ring-1 ring-brand/20" : ""}`}>
                <button
                  onClick={() => toggle(p.id)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
                {isWinner && (
                  <Badge className="absolute -top-2.5 left-5 bg-brand text-brand-foreground border-0 hover:bg-brand">
                    <Trophy className="w-3 h-3 mr-1" /> Best match
                  </Badge>
                )}
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{p.area}</p>
                <h3 className="font-serif text-xl font-bold text-brand mt-1">{p.address}</h3>

                <div className="flex items-baseline gap-2 mt-4">
                  <p className="font-mono text-3xl font-bold text-brand">{fmt(p.price)}</p>
                  <p className="text-xs text-muted-foreground">£{p.pricePerSqft}/sqft</p>
                </div>

                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {[
                    { i: Bed, v: p.beds, l: "beds" },
                    { i: Bath, v: p.baths, l: "baths" },
                    { i: Maximize, v: p.sqft, l: "sqft" },
                  ].map((s) => (
                    <div key={s.l} className="flex flex-col items-center bg-muted/50 rounded-lg py-2.5">
                      <s.i className="w-4 h-4 text-brand mb-1" />
                      <span className="font-mono font-semibold">{s.v}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.l}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Built {p.yearBuilt}</div>
                  <div className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-muted-foreground" /> EPC {p.epc}</div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-brand/30">{p.tenure}</Badge>
                    {p.serviceCharge > 0 && <span className="text-muted-foreground">{fmtFull(p.serviceCharge)}/yr service</span>}
                  </div>
                </div>

                {/* AVM panel */}
                <div className="mt-5 pt-5 border-t">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> AVM range (P10–P90)</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${stanceColor}`}>{stanceLabel}</span>
                  </div>
                  <p className="font-mono text-sm font-semibold text-brand">{fmt(p.avm.p10)} → <span className="text-base">{fmt(p.avm.p50)}</span> → {fmt(p.avm.p90)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{p.avm.confidence} confidence · {p.avm.comps.length} comparables</p>
                </div>

                {/* Dual scores: Composite + Right-fit */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Composite</span>
                      <span className="font-serif text-lg font-bold text-brand">{p.total}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-brand" style={{ width: `${p.total}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Heart className="w-2.5 h-2.5" /> Right-fit</span>
                      <span className="font-serif text-lg font-bold text-accent">{p.fit.total}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${p.fit.total}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-xs">
                  {p.pros.slice(0, 2).map((x) => <p key={x} className="text-success">+ {x}</p>)}
                  {p.cons.slice(0, 1).map((x) => <p key={x} className="text-muted-foreground">− {x}</p>)}
                </div>

                <PropertyDisclosure p={p} />

                <Link to="/avm" className="mt-3 inline-block text-[11px] text-brand underline">Open full AVM →</Link>
              </Card>
            );
          })}
        </div>

        <Card className="p-6 bg-brand-muted/40 border-brand/20 shadow-soft">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-brand font-semibold">Composite weights - auto from buyer profile</p>
              <p className="text-sm text-muted-foreground">{autoWeights.rationale}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={profile} onValueChange={(v: any) => setProfile(v)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ftb">First-time buyer</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="downsizer">Downsizer</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Override</Label>
                <Switch checked={override} onCheckedChange={setOverride} />
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-5 gap-4">
            {(Object.keys(weights) as (keyof Weights)[]).map((k) => (
              <div key={k}>
                <div className="flex justify-between mb-1.5">
                  <Label className="text-xs capitalize">{k}</Label>
                  <span className="font-mono text-xs font-semibold text-brand">{weights[k]}</span>
                </div>
                <Slider value={[weights[k]]} min={0} max={50} step={1}
                  disabled={!override}
                  onValueChange={(v) => setManualWeights((w) => ({ ...w, [k]: v[0] }))} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
