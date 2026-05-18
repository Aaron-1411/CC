import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Target, TrendingUp, TrendingDown, AlertCircle, Filter, MapPin, ChevronsUpDown, Check,
} from "lucide-react";
import { fmt, fmtFull } from "@/lib/format";
import { runAvm, buildComparables, SubjectProperty } from "@/lib/avm";
import { useScenario } from "@/context/ScenarioContext";
import CitationsPanel from "@/components/CitationsPanel";
import CitationsCoveragePanel from "@/components/CitationsCoveragePanel";
import CompProvenancePanel from "@/components/CompProvenancePanel";
import { CITATIONS } from "@/lib/citations";
import Jargon from "@/components/Jargon";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import { AREAS, REGIONS, areaConfidence, type Area } from "@/data/areas";
import { ConfidenceBadge } from "@/components/DataProvenance";
import { cn } from "@/lib/utils";

/**
 * Map a selected Area into the inputs the AVM engine expects. The £/sqft
 * anchor comes from the area's investment.pricePerSqft (Land Registry +
 * ONS HPI), so any of the ~2,500 areas in the dataset works as a subject.
 */
function areaToSeed(a: Area | null) {
  if (!a) return { ppsf: 600, label: "UK average" };
  return { ppsf: a.investment.pricePerSqft, label: `${a.name} · ${a.region}` };
}

export default function Avm() {
  const { scenario, setScenario } = useScenario();
  const [areaId, setAreaId] = useState<string>("e17"); // Walthamstow as a sensible default
  const [region, setRegion] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [sqft, setSqft] = useState(720);
  const [beds, setBeds] = useState(2);
  const [yearBuilt, setYearBuilt] = useState(1932);
  const [epc, setEpc] = useState("D");
  const [tenure, setTenure] = useState<"Freehold" | "Leasehold">("Freehold");
  const [leaseYears, setLeaseYears] = useState(95);
  const [condition, setCondition] = useState(6);
  const [askingPrice, setAskingPrice] = useState(scenario.price);

  const filteredAreas = useMemo(
    () => (region === "all" ? AREAS : AREAS.filter((a) => a.region === region)),
    [region],
  );
  const area = useMemo(() => AREAS.find((a) => a.id === areaId) ?? null, [areaId]);
  const seed = areaToSeed(area);

  const subject: SubjectProperty = {
    area: seed.label, sqft, beds, yearBuilt, epc, tenure, leaseYears, conditionScore: condition,
  };
  const comps = useMemo(
    () => buildComparables(seed.ppsf, sqft, 6, seed.label),
    [seed.ppsf, sqft, seed.label],
  );
  const result = useMemo(() => runAvm(subject, comps), [subject, comps]);

  const verdict = useMemo(() => {
    if (!askingPrice) return null;
    const diff = askingPrice - result.p50;
    const pct = (diff / result.p50) * 100;
    if (pct > 5) return { label: "Above fair value", tone: "destructive" as const, note: `Asking is ${pct.toFixed(1)}% above the central valuation.` };
    if (pct < -5) return { label: "Below fair value", tone: "success" as const, note: `Asking is ${Math.abs(pct).toFixed(1)}% below the central valuation - strong opportunity.` };
    return { label: "Fairly priced", tone: "brand" as const, note: `Within ±5% of the central valuation.` };
  }, [askingPrice, result.p50]);

  const useAsScenario = () => setScenario({ price: result.p50 });

  return (
    <>
      <PageHeader
        eyebrow="Tool · Property AVM"
        title={<>Address-level <Jargon term="AVM" glossaryKey="AVM">valuation</Jargon> with confidence interval</>}
        documentTitle="AVM — automated valuation"
        description="Comparable-driven automated valuation model (P10 / P50 / P90) anchored to Land Registry £/sqft for any UK area."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 p-6 h-fit lg:sticky lg:top-20 shadow-soft space-y-5">
          <h3 className="font-serif text-lg font-bold text-brand">Subject property</h3>

          {/* Region narrow-down + searchable area picker over the full dataset */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground block flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Region
            </Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All UK regions</SelectItem>
                {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground block">
              Area · {filteredAreas.length.toLocaleString()} available
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline" role="combobox"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate text-left">
                    {area ? `${area.name}` : "Pick an area…"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <Command shouldFilter>
                  <CommandInput placeholder="Search 2,500+ UK areas, postcodes…" />
                  <CommandList>
                    <CommandEmpty>No areas match.</CommandEmpty>
                    <CommandGroup>
                      {filteredAreas.slice(0, 200).map((a) => (
                        <CommandItem
                          key={a.id}
                          value={`${a.name} ${a.region} ${a.id}`}
                          onSelect={() => { setAreaId(a.id); setOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-3.5 w-3.5", areaId === a.id ? "opacity-100" : "opacity-0")} />
                          <span className="flex-1 truncate">{a.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">{a.region.split(" ")[0]}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {area && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="font-mono">£{seed.ppsf}/sqft anchor</Badge>
                <ConfidenceBadge confidence={areaConfidence(area)} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Sqft</Label><NumberInput value={sqft} onChange={setSqft} className="font-mono" /></div>
            <div><Label className="text-xs">Beds</Label><NumberInput value={beds} onChange={setBeds} className="font-mono" /></div>
            <div><Label className="text-xs">Year built</Label><NumberInput value={yearBuilt} onChange={setYearBuilt} className="font-mono" /></div>
            <div>
              <Label className="text-xs">EPC</Label>
              <Select value={epc} onValueChange={setEpc}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["A","B","C","D","E","F","G"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Tenure</Label>
            <Select value={tenure} onValueChange={(v: "Freehold" | "Leasehold") => setTenure(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Freehold">Freehold</SelectItem>
                <SelectItem value="Leasehold">Leasehold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {tenure === "Leasehold" && (
            <div><Label className="text-xs">Lease years remaining</Label><NumberInput value={leaseYears} onChange={setLeaseYears} className="font-mono" /></div>
          )}

          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-xs">Condition vs area</Label>
              <span className="font-mono text-sm font-semibold text-brand">{condition}/10</span>
            </div>
            <Slider value={[condition]} min={0} max={10} step={1} onValueChange={(v) => setCondition(v[0])} />
          </div>

          <div>
            <Label className="text-xs">Asking price (optional)</Label>
            <NumberInput value={askingPrice} onChange={setAskingPrice} className="font-mono" />
          </div>
        </Card>

        <div className="lg:col-span-8 space-y-6">
          <Card className="p-7 bg-gradient-brand text-brand-foreground shadow-card border-0">
            <div className="flex items-baseline justify-between flex-wrap gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] opacity-75">Central valuation (P50)</p>
                <p className="font-serif text-5xl font-bold mt-2">{fmtFull(result.p50)}</p>
                <p className="text-sm opacity-80 mt-1 font-mono">£{result.pricePerSqft}/sqft · confidence: {result.confidence}</p>
                <div className="mt-3">
                  <ConfidenceMeter
                    checks={[
                      { id: "comps", label: `Comparables (${result.comps.length} accepted)`, complete: result.comps.length >= result.minCompsUsed, hint: `Need ≥ ${result.minCompsUsed}` },
                      { id: "ask", label: "Asking price provided", complete: askingPrice > 0, hint: "Add to compare vs central valuation" },
                      { id: "tenure", label: "Tenure & lease length", complete: tenure === "Freehold" || leaseYears > 0 },
                      { id: "epc", label: "EPC band", complete: !!epc },
                      { id: "size", label: "Floor area (sqft)", complete: sqft > 0 },
                      { id: "area", label: "Subject area selected", complete: !!area },
                    ]}
                    className="text-brand-foreground/90 [&_*]:!text-brand-foreground/90"
                  />
                </div>
              </div>
              <button onClick={useAsScenario} className="bg-brand-foreground/10 hover:bg-brand-foreground/20 text-brand-foreground border border-brand-foreground/30 rounded-md px-3 py-1.5 text-xs uppercase tracking-widest">
                Use as scenario price
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-70">Low (P10)</p>
                <p className="font-mono text-xl font-semibold mt-1">{fmt(result.p10)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-70">Central (P50)</p>
                <p className="font-mono text-xl font-semibold mt-1">{fmt(result.p50)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-70">High (P90)</p>
                <p className="font-mono text-xl font-semibold mt-1">{fmt(result.p90)}</p>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-brand-foreground/15 relative overflow-hidden">
              <div className="absolute inset-y-0 bg-brand-foreground/40" style={{ left: "10%", right: "10%" }} />
              <div className="absolute inset-y-0 w-0.5 bg-brand-foreground" style={{ left: "50%" }} />
              {askingPrice > 0 && (
                <div
                  className="absolute -top-1 h-4 w-0.5 bg-accent"
                  style={{ left: `${Math.max(0, Math.min(100, ((askingPrice - result.p10) / (result.p90 - result.p10)) * 100))}%` }}
                  title="Asking price"
                />
              )}
            </div>
          </Card>

          {verdict && (
            <Card className={`p-5 flex items-start gap-3 border-0 ${
              verdict.tone === "destructive" ? "bg-destructive/10" :
              verdict.tone === "success" ? "bg-success/10" : "bg-brand-muted"
            }`}>
              {verdict.tone === "destructive" ? <TrendingUp className="w-5 h-5 text-destructive shrink-0 mt-0.5" /> :
                verdict.tone === "success" ? <TrendingDown className="w-5 h-5 text-success shrink-0 mt-0.5" /> :
                <Target className="w-5 h-5 text-brand shrink-0 mt-0.5" />}
              <div>
                <p className="font-serif font-bold text-brand">{verdict.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{verdict.note}</p>
              </div>
            </Card>
          )}

          <Card className="p-6 shadow-soft">
            <h4 className="font-serif font-bold text-brand mb-4">Adjustment trail</h4>
            {result.adjustments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No adjustments - comparables are very close to subject.</p>
            ) : (
              <ul className="space-y-3">
                {result.adjustments.map((a) => (
                  <li key={a.label} className="flex items-start justify-between gap-4 border-b last:border-0 pb-3 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.label}</p>
                      <p className="text-xs text-muted-foreground">{a.note}</p>
                    </div>
                    <span className={`font-mono font-semibold text-sm ${a.delta > 0 ? "text-success" : "text-destructive"}`}>
                      {a.delta > 0 ? "+" : ""}{(a.delta * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand" />
                <h4 className="font-serif font-bold text-brand">Similarity criteria</h4>
              </div>
              <Badge className="bg-brand-muted text-brand border-0">
                {result.comps.length} accepted · floor {result.minCompsUsed}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Comparables must satisfy <em>every</em> rule below to be included in the weighted £/sqft.
              Confidence is downgraded automatically if fewer than {result.minCompsUsed} comps pass.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              {[
                ["Min comps used", `${result.minCompsUsed}`],
                ["Max distance", `${result.similarity.maxDistanceMiles} mi from subject`],
                ["Max age of sale", `${result.similarity.maxAgeMonths} months`],
                ["Sqft tolerance", `±${Math.round(result.similarity.sqftTolerancePct * 100)}%`],
                ["Beds tolerance", `±${result.similarity.bedsTolerance}`],
                ["Tenure", result.similarity.tenureMatch.join(" / ")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b last:border-0 py-1.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono font-semibold text-foreground">{v}</span>
                </div>
              ))}
            </div>
            {result.comps.length < result.minCompsUsed && (
              <p className="mt-3 text-[11px] text-warning flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Only {result.comps.length} comp(s) passed - confidence capped at low/medium.
              </p>
            )}
          </Card>

          <CompProvenancePanel
            subject={subject}
            accepted={result.comps}
            rejected={result.rejectedComps}
            criteria={result.similarity}
          />

          {(() => {
            const avmTraces = [
              {
                trace: {
                  value: result.pricePerSqft,
                  label: "Comparable £/sqft anchor",
                  inputs: [
                    { label: "Accepted comps", raw: result.comps.length, weight: 1 },
                    { label: "Subject sqft", raw: sqft },
                    { label: "Median comp £/sqft", raw: result.pricePerSqft },
                    { label: "Area anchor £/sqft", raw: seed.ppsf },
                  ],
                  formula: "Recency- & distance-weighted median(comp soldPrice / comp sqft)",
                  source: "HM Land Registry Price Paid · £/sqft",
                },
                location: "AVM · £/sqft anchor",
              },
              ...result.adjustments.map((a) => ({
                trace: {
                  value: +(a.delta * 100).toFixed(2),
                  label: `Adjustment · ${a.label}`,
                  inputs: [{ label: a.label, raw: `${(a.delta * 100).toFixed(1)}%` }],
                  formula: `subject vs comp delta → ${(a.delta * 100).toFixed(1)}%`,
                  source: /epc/i.test(a.label)
                    ? "EPC Open Data adjustment"
                    : /lease|tenure/i.test(a.label)
                    ? "HM Land Registry tenure mix"
                    : /age|year/i.test(a.label)
                    ? "EPC construction_age_band"
                    : "ONS HPI regional drift",
                },
                location: `AVM · ${a.label}`,
              })),
            ];
            return (
              <>
                <CitationsPanel
                  citations={[CITATIONS.landRegistryPPD, CITATIONS.epcOpen, CITATIONS.onsHPI, CITATIONS.onsPRMS]}
                  traces={avmTraces}
                  title="Live-data citations · AVM"
                  description="Click any dataset to drill into the AVM inputs and adjustments it feeds."
                />
                <CitationsCoveragePanel traces={avmTraces} />
              </>
            );
          })()}

          <Card className="p-5 bg-accent/10 border-accent/30 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">
              The AVM is a research aid. It does not replace a RICS valuation or a mortgage lender's surveyor.
              £/sqft anchors are derived from HM Land Registry Price Paid and ONS HPI per local authority; the
              {" "}{areaConfidence(area ?? AREAS[0]) === "low" ? "modelled estimate" : "verified data"} for this
              area is reflected in the confidence badge above.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
