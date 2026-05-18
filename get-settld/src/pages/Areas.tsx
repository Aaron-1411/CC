import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Train, GraduationCap, Shield, TrendingUp, PoundSterling, Trees, X, Clock, Bus, Bike, Car, Award, Sparkles, LineChart, Building2, Gauge, Search, MapPin, Info } from "lucide-react";
import { fmt } from "@/lib/format";
import { AREAS, DESTINATIONS, MODES, REGIONS, CommuteMode, DestinationId, commuteScore, schoolImpactScore, cagr, cumulativeGrowth, valueGap, investmentScore, areaConfidence } from "@/data/areas";
import ShareMenu from "@/components/ShareMenu";
import { buildAreasCsv, downloadCsv, downloadAreasPdf } from "@/lib/areaExport";
import { toast } from "@/hooks/use-toast";
import DataProvenance, { ConfidenceBadge } from "@/components/DataProvenance";
import MethodologySection from "@/components/MethodologySection";
import FreshnessPill from "@/components/FreshnessPill";
import AreaFinderWizard from "@/components/AreaFinderWizard";
import CommuteToPlace from "@/components/CommuteToPlace";
import AreaLiveLocal from "@/components/AreaLiveLocal";
import AreaFtbSnapshot from "@/components/AreaFtbSnapshot";

const MODE_ICON: Record<CommuteMode, typeof Bus> = { tube: Train, rail: Bus, cycle: Bike, drive: Car };

const scoreColor = (n: number) =>
  n >= 75 ? "text-success" : n >= 50 ? "text-foreground" : n >= 30 ? "text-warning" : "text-destructive";
const scoreBar = (n: number) =>
  n >= 75 ? "bg-success" : n >= 50 ? "bg-brand" : n >= 30 ? "bg-warning" : "bg-destructive";

const Bar = ({ value, max = 10, color = "bg-brand" }: { value: number; max?: number; color?: string }) => (
  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
    <div className={`h-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
  </div>
);

export default function Areas() {
  const [params, setParams] = useSearchParams();
  const initial = useMemo(() => {
    const fromUrl = params.get("ids")?.split(",").filter(Boolean);
    if (fromUrl?.length) return fromUrl.filter((id) => AREAS.some((a) => a.id === id));
    return ["tw9", "se15"];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [selected, setSelected] = useState<string[]>(initial);
  const [destination, setDestination] = useState<DestinationId>("london");
  const [mode, setMode] = useState<CommuteMode>("rail");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (selected.length) next.set("ids", selected.join(",")); else next.delete("ids");
    setParams(next, { replace: true });
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const cards = useMemo(() => AREAS.filter((a) => selected.includes(a.id)), [selected]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sel = new Set(selected);
    const out: typeof AREAS = [];
    for (let i = 0; i < AREAS.length; i++) {
      const a = AREAS[i];
      if (sel.has(a.id)) continue;
      if (regionFilter !== "all" && a.region !== regionFilter) continue;
      if (q && !a.name.toLowerCase().includes(q) && !a.region.toLowerCase().includes(q)) continue;
      out.push(a);
    }
    return out;
  }, [selected, regionFilter, query]);
  const RENDER_CAP = 120;
  const remaining = useMemo(() => filtered.slice(0, RENDER_CAP), [filtered]);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/areas?ids=${selected.join(",")}`
    : "";

  const summaryText = useMemo(() => {
    const lines = [
      "HOMESTEAD LEDGER - AREA COMPARISON",
      "Generated " + new Date().toLocaleDateString("en-GB"),
      "=".repeat(48),
      "",
    ];
    const destLabel = DESTINATIONS.find((d) => d.id === destination)?.label;
    const modeLabel = MODES.find((m) => m.id === mode)?.label;
    cards.forEach((a) => {
      const mins = a.commute[mode][destination];
      const sScore = schoolImpactScore(a.schoolBreakdown);
      const iScore = investmentScore(a);
      const i = a.investment;
      lines.push(`${a.name} - ${a.region}`);
      lines.push(`  Median price: ${fmt(a.medianPrice)}   5yr growth: +${a.growth5y}%   Yield: ${a.yield}%`);
      lines.push(`  Commute (${modeLabel} → ${destLabel}): ${mins != null ? mins + " min" : "n/a"}  (score ${commuteScore(mins)}/100)`);
      lines.push(`  School impact: ${sScore}/100  · Primary ${a.schoolBreakdown.primaryOfsted}/10 · Secondary ${a.schoolBreakdown.secondaryOfsted}/10 · ${a.schoolBreakdown.pctOutstanding}% Outstanding · catchment +${a.schoolBreakdown.catchmentPremium}%`);
      lines.push(`  Top school: ${a.schoolBreakdown.topSchool}`);
      lines.push(`  Investment score: ${iScore}/100 · 5yr CAGR ${cagr(i.yearlyGrowth)}% (cum +${cumulativeGrowth(i.yearlyGrowth)}%) · £${i.pricePerSqft}/sqft (${valueGap(i) >= 0 ? valueGap(i) + "% under" : Math.abs(valueGap(i)) + "% over"} region)`);
      lines.push(`  Demand ${i.rentalDemand}/100 · Voids ${i.voidWeeks}w · Regen ${i.capexPipeline}/100 · Affordability ${i.affordabilityRatio}× income`);
      lines.push(`  Vibe: ${a.vibe}`);
      lines.push("  + " + a.pros.join("\n  + "));
      lines.push("  - " + a.cons.join("\n  - "));
      lines.push("");
    });
    lines.push("Open this comparison: " + shareUrl);
    return lines.join("\n");
  }, [cards, shareUrl, destination, mode]);

  return (
    <div>
      <PageHeader
        eyebrow="Tool · Areas"
        title="Compare neighbourhoods side-by-side."
        description="Schools, transport, crime, green space and price growth - see which area fits the life you're building."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <AreaFinderWizard
          region={regionFilter}
          query={query}
          onPick={(id) => setSelected((s) => (s.includes(id) ? s : [...s, id]))}
        />

        {/* Filter + add area + share */}
        <Card className="p-4 shadow-soft">
          <div className="flex flex-wrap items-end gap-3 mb-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1 flex items-center gap-1"><Search className="w-3 h-3" /> Search areas</label>
              <Input placeholder="e.g. Manchester, BS8, commuter…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9" />
            </div>
            <div className="min-w-[200px]">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Region</label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All UK regions</SelectItem>
                  {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="self-end"><FreshnessPill source="ONS HPI · HM Land Registry" /></div>
            <div className="ml-auto">
              <ShareMenu
                shareUrl={shareUrl}
                summaryText={summaryText}
                filename="area-comparison.txt"
                title="Share area comparison"
                onExportPdf={() => {
                  if (!cards.length) { toast({ title: "Pick at least one area", description: "Add areas to compare before exporting." }); return; }
                  downloadAreasPdf(`area-comparison-${cards.length}.pdf`, cards, shareUrl);
                  toast({ title: "PDF generated", description: `${cards.length} area${cards.length === 1 ? "" : "s"} exported.` });
                }}
                onExportCsv={() => {
                  if (!cards.length) { toast({ title: "Pick at least one area", description: "Add areas to compare before exporting." }); return; }
                  downloadCsv(`area-comparison-${cards.length}.csv`, buildAreasCsv(cards));
                  toast({ title: "CSV downloaded", description: `${cards.length} area${cards.length === 1 ? "" : "s"} exported.` });
                }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pt-2 border-t">
            <span className="text-xs uppercase tracking-widest text-muted-foreground self-center mr-1">
              {filtered.length.toLocaleString()} of {AREAS.length.toLocaleString()} area{AREAS.length === 1 ? "" : "s"} match
              {filtered.length > RENDER_CAP ? ` · showing first ${RENDER_CAP}` : ""} · click to add:
            </span>
            {remaining.map((a) => (
              <Button key={a.id} variant="outline" size="sm" onClick={() => toggle(a.id)} className="border-brand/30 text-brand hover:bg-brand-muted h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> {a.name}
                <span className="ml-1.5 text-[10px] text-muted-foreground">{a.region.split(" ")[0]}</span>
              </Button>
            ))}
            {filtered.length === 0 && <span className="text-sm text-muted-foreground">No areas match - clear filters.</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 mt-2 border-t text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Confidence:</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success" /> High - verified source</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-warning" /> Medium - modelled</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> Low - regional benchmark</span>
            <span className="ml-auto">Tap the <Info className="inline w-3 h-3 -mt-0.5" /> on any metric for source &amp; date.</span>
          </div>
        </Card>

        <div className={`grid gap-5 ${cards.length === 1 ? "md:grid-cols-1" : cards.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {cards.map((a) => (
            <Card key={a.id} className="p-6 shadow-soft relative">
              <button
                onClick={() => toggle(a.id)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{a.region}</p>
                  <ConfidenceBadge confidence={areaConfidence(a)} />
                </div>
                <h3 className="font-serif text-2xl font-bold text-brand mt-1">{a.name}</h3>
                <p className="text-sm text-muted-foreground mt-2 italic">{a.vibe}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5">
                <div className="border-l-2 border-brand/40 pl-3">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Median price</p>
                    <DataProvenance metric="medianPrice" overrideConfidence={areaConfidence(a) === "low" ? "low" : undefined} />
                  </div>
                  <p className="font-mono text-xl font-bold text-brand mt-1">{fmt(a.medianPrice)}</p>
                </div>
                <div className="border-l-2 border-success/60 pl-3">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">5yr growth</p>
                    <DataProvenance metric="growth5y" overrideConfidence={areaConfidence(a) === "low" ? "low" : undefined} />
                  </div>
                  <p className="font-mono text-xl font-bold text-success mt-1">+{a.growth5y}%</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  { icon: GraduationCap, l: "Schools", v: a.schools, key: "schools" as const },
                  { icon: Train, l: "Transport", v: a.transport, key: "transport" as const },
                  { icon: Trees, l: "Green space", v: a.green, key: "green" as const },
                ].map((m) => (
                  <div key={m.l}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <m.icon className="w-3.5 h-3.5" /> {m.l}
                        <DataProvenance metric={m.key} overrideConfidence={areaConfidence(a) === "low" ? "low" : undefined} />
                      </span>
                      <span className="font-mono font-semibold text-foreground">{m.v}/10</span>
                    </div>
                    <Bar value={m.v} />
                  </div>
                ))}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="w-3.5 h-3.5" /> Crime (per 1k)
                      <DataProvenance metric="crime" overrideConfidence={areaConfidence(a) === "low" ? "low" : undefined} />
                    </span>
                    <span className="font-mono font-semibold text-foreground">{a.crime}</span>
                  </div>
                  <Bar value={Math.max(0, 100 - a.crime)} max={100} color={a.crime > 80 ? "bg-destructive" : a.crime > 50 ? "bg-warning" : "bg-success"} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <PoundSterling className="w-3.5 h-3.5" /> Rental yield
                    <DataProvenance metric="yield" overrideConfidence={areaConfidence(a) === "low" ? "low" : undefined} />
                  </span>
                  <Badge className="bg-accent/15 text-foreground border-0 font-mono">{a.yield}%</Badge>
                </div>
              </div>

              <AreaFtbSnapshot medianPrice={a.medianPrice} region={a.region} />
              <AreaLiveLocal outcode={a.id} />

              <div className="mt-6 pt-5 border-t space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-success font-semibold mb-1.5">Pros</p>
                  <ul className="text-sm space-y-1 text-foreground">{a.pros.map((p) => <li key={p}>+ {p}</li>)}</ul>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-destructive font-semibold mb-1.5">Cons</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">{a.cons.map((c) => <li key={c}>− {c}</li>)}</ul>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Commute comparison */}
        {cards.length > 0 && (
          <Card className="p-6 shadow-soft">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Commute impact
                </p>
                <h3 className="font-serif text-xl font-bold text-brand mt-1">Travel time, scored.</h3>
                <p className="text-sm text-muted-foreground mt-1">Pick a destination and mode - we score each area on door‑to‑door travel.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="min-w-[180px]">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Destination</label>
                  <Select value={destination} onValueChange={(v) => setDestination(v as DestinationId)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DESTINATIONS.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[160px]">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Mode</label>
                  <Select value={mode} onValueChange={(v) => setMode(v as CommuteMode)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODES.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {cards
                .map((a) => ({ a, mins: a.commute[mode][destination], score: commuteScore(a.commute[mode][destination]) }))
                .sort((x, y) => y.score - x.score)
                .map(({ a, mins, score }, i) => {
                  const Icon = MODE_ICON[mode];
                  return (
                    <div key={a.id} className="grid grid-cols-12 items-center gap-3 py-2 border-b last:border-0">
                      <div className="col-span-12 sm:col-span-4 flex items-center gap-2">
                        {i === 0 && cards.length > 1 && <Badge className="bg-success/15 text-success border-0 hover:bg-success/15">Fastest</Badge>}
                        <span className="font-serif font-bold text-brand">{a.name}</span>
                      </div>
                      <div className="col-span-4 sm:col-span-2 flex items-center gap-1.5 text-sm">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-mono font-semibold">{mins != null ? `${mins} min` : "-"}</span>
                      </div>
                      <div className="col-span-6 sm:col-span-5">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${scoreBar(score)}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-right">
                        <span className={`font-mono text-sm font-bold ${scoreColor(score)}`}>{score}</span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <p className="text-xs text-muted-foreground mt-4 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Scoring: ≤25 min = 100, ≥75 min = 10. Times are indicative door‑to‑door averages including platform/access time.
            </p>
          </Card>
        )}

        {cards.length > 0 && <CommuteToPlace areas={cards} />}

        {/* School impact comparison */}
        {cards.length > 0 && (
          <Card className="p-6 shadow-soft">
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> School impact
              </p>
              <h3 className="font-serif text-xl font-bold text-brand mt-1">Schools, broken down.</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Composite of Ofsted (50%), share of Outstanding-rated schools (30%), catchment price premium (20%).
              </p>
            </div>

            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-2 py-2">Area</th>
                    <th className="px-2 py-2 text-right">Primary</th>
                    <th className="px-2 py-2 text-right">Secondary</th>
                    <th className="px-2 py-2 text-right">% Outstanding</th>
                    <th className="px-2 py-2 text-right">Catchment £</th>
                    <th className="px-2 py-2 text-right">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {cards
                    .map((a) => ({ a, score: schoolImpactScore(a.schoolBreakdown) }))
                    .sort((x, y) => y.score - x.score)
                    .map(({ a, score }, i) => (
                      <tr key={a.id} className="border-t">
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            {i === 0 && cards.length > 1 && <Award className="w-3.5 h-3.5 text-accent" />}
                            <span className="font-serif font-bold text-brand">{a.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.schoolBreakdown.topSchool}</p>
                        </td>
                        <td className="px-2 py-3 text-right font-mono">{a.schoolBreakdown.primaryOfsted.toFixed(1)}</td>
                        <td className="px-2 py-3 text-right font-mono">{a.schoolBreakdown.secondaryOfsted.toFixed(1)}</td>
                        <td className="px-2 py-3 text-right font-mono">{a.schoolBreakdown.pctOutstanding}%</td>
                        <td className="px-2 py-3 text-right font-mono text-success">+{a.schoolBreakdown.catchmentPremium}%</td>
                        <td className="px-2 py-3 text-right">
                          <span className={`font-mono text-base font-bold ${scoreColor(score)}`}>{score}</span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground mt-4 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              A high catchment premium signals strong demand from families - but you'll pay for it at the door.
            </p>
          </Card>
        )}

        {/* Investment / asset assessment */}
        {cards.length > 0 && (
          <Card className="p-6 shadow-soft">
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Asset & investment outlook
              </p>
              <h3 className="font-serif text-xl font-bold text-brand mt-1">Is this a good place to put money?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Composite of 5yr CAGR (25%), rental yield (20%), demand (15%), regen pipeline (15%), value vs region (15%), voids (10%).
              </p>
            </div>

            <div className={`grid gap-4 ${cards.length === 1 ? "md:grid-cols-1" : cards.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
              {cards
                .map((a) => ({ a, score: investmentScore(a) }))
                .sort((x, y) => y.score - x.score)
                .map(({ a, score }, idx) => {
                  const i = a.investment;
                  const cumGrowth = cumulativeGrowth(i.yearlyGrowth);
                  const annualGrowth = cagr(i.yearlyGrowth);
                  const gap = valueGap(i);
                  const max = Math.max(...i.yearlyGrowth, 1);
                  const min = Math.min(...i.yearlyGrowth, 0);
                  return (
                    <div key={a.id} className="border rounded-lg p-4 bg-card">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {idx === 0 && cards.length > 1 && <Badge className="bg-success/15 text-success border-0 hover:bg-success/15">Top pick</Badge>}
                            <span className="font-serif font-bold text-brand">{a.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Gauge className="w-3 h-3" /> Investment score</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono text-2xl font-bold ${scoreColor(score)}`}>{score}</span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">
                          <span className="flex items-center gap-1"><LineChart className="w-3 h-3" /> Last 5yr YoY</span>
                          <span className="font-mono text-success normal-case tracking-normal">+{cumGrowth}% total</span>
                        </div>
                        <div className="flex items-end gap-1 h-14">
                          {i.yearlyGrowth.map((y, k) => {
                            const range = max - min || 1;
                            const h = Math.max(8, ((y - min) / range) * 100);
                            return (
                              <div key={k} className="flex-1 flex flex-col items-center gap-0.5">
                                <div className={`w-full rounded-sm ${y >= 4 ? "bg-success" : y >= 2 ? "bg-brand" : "bg-warning"}`} style={{ height: `${h}%` }} />
                                <span className="text-[9px] text-muted-foreground font-mono">{y > 0 ? "+" : ""}{y}</span>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">CAGR <span className="font-mono text-foreground font-semibold">{annualGrowth}%</span> per year</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="border-l-2 border-brand/40 pl-2">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">£/sqft</p>
                          <p className="font-mono font-bold text-brand">£{i.pricePerSqft}</p>
                          <p className={`text-[11px] font-mono ${gap >= 0 ? "text-success" : "text-warning"}`}>
                            {gap >= 0 ? `${gap}% under` : `${Math.abs(gap)}% over`} region
                          </p>
                        </div>
                        <div className="border-l-2 border-success/60 pl-2">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Gross yield</p>
                          <p className="font-mono font-bold text-success">{a.yield}%</p>
                          <p className="text-[11px] text-muted-foreground font-mono">Voids ~{i.voidWeeks}w</p>
                        </div>
                        <div className="border-l-2 border-accent/60 pl-2">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Rental demand</p>
                          <p className="font-mono font-bold text-foreground">{i.rentalDemand}/100</p>
                        </div>
                        <div className="border-l-2 border-warning/60 pl-2">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Regen pipeline</p>
                          <p className="font-mono font-bold text-foreground">{i.capexPipeline}/100</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Affordability ratio</span>
                        <span className="font-mono font-semibold">{i.affordabilityRatio}× income</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <p className="text-xs text-muted-foreground mt-4 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Indicative figures for comparison. Past growth doesn't guarantee future returns - pair with the Risk Report before committing.
            </p>
          </Card>
        )}
        {cards.length === 0 && (
          <Card className="p-10 text-center shadow-soft">
            <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Add an area above to start comparing.</p>
          </Card>
        )}

        <MethodologySection />
      </div>
    </div>
  );
}
