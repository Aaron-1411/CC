import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Camera, Download, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PropertyType = "victorian_terrace" | "newbuild_flat" | "maisonette" | "ex_council" | "period_conversion" | "detached_modern";

const TYPE_LABEL: Record<PropertyType, string> = {
  victorian_terrace: "Victorian / Edwardian terrace",
  newbuild_flat: "New-build flat",
  maisonette: "Maisonette",
  ex_council: "Ex-local-authority",
  period_conversion: "Period conversion flat",
  detached_modern: "Modern detached / semi",
};

const CHECKLISTS: Record<PropertyType, string[]> = {
  victorian_terrace: [
    "Damp meter check on ground floor walls",
    "Look up at roofline - slipped slates, missing lead flashing",
    "Sash window cords + frame rot",
    "Original floors: cupping, gaps, mice runs",
    "Check chimney breast - has it been removed without RSJ?",
    "Side return: scope for kitchen extension?",
    "Cellar: tanking, ventilation, fuse-board age",
  ],
  newbuild_flat: [
    "Service charge - last 3 years' actual spend vs budget",
    "Sinking fund balance per leaseholder",
    "Building safety - EWS1 / cladding status",
    "Lease length + ground rent escalation clause",
    "10-year warranty (NHBC / Premier / LABC) start date",
    "Defects period - any snags still open?",
    "Concierge cost included or separate?",
    "Check unit ventilation (MVHR) filter access",
  ],
  maisonette: [
    "Roof responsibility - top-floor maisonette = your roof?",
    "Shared entrance: cleaning, lighting, security",
    "Lease: who owns/insures the structure?",
    "Sound insulation between maisonettes",
    "Any external stairs - slip risk in winter",
  ],
  ex_council: [
    "Mortgageability - large panel system construction (LPS)?",
    "Concierge / cleaning: leaseholder share of cost",
    "Major works section 20 notices in last 5 years",
    "Lift maintenance contract & age",
    "Communal heating - efficient or expensive?",
  ],
  period_conversion: [
    "Lease length on share of freehold vs leasehold",
    "Top-floor heat loss - loft insulation present?",
    "Ground-floor - any flying freehold complications",
    "Hallway / shared lighting upkeep",
    "Original sash vs uPVC - planning conservation area?",
  ],
  detached_modern: [
    "Boundary fences: who owns which side?",
    "Drainage: mains or septic / cesspit?",
    "Solar PV: owned or leased? Inverter age",
    "Garage conversion: building regs sign-off?",
    "Driveway: dropped kerb permission",
  ],
};

const QUESTIONS = [
  "Why is the seller moving?",
  "How long has it been on the market?",
  "Has the asking price changed?",
  "What's included in the sale?",
  "What are the average bills?",
  "Any planning applications nearby?",
  "How is the mobile/broadband signal?",
  "What are the neighbours like?",
];

interface Photo { id: string; dataUrl: string; caption: string; }
interface Viewing {
  id: string;
  address: string;
  date: string;
  type: PropertyType;
  scores: { light: number; layout: number; condition: number; noise: number; storage: number; outdoor: number };
  notes: string;
  photos: Photo[];
  checklistDone: string[];
}

const STORAGE = "homestead.viewings.v2";
const blank = (): Viewing => ({
  id: crypto.randomUUID(),
  address: "",
  date: new Date().toISOString().slice(0, 10),
  type: "victorian_terrace",
  scores: { light: 5, layout: 5, condition: 5, noise: 5, storage: 5, outdoor: 5 },
  notes: "",
  photos: [],
  checklistDone: [],
});

export default function Viewings() {
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE); if (raw) setViewings(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(viewings)); }, [viewings]);

  const update = (id: string, patch: Partial<Viewing>) =>
    setViewings((v) => v.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const updateScore = (id: string, key: keyof Viewing["scores"], val: number) =>
    setViewings((v) => v.map((x) => (x.id === id ? { ...x, scores: { ...x.scores, [key]: val } } : x)));

  const total = (s: Viewing["scores"]) => Math.round(Object.values(s).reduce((a, b) => a + b, 0) / 6 * 10);

  const onPhoto = async (id: string, files: FileList | null) => {
    if (!files) return;
    const photos: Photo[] = [];
    for (const f of Array.from(files).slice(0, 6)) {
      const dataUrl: string = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.readAsDataURL(f);
      });
      photos.push({ id: crypto.randomUUID(), dataUrl, caption: f.name });
    }
    update(id, { photos: [...(viewings.find((v) => v.id === id)?.photos || []), ...photos] });
  };

  const exportPack = (v: Viewing) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${v.address || "Viewing"} - Pack</title>
<style>body{font-family:system-ui;max-width:780px;margin:32px auto;padding:0 24px;color:#1a1a1a}
h1{font-family:Georgia,serif;color:#1a3d2e}.score{font-size:42px;font-weight:bold;color:#1a3d2e}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}.k{background:#f4f1ea;padding:6px 10px;border-radius:6px;font-size:13px}
img{max-width:240px;border-radius:6px;margin:6px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.note{background:#fafafa;border-left:3px solid #1a3d2e;padding:12px;white-space:pre-wrap;font-size:14px}
.check{font-size:13px;margin:4px 0}.done{color:#16a34a}</style></head><body>
<h1>${v.address || "Viewing"}</h1><p>${v.date} · ${TYPE_LABEL[v.type]}</p>
<p class="score">${total(v.scores)}/100</p>
<div class="row">${(Object.entries(v.scores)).map(([k, val]) => `<span class="k">${k}: ${val}/10</span>`).join("")}</div>
<h2>Checklist</h2>${CHECKLISTS[v.type].map((c) => `<div class="check ${v.checklistDone.includes(c) ? "done" : ""}">${v.checklistDone.includes(c) ? "✓" : "○"} ${c}</div>`).join("")}
<h2>Notes</h2><div class="note">${v.notes || "-"}</div>
<h2>Photos</h2><div class="grid">${v.photos.map((p) => `<div><img src="${p.dataUrl}"/><p style="font-size:11px;color:#666">${p.caption}</p></div>`).join("")}</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(v.address || "viewing").replace(/[^a-z0-9]/gi, "_")}_pack.html`;
    a.click();
  };

  const rollup = useMemo(() =>
    [...viewings].map((v) => ({ ...v, score: total(v.scores) }))
      .sort((a, b) => b.score - a.score)
  , [viewings]);

  return (
    <>
      <PageHeader
        eyebrow="Viewings"
        title="Viewing Tracker"
        description="Type-specific checklists, photo capture, score rollup, and shareable HTML viewing packs."
        actions={<Button onClick={() => { const v = blank(); setViewings((vs) => [v, ...vs]); setActiveId(v.id); }} className="bg-brand text-brand-foreground hover:bg-brand/90"><Plus className="w-4 h-4 mr-1" /> New viewing</Button>}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {viewings.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground">No viewings yet - add your first.</Card>
          )}
          {viewings.map((v) => {
            const checklist = CHECKLISTS[v.type];
            const done = v.checklistDone.length;
            return (
              <Card key={v.id} className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-1 grid sm:grid-cols-2 gap-3">
                    <div><Label className="text-xs">Address</Label><Input value={v.address} onChange={(e) => update(v.id, { address: e.target.value })} placeholder="12 Maple Grove" /></div>
                    <div><Label className="text-xs">Date</Label><Input type="date" value={v.date} onChange={(e) => update(v.id, { date: e.target.value })} /></div>
                    <div className="sm:col-span-2"><Label className="text-xs">Property type (drives the checklist)</Label>
                      <Select value={v.type} onValueChange={(val: PropertyType) => update(v.id, { type: val, checklistDone: [] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{(Object.keys(TYPE_LABEL) as PropertyType[]).map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Badge className="bg-brand-muted text-brand border-0 font-mono">{total(v.scores)}/100</Badge>
                  <Button size="icon" variant="ghost" onClick={() => exportPack(v)} title="Download viewing pack"><Download className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setViewings((vs) => vs.filter((x) => x.id !== v.id))}><Trash2 className="w-4 h-4" /></Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-2">
                  {(Object.keys(v.scores) as (keyof Viewing["scores"])[]).map((k) => (
                    <div key={k}>
                      <div className="flex justify-between text-xs"><span className="capitalize text-muted-foreground">{k}</span><span className="font-mono">{v.scores[k]}/10</span></div>
                      <Slider value={[v.scores[k]]} min={0} max={10} step={1} onValueChange={(vv) => updateScore(v.id, k, vv[0])} />
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] uppercase tracking-widest text-brand font-semibold">Type-specific checklist</p>
                    <span className="font-mono text-xs text-muted-foreground">{done}/{checklist.length}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {checklist.map((c) => {
                      const isDone = v.checklistDone.includes(c);
                      return (
                        <li key={c}>
                          <button
                            onClick={() => update(v.id, { checklistDone: isDone ? v.checklistDone.filter((x) => x !== c) : [...v.checklistDone, c] })}
                            className={`flex items-start gap-2 text-sm w-full text-left rounded-md p-1.5 hover:bg-muted/40 ${isDone ? "text-success" : ""}`}
                          >
                            <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isDone ? "bg-success border-success text-success-foreground" : "border-muted-foreground"}`}>
                              {isDone && <Check className="w-3 h-3" />}
                            </span>
                            <span className={isDone ? "line-through" : ""}>{c}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] uppercase tracking-widest text-brand font-semibold">Photos</p>
                    <label className="text-xs text-brand cursor-pointer flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" /> Add photos
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPhoto(v.id, e.target.files)} />
                    </label>
                  </div>
                  {v.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {v.photos.map((p) => (
                        <div key={p.id} className="relative">
                          <img src={p.dataUrl} alt={p.caption} className="rounded-md border w-full h-24 object-cover" />
                          <button
                            onClick={() => update(v.id, { photos: v.photos.filter((x) => x.id !== p.id) })}
                            className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Label className="text-xs">Notes</Label>
                  <textarea value={v.notes} onChange={(e) => update(v.id, { notes: e.target.value })} rows={3} className="w-full rounded-md border bg-background p-2 text-sm" placeholder="First impressions, deal-breakers, things to follow up..." />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          {rollup.length > 1 && (
            <Card className="p-5">
              <h3 className="font-serif font-bold text-brand mb-3">Rollup · ranked</h3>
              <ul className="space-y-2 text-sm">
                {rollup.map((v, i) => (
                  <li key={v.id} className="flex items-center justify-between border-b last:border-0 pb-1.5">
                    <span className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground w-4">{i + 1}.</span><span>{v.address || <em className="text-muted-foreground">Untitled</em>}</span></span>
                    <span className="font-mono font-bold text-brand">{v.score}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card className="p-6 bg-gradient-warm h-fit">
            <h3 className="font-serif font-bold text-brand mb-3">Universal questions</h3>
            <ul className="space-y-2 text-sm">
              {QUESTIONS.map((q, i) => (
                <li key={q} className="flex gap-2"><span className="font-mono text-brand">{i + 1}.</span><span>{q}</span></li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
