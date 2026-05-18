import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AREAS } from "@/data/areas";
import { fmtFull } from "@/lib/format";
import { ArrowRight, ArrowUp, ArrowDown } from "lucide-react";

interface Weights { schools: number; transport: number; green: number; crime: number; growth: number; yield: number; }
const LIFESTYLE: Weights = { schools: 8, transport: 8, green: 6, crime: 6, growth: 3, yield: 2 };
const INVESTMENT: Weights = { schools: 3, transport: 6, green: 2, crime: 5, growth: 9, yield: 9 };

type Bias = "lifestyle" | "investment" | "custom";

export default function DataTwin() {
  const [favId, setFavId] = useState(AREAS[0].id);
  const [bias, setBias] = useState<Bias>("lifestyle");
  const [weights, setWeights] = useState<Weights>(LIFESTYLE);

  const fav = AREAS.find((a) => a.id === favId)!;

  const activeWeights = bias === "lifestyle" ? LIFESTYLE : bias === "investment" ? INVESTMENT : weights;

  const matches = useMemo(() => {
    const w = activeWeights;
    return AREAS.filter((a) => a.id !== favId).map((a) => {
      // Per-feature distance, normalised so each maxes at the weight.
      const f = {
        schools: Math.abs(a.schools - fav.schools) / 10 * w.schools,
        transport: Math.abs(a.transport - fav.transport) / 10 * w.transport,
        green: Math.abs(a.green - fav.green) / 10 * w.green,
        crime: Math.min(1, Math.abs(a.crime - fav.crime) / 100) * w.crime,
        growth: Math.min(1, Math.abs(a.growth5y - fav.growth5y) / 30) * w.growth,
        yield: Math.min(1, Math.abs(a.yield - fav.yield) / 5) * w.yield,
      };
      const totalW = Object.values(w).reduce((s, x) => s + x, 0) || 1;
      const distScore = Object.values(f).reduce((s, x) => s + x, 0) / totalW;
      const similarity = Math.max(0, Math.round(100 - distScore * 100));

      const featurePerf = (Object.entries(f) as [keyof Weights, number][])
        .map(([k, v]) => ({ k, distance: v, weight: w[k] }))
        .sort((a, b) => a.distance - b.distance);

      const closest = featurePerf.slice(0, 3).filter((x) => x.weight > 0);
      const furthest = [...featurePerf].reverse().slice(0, 2).filter((x) => x.weight > 0);

      const saving = fav.medianPrice - a.medianPrice;
      return { area: a, similarity, saving, closest, furthest };
    }).sort((x, y) => y.similarity - x.similarity).slice(0, 24);
  }, [favId, fav, activeWeights]);

  return (
    <>
      <PageHeader
        eyebrow="Discovery"
        title="Area Data Twin"
        description="Find areas with the same DNA - pick a similarity bias, see which features actually matched, and compare prices."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Card className="p-6 grid lg:grid-cols-3 gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Your favourite area</p>
            <Select value={favId} onValueChange={setFavId}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>{AREAS.slice(0, 200).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              <Stat l="Median £" v={fmtFull(fav.medianPrice)} />
              <Stat l="Schools" v={`${fav.schools}/10`} />
              <Stat l="Yield" v={`${fav.yield}%`} />
            </div>
          </div>

          <div className="lg:col-span-2 border-l lg:pl-6">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Similarity bias</p>
            <div className="flex gap-2 mb-4">
              {(["lifestyle", "investment", "custom"] as Bias[]).map((b) => (
                <button
                  key={b}
                  onClick={() => { setBias(b); if (b === "lifestyle") setWeights(LIFESTYLE); if (b === "investment") setWeights(INVESTMENT); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border ${bias === b ? "bg-brand text-brand-foreground border-brand" : "bg-card text-muted-foreground hover:bg-muted"}`}
                >{b}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {(Object.keys(activeWeights) as (keyof Weights)[]).map((k) => (
                <div key={k}>
                  <div className="flex justify-between mb-1">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</Label>
                    <span className="font-mono text-xs font-semibold text-brand">{activeWeights[k]}</span>
                  </div>
                  <Slider value={[activeWeights[k]]} min={0} max={10} step={1}
                    onValueChange={(v) => { setBias("custom"); setWeights((w) => ({ ...w, [k]: v[0] })); }} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {matches.map(({ area, similarity, saving, closest, furthest }) => (
            <Card key={area.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif font-bold text-brand text-lg">{area.name}</h3>
                  <p className="text-xs text-muted-foreground">{area.region} · {area.vibe}</p>
                </div>
                <Badge className="bg-brand-muted text-brand border-0 font-mono">{similarity}% match</Badge>
              </div>
              <div className="mt-4 space-y-2">
                {closest.map((c) => (
                  <div key={c.k} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-success"><ArrowUp className="w-3 h-3" /> Same {c.k}</span>
                    <span className="font-mono text-muted-foreground">w{c.weight}</span>
                  </div>
                ))}
                {furthest.length > 0 && furthest[0].distance > 0.05 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-warning"><ArrowDown className="w-3 h-3" /> Differs on {furthest.map((f) => f.k).join(", ")}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Median price</p>
                  <p className="font-mono text-lg font-bold text-brand">{fmtFull(area.medianPrice)}</p>
                </div>
                <div className={`text-right ${saving > 0 ? "text-success" : "text-muted-foreground"}`}>
                  <p className="text-[11px] uppercase tracking-widest">{saving > 0 ? "Save" : "Premium"}</p>
                  <p className="font-mono text-lg font-bold flex items-center gap-1">{saving > 0 ? "−" : "+"}{fmtFull(Math.abs(saving))} <ArrowRight className="w-4 h-4" /></p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

const Stat = ({ l, v }: { l: string; v: string }) => (
  <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</p><p className="font-mono text-sm font-semibold text-brand mt-0.5">{v}</p></div>
);
