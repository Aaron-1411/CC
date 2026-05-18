import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Sparkles, Database, Loader2, MapPin, Info, TrendingUp, Landmark, Share2, FileDown, MessageCircleQuestion, History } from "lucide-react";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import Jargon from "@/components/Jargon";
import FreshnessPill from "@/components/FreshnessPill";
import DataSourcesPanel from "@/components/DataSourcesPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { runVerdict, type VerdictInput, type Light } from "@/lib/verdict";
import { addProperty } from "@/lib/shortlist";
import { parseListingUrl, fetchVerdictNarrative, ListingParseError, SUPPORTED_LISTING_LABEL } from "@/lib/listing";
import { AlertCircle } from "lucide-react";
import { useLiveComparables } from "@/hooks/use-live-comparables";
import { downloadVerdictPdf, shareVerdict } from "@/lib/verdictExport";
import { fetchAgentQuestions } from "@/lib/agentQuestions";
import { usePostcodeLookup } from "@/hooks/use-postcode-lookup";
import { useHpi } from "@/hooks/use-hpi";
import { useBoeRates } from "@/hooks/use-boe-rates";
import { useCrime } from "@/hooks/use-crime";
import { useTransport } from "@/hooks/use-transport";
import { useEpc } from "@/hooks/use-epc";
import type { Region } from "@/lib/taxes";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Step =
  | "intro" | "postcode" | "price" | "size"
  | "income" | "deposit" | "household"
  | "priorities" | "verdict";

const ORDER: Step[] = [
  "intro", "postcode", "price", "size",
  "income", "deposit", "household", "priorities", "verdict",
];

const PRIORITY_OPTIONS = [
  { key: "commute", label: "Easy commute", emoji: "🚆" },
  { key: "schools", label: "Good schools", emoji: "🎓" },
  { key: "greenSpace", label: "Green space nearby", emoji: "🌳" },
  { key: "safety", label: "Feels safe", emoji: "🛡️" },
  { key: "nightlife", label: "Lively & social", emoji: "🍷" },
  { key: "spaceInside", label: "Roomy inside", emoji: "🛋️" },
] as const;

const LIGHT_STYLE: Record<Light, { bg: string; ring: string; text: string; icon: typeof CheckCircle2; label: string }> = {
  green:  { bg: "bg-success/10",     ring: "ring-success/30",     text: "text-success",     icon: CheckCircle2, label: "Looks good" },
  amber:  { bg: "bg-warning/10",     ring: "ring-warning/30",     text: "text-warning",     icon: AlertTriangle, label: "Worth a closer look" },
  red:    { bg: "bg-destructive/10", ring: "ring-destructive/30", text: "text-destructive", icon: XCircle,       label: "Probably not" },
};

export default function Decide() {
  const [params, setParams] = useSearchParams();
  // Hydrate from URL on first render so verdicts are shareable / resumable.
  const [step, setStep] = useState<Step>(() => {
    const s = params.get("step") as Step | null;
    return s && ORDER.includes(s) ? s : "intro";
  });
  const [postcode, setPostcode] = useState(() => params.get("pc") ?? "");
  const [askingPrice, setAskingPrice] = useState<number>(() => Number(params.get("price")) || 0);
  const [beds, setBeds] = useState<number>(() => Number(params.get("beds")) || 2);
  const [sqft, setSqft] = useState<number>(() => Number(params.get("sqft")) || 700);
  const [income, setIncome] = useState<number>(() => Number(params.get("income")) || 0);
  const [deposit, setDeposit] = useState<number>(() => Number(params.get("dep")) || 0);
  const [household, setHousehold] = useState<VerdictInput["household"]>(
    () => (params.get("hh") as VerdictInput["household"]) || "couple",
  );
  const [priorities, setPriorities] = useState<string[]>(
    () => params.get("pri")?.split(",").filter(Boolean) ?? [],
  );
  const [listingUrl, setListingUrl] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importError, setImportError] = useState<{ message: string; hint: string } | null>(null);

  // Persist key state to URL so users can share or come back to the same verdict.
  useEffect(() => {
    const next = new URLSearchParams();
    if (step !== "intro") next.set("step", step);
    if (postcode) next.set("pc", postcode);
    if (askingPrice) next.set("price", String(askingPrice));
    if (beds) next.set("beds", String(beds));
    if (sqft && sqft !== 700) next.set("sqft", String(sqft));
    if (income) next.set("income", String(income));
    if (deposit) next.set("dep", String(deposit));
    if (household && household !== "couple") next.set("hh", household);
    if (priorities.length) next.set("pri", priorities.join(","));
    setParams(next, { replace: true });
  }, [step, postcode, askingPrice, beds, sqft, income, deposit, household, priorities, setParams]);


  const idx = ORDER.indexOf(step);
  const progress = ((idx) / (ORDER.length - 1)) * 100;

  // Resolve the postcode → LAD/region via Postcodes.io as soon as it's valid.
  // Pull live HM Land Registry comparables in parallel.
  const isPostcode = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(postcode.trim());
  const postcodeInfo = usePostcodeLookup(isPostcode ? postcode.trim() : null);
  const liveComps = useLiveComparables(
    isPostcode ? postcode.trim() : null,
    sqft,
    beds,
  );
  // Real ONS HPI history for the resolved LAD → Monte Carlo expected return.
  const hpi = useHpi(postcodeInfo.data?.lad);
  // BoE base rate → cash benchmark + indicative mortgage rate floor.
  const boe = useBoeRates();
  // Live lifestyle overlays (free): police.uk crime + OSM Overpass transport nodes.
  const crime = useCrime(postcodeInfo.data?.latitude, postcodeInfo.data?.longitude);
  const transport = useTransport(postcodeInfo.data?.latitude, postcodeInfo.data?.longitude);
  // EPC Open Data - real floor area + energy band for the postcode.
  const epc = useEpc(isPostcode ? postcode.trim() : null);

  // Auto-fill sqft from EPC median once, when the user reaches the size step
  // and hasn't manually changed it. Avoids overwriting deliberate edits.
  const sqftAutofilledRef = useRef(false);
  useEffect(() => {
    const median = epc.data?.stats.medianSqft;
    if (!median || sqftAutofilledRef.current) return;
    if (sqft === 700) {
      setSqft(median);
      sqftAutofilledRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epc.data?.stats.medianSqft]);

  // Map resolved country → tax region (Scotland uses LBTT, Wales LTT).
  const taxRegion: Region = useMemo(() => {
    const c = postcodeInfo.data?.country;
    if (c === "Scotland") return "scotland";
    if (c === "Wales") return "wales";
    return "england";
  }, [postcodeInfo.data?.country]);

  const verdict = useMemo(() => {
    if (step !== "verdict") return null;
    return runVerdict({
      postcodeOrArea: postcode || "London",
      askingPrice, beds, sqft,
      household,
      grossAnnualIncome: income,
      depositCash: deposit,
      region: taxRegion,
      isFTB: true,
      prioritiesTopThree: priorities as VerdictInput["prioritiesTopThree"],
      liveComparables: liveComps.data?.comparables,
      resolvedRegion: postcodeInfo.data?.region,
      resolvedLad: postcodeInfo.data?.lad,
      historicStats: hpi.data?.stats ?? null,
      cashRatePct: boe.data?.latest ?? 4,
      holdYears: 10,
      liveSafetyScore: crime.data?.score ?? null,
      liveTransportScore: transport.data?.score ?? null,
      liveCrimePerYear: crime.data?.perYear ?? null,
      liveTransportNodes: transport.data?.total ?? null,
      epcMedianSqft: epc.data?.stats.medianSqft ?? null,
      epcModeBand: epc.data?.stats.modeBand ?? null,
      epcSampleSize: epc.data?.stats.sampleSize ?? null,
    });
  }, [step, postcode, askingPrice, beds, sqft, income, deposit, household, priorities, liveComps.data, postcodeInfo.data, taxRegion, hpi.data, boe.data, crime.data, transport.data, epc.data]);

  const goNext = () => setStep(ORDER[Math.min(ORDER.length - 1, idx + 1)]);
  const goBack = () => setStep(ORDER[Math.max(0, idx - 1)]);

  const canAdvance = () => {
    switch (step) {
      case "postcode": return postcode.trim().length >= 2;
      case "price":    return askingPrice > 10_000;
      case "size":     return sqft >= 200 && beds >= 1;
      case "income":   return income > 5_000;
      case "deposit":  return deposit >= 0;
      case "household": return !!household;
      case "priorities": return priorities.length === 3;
      default: return true;
    }
  };

  const togglePriority = (k: string) => {
    setPriorities((curr) => {
      if (curr.includes(k)) return curr.filter((x) => x !== k);
      if (curr.length >= 3) return curr;
      return [...curr, k];
    });
  };

  const saveToShortlist = () => {
    if (!verdict) return;
    addProperty({
      source: "manual",
      address: postcode || "Untitled property",
      price: askingPrice,
      beds, sqft,
      tags: [verdict.overall === "green" ? "Worth offering" : verdict.overall === "amber" ? "Maybe" : "Pass"],
      notes: verdict.oneLiner,
    });
    toast({ title: "Saved to shortlist", description: "Find it on the Shortlist page." });
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Top progress bar */}
      {step !== "intro" && step !== "verdict" && (
        <div className="px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mb-2">
              <span>Question {idx} of {ORDER.length - 2}</span>
              <button onClick={() => setStep("intro")} className="hover:text-foreground transition">Start over</button>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className={cn(
        "flex-1 px-4 sm:px-6 py-6 sm:py-10",
        step === "intro" ? "flex items-center justify-center" : "flex items-start sm:items-center justify-center",
        step !== "intro" && step !== "verdict" && "pb-28 sm:pb-10"
      )}>
        <div className="w-full max-w-xl">
          {step === "intro" && (
            <div className="text-center space-y-6 animate-in fade-in duration-500">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-muted text-brand text-xs uppercase tracking-widest font-medium">
                <Sparkles className="h-3 w-3" /> Quick verdict
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight">
                Is this house a good idea?
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Paste a Rightmove or Zoopla link and we'll fill in the details for you - or answer a few quick questions.
              </p>

              <div className="max-w-md mx-auto space-y-2 text-left">
                <Label htmlFor="listing-url" className="text-xs uppercase tracking-widest text-muted-foreground">Listing link (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="listing-url"
                    value={listingUrl}
                    onChange={(e) => { setListingUrl(e.target.value); if (importError) setImportError(null); }}
                    placeholder="https://www.rightmove.co.uk/properties/..."
                    className="h-12"
                    aria-invalid={importError ? true : undefined}
                    aria-describedby={importError ? "listing-url-error" : "listing-url-hint"}
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!listingUrl.trim()) return;
                      setParsing(true);
                      setImportError(null);
                      try {
                        const r = await parseListingUrl(listingUrl.trim());
                        if (r.postcode) setPostcode(r.postcode);
                        if (r.price) setAskingPrice(r.price);
                        if (r.beds) setBeds(r.beds);
                        if (r.sqft) setSqft(r.sqft);
                        toast({ title: "Listing imported", description: "Check the values and continue." });
                        setStep("price");
                      } catch (e) {
                        const err = e instanceof ListingParseError
                          ? { message: e.message, hint: e.hint }
                          : { message: "Couldn't read that listing", hint: "Try again, or paste the details manually." };
                        setImportError(err);
                      } finally {
                        setParsing(false);
                      }
                    }}
                    disabled={parsing || !listingUrl.trim()}
                    variant="outline"
                    className="h-12"
                  >
                    {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import"}
                  </Button>
                </div>
                {importError ? (
                  <div
                    id="listing-url-error"
                    role="alert"
                    className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-left"
                  >
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-medium text-destructive">{importError.message}</p>
                      <p className="text-muted-foreground leading-relaxed">{importError.hint}</p>
                      <button
                        type="button"
                        onClick={() => { setImportError(null); setStep("postcode"); }}
                        className="font-medium text-brand hover:underline"
                      >
                        Enter details manually instead →
                      </button>
                    </div>
                  </div>
                ) : (
                  <p id="listing-url-hint" className="text-xs text-muted-foreground">
                    Works with {SUPPORTED_LISTING_LABEL}.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                <span className="h-px w-12 bg-border" /> or <span className="h-px w-12 bg-border" />
              </div>

              <Button size="lg" onClick={goNext}>
                Answer 8 quick questions <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground">Takes about a minute · No sign-up needed</p>
            </div>
          )}

          {step === "postcode" && (
            <QuestionCard
              question="Where is the property?"
              hint="A postcode or area name works - e.g. SW9 or 'Wood Green'."
            >
              <Input autoFocus value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SW9 8DE" className="h-14 text-lg" />
              {isPostcode && (
                <div className="mt-3 space-y-1.5 text-xs">
                  {/* Postcodes.io area resolution */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {postcodeInfo.isFetching ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Looking up area…</>
                    ) : postcodeInfo.data ? (
                      <><MapPin className="h-3 w-3 text-brand" /> {postcodeInfo.data.lad} · {postcodeInfo.data.region} · {postcodeInfo.data.country}</>
                    ) : postcodeInfo.isError ? (
                      <span className="text-warning">Postcode not recognised - we'll use the area name.</span>
                    ) : null}
                  </div>
                  {/* HM Land Registry comparables */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {liveComps.isFetching ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Fetching real sold prices from HM Land Registry…</>
                    ) : liveComps.data ? (
                      <><Database className="h-3 w-3 text-success" /> Found {liveComps.data.count} sold prices in {liveComps.data.sector} {liveComps.data.cached && "(cached)"}</>
                    ) : liveComps.isError ? (
                      <span className="text-warning">Couldn't reach HM Land Registry - we'll use modelled prices.</span>
                    ) : null}
                  </div>
                  {/* Police.uk crime + OSM transport */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {crime.isFetching ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Pulling 12-month crime stats from data.police.uk…</>
                    ) : crime.data ? (
                      <><Database className="h-3 w-3 text-success" /> {crime.data.perYear} crimes in last 12 months · safety {crime.data.score}/100</>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {transport.isFetching ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Counting nearby transport nodes (OpenStreetMap)…</>
                    ) : transport.data ? (
                      <><Database className="h-3 w-3 text-success" /> {transport.data.total} stops within 800m · transport {transport.data.score}/100</>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {epc.isFetching ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Loading EPC certificates (real floor areas)…</>
                    ) : epc.data ? (
                      <><Database className="h-3 w-3 text-success" /> {epc.data.stats.sampleSize} EPCs · median {epc.data.stats.medianSqft ?? "?"} sqft · band {epc.data.stats.modeBand ?? "?"}</>
                    ) : epc.isError ? (
                      <span className="text-warning">EPC lookup failed - we'll use your estimate.</span>
                    ) : null}
                  </div>
                </div>
              )}
            </QuestionCard>
          )}

          {step === "price" && (
            <QuestionCard
              question="What's the asking price?"
              hint="The number on Rightmove or in the agent's window."
            >
              <CurrencyInput value={askingPrice} onChange={setAskingPrice} placeholder="£450,000" />
            </QuestionCard>
          )}

          {step === "size" && (
            <QuestionCard
              question="How big is it?"
              hint={
                epc.data?.stats.medianSqft
                  ? `We pre-filled the floor area from real EPC certificates near this postcode (median ${epc.data.stats.medianSqft} sqft across ${epc.data.stats.sampleSize} homes). Adjust if you know the exact figure.`
                  : "Floor area is on the EPC certificate or floor plan. If you don't know, estimate ~350 sqft per bedroom."
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Bedrooms</Label>
                  <NumberInput min={1} max={10} value={beds} onChange={setBeds} className="h-14 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Floor area (sqft)</Label>
                  <NumberInput min={200} value={sqft} onChange={(n) => { sqftAutofilledRef.current = true; setSqft(n); }} className="h-14 text-lg" />
                  {epc.data?.stats.medianSqft && (
                    <p className="text-[11px] text-muted-foreground">
                      EPC median for this postcode: {epc.data.stats.medianSqft} sqft · band {epc.data.stats.modeBand ?? "?"}
                    </p>
                  )}
                </div>
              </div>
            </QuestionCard>
          )}

          {step === "income" && (
            <QuestionCard
              question="What's your household income?"
              hint="Combined gross annual salary - before tax. We use this to check what lenders will offer."
            >
              <CurrencyInput value={income} onChange={setIncome} placeholder="£60,000" />
            </QuestionCard>
          )}

          {step === "deposit" && (
            <QuestionCard
              question="How much have you saved?"
              hint="Cash that's available to put down - including any LISA, gifts and rounded-up savings."
            >
              <CurrencyInput value={deposit} onChange={setDeposit} placeholder="£35,000" />
            </QuestionCard>
          )}

          {step === "household" && (
            <QuestionCard question="Who's buying?" hint="This shapes which lifestyle factors we lean on.">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(["single", "couple", "family"] as const).map((h) => (
                  <button
                    key={h}
                    onClick={() => setHousehold(h)}
                    className={cn(
                      "h-24 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 capitalize",
                      household === h
                        ? "border-brand bg-brand-muted text-brand"
                        : "border-border hover:border-brand/40"
                    )}
                  >
                    <span className="text-2xl">{h === "single" ? "👤" : h === "couple" ? "👥" : "👨‍👩‍👧"}</span>
                    <span className="text-sm font-medium">{h}</span>
                  </button>
                ))}
              </div>
            </QuestionCard>
          )}

          {step === "priorities" && (
            <QuestionCard
              question="Pick the 3 things that matter most to you."
              hint={`Selected ${priorities.length} of 3.`}
            >
              <div className="grid grid-cols-2 gap-3">
                {PRIORITY_OPTIONS.map((opt) => {
                  const active = priorities.includes(opt.key);
                  const order = priorities.indexOf(opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() => togglePriority(opt.key)}
                      className={cn(
                        "relative h-20 rounded-lg border-2 transition-all flex items-center gap-3 px-4 text-left",
                        active
                          ? "border-brand bg-brand-muted text-brand"
                          : "border-border hover:border-brand/40"
                      )}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <span className="text-sm font-medium">{opt.label}</span>
                      {active && (
                        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-brand text-brand-foreground text-xs font-bold flex items-center justify-center">
                          {order + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </QuestionCard>
          )}

          {step === "verdict" && verdict && (
            <VerdictView verdict={verdict} onSave={saveToShortlist} onRestart={() => setStep("intro")} postcode={postcode} />
          )}

          {/* Nav - sticky bottom on mobile so it never falls below the fold */}
          {step !== "intro" && step !== "verdict" && (
            <div className="fixed sm:static bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t sm:border-0 sm:bg-transparent px-4 sm:px-0 py-3 sm:py-0 sm:mt-8 flex items-center justify-between gap-3 safe-area-bottom">
              <Button variant="ghost" onClick={goBack} size="lg" className="sm:size-default">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={goNext} disabled={!canAdvance()} size="lg" className="flex-1 sm:flex-none">
                {step === "priorities" ? "See my verdict" : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ question, hint, children }: { question: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl leading-tight">{question}</h2>
        {hint && <p className="text-sm sm:text-base text-muted-foreground">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function CurrencyInput({ value, onChange, placeholder }: { value: number; onChange: (n: number) => void; placeholder: string }) {
  const display = value ? value.toLocaleString() : "";
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground pointer-events-none">£</span>
      <Input
        autoFocus
        inputMode="numeric"
        value={display}
        onChange={(e) => onChange(+e.target.value.replace(/[^\d]/g, "") || 0)}
        placeholder={placeholder.replace("£", "")}
        className="h-14 text-lg pl-9"
      />
    </div>
  );
}

function VerdictView({ verdict, onSave, onRestart, postcode }: { verdict: ReturnType<typeof runVerdict>; onSave: () => void; onRestart: () => void; postcode: string }) {
  const style = LIGHT_STYLE[verdict.overall];
  const Icon = style.icon;
  const [narrative, setNarrative] = useState<string>("");
  const [narrativeLoading, setNarrativeLoading] = useState(true);
  const [agentQs, setAgentQs] = useState<string[] | null>(null);
  const [agentQsLoading, setAgentQsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setNarrativeLoading(true);
    fetchVerdictNarrative({
      overall: verdict.overall,
      oneLiner: verdict.oneLiner,
      monthlyPayment: verdict.monthlyPayment,
      upfrontCash: verdict.upfrontCash,
      avmP50: verdict.avmP50,
      factors: verdict.scores.map((s) => ({ label: s.label, light: s.light, headline: s.headline })),
    })
      .then((t) => { if (!cancelled) setNarrative(t); })
      .catch(() => { if (!cancelled) setNarrative(""); })
      .finally(() => { if (!cancelled) setNarrativeLoading(false); });
    return () => { cancelled = true; };
  }, [verdict]);

  const loadAgentQs = async () => {
    setAgentQsLoading(true);
    try {
      const flags = verdict.scores.filter((s) => s.light !== "green").map((s) => `${s.label}: ${s.headline}`);
      const qs = await fetchAgentQuestions({
        postcode,
        askingPrice: (verdict as any).askingPrice,
        flags,
      });
      setAgentQs(qs.length ? qs : ["Sign in to generate tailored questions."]);
    } catch (e) {
      setAgentQs(["Couldn't load questions right now. Try again later."]);
    } finally {
      setAgentQsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Headline verdict */}
      <Card className={cn("border-2 ring-4", style.ring, style.bg.replace("/10", "/5"))}>
        <CardContent className="p-5 sm:p-8 text-center space-y-4">
          <Icon className={cn("h-12 w-12 sm:h-16 sm:w-16 mx-auto", style.text)} />
          <div className={cn("text-xs uppercase tracking-widest font-medium", style.text)}>
            {style.label}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl leading-tight">{verdict.oneLiner}</h2>
          {(narrativeLoading || narrative) && (
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {narrativeLoading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing your summary…</span> : narrative}
            </p>
          )}
          <div className="flex justify-center gap-2 flex-wrap">
            {verdict.priceSource === "live" ? (
              <Badge variant="outline" className="gap-1.5 border-success/40 text-success text-[11px]">
                <Database className="h-3 w-3" />
                Live HMLR · {verdict.compsUsed} comps
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 text-muted-foreground text-[11px]">
                Modelled · enter postcode for live data
              </Badge>
            )}
            <FreshnessPill source="HM Land Registry" updatedAt={new Date()} />
          </div>
          <div className="max-w-xs mx-auto pt-2">
            <ConfidenceMeter
              checks={[
                { id: "postcode", label: "Postcode resolved", complete: !!postcode, hint: "Enter a UK postcode for live area data." },
                { id: "price", label: "Asking price provided", complete: !!(verdict as any).askingPrice },
                { id: "comps", label: "Live sold-price comparables", complete: verdict.priceSource === "live", hint: "Postcode unlocks HM Land Registry comps." },
                ...verdict.scores.map((s) => ({ id: s.key, label: s.label, complete: s.light !== "red" })),
              ]}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 max-w-md mx-auto text-left">
            <Stat label="Mid value" value={`£${(verdict.avmP50 / 1000).toFixed(0)}k`} />
            <Stat label="Monthly" value={`£${verdict.monthlyPayment.toLocaleString()}`} />
            <Stat label="Upfront" value={`£${(verdict.upfrontCash / 1000).toFixed(1)}k`} />
          </div>
        </CardContent>
      </Card>

      {/* "X of 3 factors" breakdown */}
      <FactorsPanel verdict={verdict} />

      {/* What data we used — sources + last-updated, drill into verdict impact */}
      <DataSourcesPanel />

      {/* Expected return - Monte Carlo on real ONS HPI */}
      <ExpectedReturnPanel verdict={verdict} />

      {/* Three sub-scores */}
      <div className="space-y-3">
        {verdict.scores.map((s) => {
          const sStyle = LIGHT_STYLE[s.light];
          const SIcon = sStyle.icon;
          return (
            <Card key={s.key} className="overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", sStyle.bg)}>
                    <SIcon className={cn("h-5 w-5", sStyle.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{s.label}</div>
                    <div className="font-medium">{s.headline}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground pl-13 leading-relaxed">{s.detail}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {s.metrics.map((m) => (
                    <div key={m.label} className="rounded-md bg-muted/50 p-2">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
                      <div className="font-mono font-medium text-sm">{m.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 sm:justify-center pt-2">
        <Button onClick={onSave} size="lg" className="w-full sm:w-auto">Save to shortlist</Button>
        <Button
          onClick={() => downloadVerdictPdf({
            postcode,
            askingPrice: (verdict as any).askingPrice,
            monthlyPayment: verdict.monthlyPayment,
            upfrontCash: verdict.upfrontCash,
            avmP50: verdict.avmP50,
            overall: verdict.overall,
            oneLiner: verdict.oneLiner,
            narrative,
            factors: verdict.scores.map((s) => ({ label: s.label, light: s.light, headline: s.headline })),
          })}
          variant="outline" size="lg" className="w-full sm:w-auto"
        >
          <FileDown className="h-4 w-4 mr-1.5" /> Download PDF
        </Button>
        <Button onClick={shareVerdict} variant="outline" size="lg" className="w-full sm:w-auto">
          <Share2 className="h-4 w-4 mr-1.5" /> Share link
        </Button>
        <SnapshotButton verdict={verdict} postcode={postcode} />
        <ReceiptButton verdict={verdict} postcode={postcode} />
        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto"><Link to="/avm">Open full breakdown</Link></Button>
        <Button onClick={onRestart} variant="ghost" size="lg" className="w-full sm:w-auto">Check another</Button>
      </div>

      {/* AI agent questions */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="h-4 w-4 text-brand" />
              <h3 className="font-serif font-bold text-brand">Questions to ask the agent</h3>
            </div>
            {!agentQs && (
              <Button size="sm" variant="outline" onClick={loadAgentQs} disabled={agentQsLoading}>
                {agentQsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Generate"}
              </Button>
            )}
          </div>
          {agentQs ? (
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-foreground">
              {agentQs.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          ) : (
            <p className="text-xs text-muted-foreground">Tailored to this property's flagged risks. Sign-in required.</p>
          )}
        </CardContent>
      </Card>

      {/* Data sources & caveats */}
      <SourcesPanel verdict={verdict} />
    </div>
  );
}

function FactorsPanel({ verdict }: { verdict: ReturnType<typeof runVerdict> }) {
  const total = verdict.scores.length;
  const greens = verdict.scores.filter((s) => s.light === "green").length;
  const ambers = verdict.scores.filter((s) => s.light === "amber").length;
  const reds = verdict.scores.filter((s) => s.light === "red").length;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              How we got to this
            </div>
            <div className="font-serif text-2xl mt-1">
              {greens} of {total} factors look good
              {ambers > 0 && <span className="text-warning"> · {ambers} mixed</span>}
              {reds > 0 && <span className="text-destructive"> · {reds} concerning</span>}
            </div>
          </div>
        </div>

        {/* Segmented bar */}
        <div className="flex h-2 rounded-full overflow-hidden bg-muted">
          {verdict.scores.map((s) => {
            const c =
              s.light === "green" ? "bg-success"
              : s.light === "amber" ? "bg-warning"
              : "bg-destructive";
            return <div key={s.key} className={cn("flex-1", c)} title={`${s.label}: ${s.light}`} />;
          })}
        </div>

        {/* Compact factor list */}
        <ul className="space-y-2">
          {verdict.scores.map((s) => {
            const sStyle = LIGHT_STYLE[s.light];
            const SIcon = sStyle.icon;
            return (
              <li key={s.key} className="flex items-start gap-3 text-sm">
                <SIcon className={cn("h-4 w-4 mt-0.5 shrink-0", sStyle.text)} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{s.label}:</span>{" "}
                  <span className="text-muted-foreground">{s.headline}</span>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-muted-foreground pt-1 border-t">
          Affordability is the deciding factor - if it's red, the overall verdict is red regardless of the other two.
          Otherwise majority rules: 2+ greens = green, 2+ reds = red, the rest = amber.
        </p>
      </CardContent>
    </Card>
  );
}

function SourcesPanel({ verdict }: { verdict: ReturnType<typeof runVerdict> }) {
  const isLive = verdict.priceSource === "live";
  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Where the numbers come from
          </div>
        </div>

        <ul className="text-sm space-y-2">
          <li className="flex flex-col sm:flex-row gap-1 sm:gap-2">
            <span className="text-muted-foreground shrink-0 sm:w-32 text-xs sm:text-sm uppercase sm:normal-case tracking-widest sm:tracking-normal">Price fairness</span>
            <span>
              {isLive
                ? <>HM Land Registry Price Paid Data - {verdict.compsUsed} real sold comparables in the last 24 months.</>
                : <>Modelled estimate from regional £/sqft averages. Enter a full UK postcode to use real sold prices.</>}
            </span>
          </li>
          <li className="flex flex-col sm:flex-row gap-1 sm:gap-2">
            <span className="text-muted-foreground shrink-0 sm:w-32 text-xs sm:text-sm uppercase sm:normal-case tracking-widest sm:tracking-normal">Affordability</span>
            <span>
              Indicative repayment mortgage at a representative rate for your loan-to-value, plus SDLT/LBTT/LTT and
              ~£2,500 of legal &amp; survey fees. Live lender rates land in a future update.
            </span>
          </li>
          <li className="flex flex-col sm:flex-row gap-1 sm:gap-2">
            <span className="text-muted-foreground shrink-0 sm:w-32 text-xs sm:text-sm uppercase sm:normal-case tracking-widest sm:tracking-normal">Lifestyle fit</span>
            <span>
              {verdict.lifestyleSource === "live" || verdict.lifestyleSource === "partial" ? (
                <>
                  Live overlays:{" "}
                  {verdict.liveCrimePerYear != null && <>data.police.uk - {verdict.liveCrimePerYear} crimes in the last 12 months within ~1 mile. </>}
                  {verdict.liveTransportNodes != null && <>OpenStreetMap - {verdict.liveTransportNodes} bus/rail/tube/tram stops within 800m. </>}
                  Schools (Ofsted) still directional.
                </>
              ) : (
                <>Directional scores from the area name and your priorities. Enter a full UK postcode for live crime and transport overlays.</>
              )}
            </span>
          </li>
          {verdict.epcSampleSize ? (
            <li className="flex flex-col sm:flex-row gap-1 sm:gap-2">
              <span className="text-muted-foreground shrink-0 sm:w-32 text-xs sm:text-sm uppercase sm:normal-case tracking-widest sm:tracking-normal">Floor area &amp; energy</span>
              <span>
                EPC Open Data (epc.opendatacommunities.org) - median {verdict.epcMedianSqft ?? "?"} sqft and modal energy band {verdict.epcModeBand ?? "?"} across {verdict.epcSampleSize} certificates registered at this postcode.
              </span>
            </li>
          ) : null}
        </ul>

        <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
          <p>
            <strong className="text-foreground">Caveats.</strong> Indicative only - not a mortgage offer, valuation,
            or financial advice. Sold-price comps don't account for condition, layout or chain risk; affordability
            uses a rough rate by LTV and ignores existing debt; lifestyle scores are directional until the live
            overlays are wired in.
          </p>
          <p>
            Open the deep-dive tools (AVM, Right-fit, Mortgage) to inspect every assumption and run your own
            sensitivity tests.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}

function ExpectedReturnPanel({ verdict }: { verdict: ReturnType<typeof runVerdict> }) {
  const er = verdict.expectedReturn;
  if (!er) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-5 flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Expected return - modelled.</span>{" "}
            Enter a UK postcode to pull real ONS House Price Index history for this local
            authority and run a 4,000-path Monte Carlo of likely 10-year returns.
          </div>
        </CardContent>
      </Card>
    );
  }
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
  return (
    <Card className="border-2 border-brand/20 bg-brand-muted/20">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Expected capital return · {er.yearsHeld} years
            </div>
            <div className="font-serif text-2xl mt-1">
              {fmtPct(er.p50Pct)} likely <span className="text-muted-foreground text-lg">({fmtPct(er.p10Pct)} to {fmtPct(er.p90Pct)})</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Annualised: <span className="font-mono">{fmtPct(er.annP50Pct)}</span>/yr ·
              {" "}{Math.round(er.probPositive * 100)}% chance of a positive return ·
              {" "}{Math.round(er.probBeatsCash * 100)}% chance of beating cash
            </div>
          </div>
        </div>

        {/* P10/P50/P90 bar */}
        <div className="space-y-1">
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-warning/40 via-success/40 to-success/60"
              style={{
                left: `${pctPos(er.p10Pct)}%`,
                width: `${Math.max(2, pctPos(er.p90Pct) - pctPos(er.p10Pct))}%`,
              }}
            />
            <div className="absolute h-full w-0.5 bg-foreground" style={{ left: `${pctPos(er.p50Pct)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>−50%</span><span>0%</span><span>+50%</span><span>+100%</span><span>+150%</span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground border-t pt-3">
          <Landmark className="h-3 w-3 mt-0.5 shrink-0" />
          <span>
            Bootstrap Monte Carlo of {er.paths.toLocaleString()} paths sampled from the actual monthly
            HPI returns for this Local Authority (HM Land Registry / ONS UK HPI), regression-blended
            70/30 toward the long-run mean. Capital only - rental income / costs not included.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Map a return % onto a 0..100 position over a -50%..+150% scale.
function pctPos(pct: number): number {
  return Math.max(0, Math.min(100, ((pct + 50) / 200) * 100));
}

function SnapshotButton({ verdict, postcode }: { verdict: ReturnType<typeof runVerdict>; postcode: string }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  if (!user) return null;
  const save = async () => {
    setSaving(true);
    try {
      const key = `${postcode || "unknown"}-${verdict.avmP50}`;
      const score = verdict.scores.reduce((s, x) => s + (x.light === "green" ? 100 : x.light === "amber" ? 60 : 30), 0) / verdict.scores.length;
      const { error } = await supabase.from("verdict_snapshots").insert({
        user_id: user.id,
        property_key: key,
        label: postcode ? `${postcode} · £${(verdict.avmP50/1000).toFixed(0)}k` : `£${(verdict.avmP50/1000).toFixed(0)}k`,
        verdict: verdict.overall,
        score: Math.round(score),
        inputs: { postcode, avmP50: verdict.avmP50 } as never,
        reasons: verdict.scores.map((s) => ({ label: s.label, light: s.light })) as never,
      });
      if (error) throw error;
      toast({ title: "Snapshot saved", description: "View it in Alerts → Verdict history." });
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  return (
    <Button onClick={save} variant="outline" size="lg" className="w-full sm:w-auto" disabled={saving}>
      <History className="h-4 w-4 mr-1.5" /> Save snapshot
    </Button>
  );
}

function ReceiptButton({ verdict, postcode }: { verdict: ReturnType<typeof runVerdict>; postcode: string }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const create = async () => {
    setBusy(true);
    try {
      const { createReceipt } = await import("@/lib/receipts");
      const score = Math.round(verdict.scores.reduce((s, x) => s + (x.light === "green" ? 100 : x.light === "amber" ? 60 : 30), 0) / verdict.scores.length);
      const band = verdict.overall === "green" ? "green" : verdict.overall === "amber" ? "amber" : "red";
      const r = await createReceipt({
        propertyRef: postcode || `£${verdict.avmP50.toLocaleString()}`,
        verdict: {
          oneLiner: verdict.oneLiner,
          monthlyPayment: verdict.monthlyPayment,
          upfrontCash: verdict.upfrontCash,
          avmP50: verdict.avmP50,
          factors: verdict.scores.map(s => ({ label: s.label, light: s.light, headline: s.headline })),
        },
        score, band,
      });
      toast({ title: "Verdict Receipt created", description: "Share link copied — anyone can view it." });
      const url = `${window.location.origin}/v/${r.slug}`;
      navigator.clipboard.writeText(url);
    } catch (e) {
      toast({ title: "Couldn't create receipt", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };
  return (
    <Button onClick={create} variant="default" size="lg" className="w-full sm:w-auto bg-brand text-brand-foreground hover:bg-brand/90" disabled={busy}>
      <FileDown className="h-4 w-4 mr-1.5" /> Verdict Receipt™
    </Button>
  );
}
