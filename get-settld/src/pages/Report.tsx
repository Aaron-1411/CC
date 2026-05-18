import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileDown, Printer, ArrowLeft, Trophy, Calendar, Zap, Bed, Bath, Maximize } from "lucide-react";
import { fmt, fmtFull, monthlyPayment, sdltCalc, pct } from "@/lib/format";
import { JOURNEY_PHASES, MORTGAGE_STORAGE_KEY, loadJourneyDone } from "@/data/journey";
import { scoreProperties, ScoredProperty } from "@/data/properties";
import RegionTerm from "@/components/RegionTerm";
import Jargon from "@/components/Jargon";
import { logAction } from "@/lib/audit";
import { useTrackTool } from "@/hooks/use-track-tool";

const RATE_LABELS: Record<string, string> = {
  "2yr_fix": "2-Year Fixed",
  "5yr_fix": "5-Year Fixed",
  "10yr_fix": "10-Year Fixed",
  tracker: "Tracker (BoE+)",
};
// Mirror RATES_DB just for headline rate lookup
const RATES: Record<string, Record<number, number | null>> = {
  "2yr_fix": { 60: 3.89, 70: 4.05, 75: 4.09, 80: 4.19, 85: 4.44, 90: 4.69, 95: 5.09 },
  "5yr_fix": { 60: 3.79, 70: 3.93, 75: 3.99, 80: 4.09, 85: 4.29, 90: 4.49, 95: 4.89 },
  "10yr_fix": { 60: 4.05, 70: 4.15, 75: 4.20, 80: 4.35, 85: 4.55, 90: 4.79, 95: null },
  tracker: { 60: 4.99, 70: 5.09, 75: 5.14, 80: 5.24, 85: 5.44, 90: 5.69, 95: null },
};
const getRate = (key: string, ltv: number) => {
  const bands = RATES[key] || {};
  const sorted = Object.keys(bands).map(Number).sort((a, b) => a - b);
  for (const b of sorted) if (ltv <= b) return bands[b];
  return bands[sorted[sorted.length - 1]];
};

const TOP_PROP_KEY = "homestead-top-property-v1";

interface Branding { firm: string; tagline: string; color: string; logoDataUrl: string; }
interface Sections { mortgage: boolean; property: boolean; journey: boolean; }
const BRAND_KEY = "homestead-report-brand-v1";
const SECTIONS_KEY = "homestead-report-sections-v1";

export default function Report() {
  useTrackTool("report.view");
  const [topProp, setTopProp] = useState<ScoredProperty | null>(null);
  const [mortgage, setMortgage] = useState<any>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [brand, setBrand] = useState<Branding>({ firm: "Homestead Ledger", tagline: "First-time buyer report", color: "#1a3d2e", logoDataUrl: "" });
  const [sections, setSections] = useState<Sections>({ mortgage: true, property: true, journey: true });

  useEffect(() => {
    try {
      const m = JSON.parse(localStorage.getItem(MORTGAGE_STORAGE_KEY) || "null");
      setMortgage(m ?? { price: 450_000, depositPct: 15, term: 30, productKey: "5yr_fix", income: 65_000, overpay: 0 });
    } catch {}
    try {
      const t = JSON.parse(localStorage.getItem(TOP_PROP_KEY) || "null");
      if (t) setTopProp(t);
      else setTopProp(scoreProperties()[0]);
    } catch { setTopProp(scoreProperties()[0]); }
    try { const b = JSON.parse(localStorage.getItem(BRAND_KEY) || "null"); if (b) setBrand((p) => ({ ...p, ...b })); } catch {}
    try { const s = JSON.parse(localStorage.getItem(SECTIONS_KEY) || "null"); if (s) setSections(s); } catch {}
    setDone(loadJourneyDone());
  }, []);

  const updateBrand = (patch: Partial<Branding>) => {
    setBrand((p) => { const n = { ...p, ...patch }; try { localStorage.setItem(BRAND_KEY, JSON.stringify(n)); } catch {} return n; });
  };
  const updateSections = (patch: Partial<Sections>) => {
    setSections((p) => { const n = { ...p, ...patch }; try { localStorage.setItem(SECTIONS_KEY, JSON.stringify(n)); } catch {} return n; });
  };

  const onLogo = (file: File | null) => {
    if (!file) return;
    const r = new FileReader(); r.onload = () => updateBrand({ logoDataUrl: String(r.result) }); r.readAsDataURL(file);
  };


  const calcs = useMemo(() => {
    if (!mortgage) return null;
    const deposit = Math.round((mortgage.price * mortgage.depositPct) / 100);
    const principal = mortgage.price - deposit;
    const ltv = Math.round((principal / mortgage.price) * 100);
    const ltvBand = [60, 70, 75, 80, 85, 90, 95].find((b) => ltv <= b) ?? 95;
    const rate = getRate(mortgage.productKey, ltv) ?? 5;
    const mp = monthlyPayment(principal, rate, mortgage.term);
    const totalInt = mp * mortgage.term * 12 - principal;
    const sdlt = sdltCalc(mortgage.price);
    return { deposit, principal, ltv, ltvBand, rate, mp, totalInt, sdlt };
  }, [mortgage]);

  const totalSteps = JOURNEY_PHASES.reduce((s, p) => s + p.steps.length, 0);
  const journeyPct = Math.round((done.size / totalSteps) * 100);

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  if (!mortgage || !calcs) return null;

  return (
    <div className="bg-muted/30 min-h-screen">
      {/* Toolbar - hidden on print */}
      <div className="print:hidden border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</Link>
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs flex items-center gap-1 cursor-pointer border rounded-md px-2 py-1 hover:bg-muted">
              Logo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0] || null)} />
            </label>
            <input value={brand.firm} onChange={(e) => updateBrand({ firm: e.target.value })} placeholder="Firm name" className="text-xs border rounded-md px-2 py-1 w-32" />
            <input value={brand.tagline} onChange={(e) => updateBrand({ tagline: e.target.value })} placeholder="Tagline" className="text-xs border rounded-md px-2 py-1 w-40" />
            <input type="color" value={brand.color} onChange={(e) => updateBrand({ color: e.target.value })} className="w-7 h-7 rounded border" title="Brand colour" />
            {(["mortgage", "property", "journey"] as (keyof Sections)[]).map((k) => (
              <label key={k} className="text-xs flex items-center gap-1 px-2 py-1 border rounded-md cursor-pointer">
                <input type="checkbox" checked={sections[k]} onChange={(e) => updateSections({ [k]: e.target.checked } as any)} /> {k}
              </label>
            ))}
            <Button onClick={() => { void logAction("report.downloaded", { metadata: { sections, price: mortgage?.price } }); window.print(); }} className="bg-brand text-brand-foreground hover:bg-brand/90">
              <FileDown className="w-4 h-4 mr-1.5" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Printable A4 page */}
      <div className="max-w-5xl mx-auto p-6 print:p-0 print:max-w-none">
        <div className="bg-card shadow-card print:shadow-none rounded-lg print:rounded-none p-10 print:p-12 space-y-10 report-page">
          {/* Header */}
          <header className="flex items-start justify-between border-b pb-6" style={{ borderColor: `${brand.color}33` }}>
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                {brand.logoDataUrl
                  ? <img src={brand.logoDataUrl} alt={brand.firm} className="h-9 w-9 rounded-md object-contain bg-card border" />
                  : <div className="h-9 w-9 rounded-md flex items-center justify-center shadow-soft" style={{ background: brand.color }}>
                      <span className="font-serif font-bold text-primary-foreground">{brand.firm.charAt(0)}</span>
                    </div>}
                <div>
                  <p className="font-serif font-bold" style={{ color: brand.color }}>{brand.firm}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{brand.tagline}</p>
                </div>
              </div>
              <h1 className="font-serif text-3xl font-bold mt-4 leading-tight" style={{ color: brand.color }}>
                Your Property Purchase Summary
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm">A snapshot of your numbers, top property, and journey to completion.</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Issued</p>
              <p className="font-mono text-sm font-semibold mt-0.5" style={{ color: brand.color }}>{today}</p>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-2">Methodology v1.2</p>
            </div>
          </header>


          {/* Mortgage section */}
          {sections.mortgage && <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-brand">1 · Mortgage snapshot</h2>
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {RATE_LABELS[mortgage.productKey]} · {pct(calcs.rate)}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                { l: "Property price", v: fmtFull(mortgage.price) },
                { l: "Deposit", v: `${fmtFull(calcs.deposit)} (${mortgage.depositPct}%)` },
                { l: "Loan", v: fmtFull(calcs.principal) },
                { l: "LTV", v: `${calcs.ltv}%` },
              ].map((x) => (
                <div key={x.l} className="border-l-2 border-brand/40 pl-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{x.l}</p>
                  <p className="font-mono font-semibold text-brand mt-1 text-sm">{x.v}</p>
                </div>
              ))}
            </div>
            <Card className="p-5 bg-gradient-brand text-brand-foreground border-0 print:bg-brand">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-widest opacity-75">Monthly repayment</p>
                  <p className="font-serif text-3xl font-bold mt-1">{fmtFull(calcs.mp)}</p>
                  <p className="text-xs opacity-80 mt-1">over {mortgage.term} years</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-75">Total interest</p>
                  <p className="font-mono text-lg font-semibold mt-1">{fmt(calcs.totalInt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-75">Stamp duty</p>
                  <p className="font-mono text-lg font-semibold mt-1">{fmt(calcs.sdlt)}</p>
                </div>
              </div>
            </Card>
            <p className="text-xs text-muted-foreground mt-3">
              Income {fmtFull(mortgage.income)} · borrowing {(calcs.principal / Math.max(mortgage.income, 1)).toFixed(1)}× income (lender cap typically 4.5×).
            </p>
          </section>}

          {/* Top Property */}
          {sections.property && topProp && (
            <section className="break-inside-avoid">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-serif text-xl font-bold text-brand">2 · Top-ranked property</h2>
                <Badge className="bg-brand text-brand-foreground border-0">
                  <Trophy className="w-3 h-3 mr-1" /> {topProp.total}/100
                </Badge>
              </div>
              <Card className="p-6 shadow-soft">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{topProp.area}</p>
                <h3 className="font-serif text-2xl font-bold text-brand mt-1">{topProp.address}</h3>
                <div className="flex items-baseline gap-3 mt-3">
                  <p className="font-mono text-2xl font-bold text-brand">{fmt(topProp.price)}</p>
                  <p className="text-sm text-muted-foreground">£{topProp.pricePerSqft}/sqft · {topProp.tenure}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-sm">
                  {[
                    { i: Bed, v: topProp.beds, l: "beds" },
                    { i: Bath, v: topProp.baths, l: "baths" },
                    { i: Maximize, v: topProp.sqft, l: "sqft" },
                    { i: Calendar, v: topProp.yearBuilt, l: "built" },
                    { i: Zap, v: topProp.epc, l: "EPC" },
                  ].map((s) => (
                    <div key={s.l} className="flex flex-col items-center bg-muted/40 rounded-md py-2">
                      <s.i className="w-3.5 h-3.5 text-brand mb-0.5" />
                      <span className="font-mono font-semibold text-sm">{s.v}</span>
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{s.l}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-5 mt-5 pt-4 border-t">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-success font-semibold mb-1.5">Strengths</p>
                    <ul className="text-sm space-y-1">{topProp.pros.map((p) => <li key={p}>+ {p}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-destructive font-semibold mb-1.5">Watch-outs</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">{topProp.cons.map((c) => <li key={c}>− {c}</li>)}</ul>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* Journey progress */}
          {sections.journey && <section className="break-inside-avoid">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-brand">3 · Buying journey progress</h2>
              <span className="font-mono text-sm font-semibold text-brand">{done.size}/{totalSteps} steps · {journeyPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-5">
              <div className="h-full bg-gradient-brand" style={{ width: `${journeyPct}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {JOURNEY_PHASES.map((phase) => {
                const phaseDone = phase.steps.filter((s) => done.has(s.id)).length;
                return (
                  <Card key={phase.name} className="p-4 shadow-soft">
                    <div className="flex items-baseline justify-between border-b pb-2 mb-2">
                      <p className="font-serif font-bold text-brand text-sm">
                        <span className="text-accent mr-1">{phase.icon}</span> {phase.name}
                      </p>
                      <span className="font-mono text-xs text-muted-foreground">{phaseDone}/{phase.steps.length}</span>
                    </div>
                    <ul className="space-y-1 text-xs">
                      {phase.steps.map((s) => (
                        <li key={s.id} className={done.has(s.id) ? "text-success" : "text-muted-foreground"}>
                          {done.has(s.id) ? "✓" : "○"} {s.label}
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          </section>}

          {/* Footer */}
          <footer className="border-t pt-5 flex items-center justify-between text-xs text-muted-foreground">
            <p>Generated by {brand.firm} · Methodology v1.2 · For your records only - not financial advice.</p>
            <p className="font-mono">{today}</p>
          </footer>
        </div>

        {/* Helper note (screen only) */}
        <div className="mt-6 print:hidden text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Printer className="w-4 h-4" />
          Tip: in the print dialog, choose “Save as PDF” as the destination for the cleanest output.
        </div>
      </div>
    </div>
  );
}
