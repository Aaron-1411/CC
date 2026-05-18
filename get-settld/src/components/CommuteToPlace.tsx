// Compares a destination (postcode/place) against the user's selected
// areas and shows door-to-door times across transit / drive / cycle / walk.
// Uses postcodes.io directly + a heuristic estimator (see commuteEstimator.ts).

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Train, Car, Bike, Footprints, Loader2, Sparkles } from "lucide-react";
import {
  resolvePlace, resolveAreaCentroid, estimateTimes,
  type PlaceResolved, type LatLng, type CommuteMode, MODE_LABEL,
} from "@/lib/commuteEstimator";
import type { Area } from "@/data/areas";

interface Props { areas: Area[]; }

type Times = Awaited<ReturnType<typeof estimateTimes>>;
interface Row {
  area: Area;
  origin: LatLng | null;
  times: Times | null;
}

const MODE_ICON: Record<CommuteMode, typeof Train> = {
  transit: Train, drive: Car, cycle: Bike, walk: Footprints,
};

const scoreFromMins = (m: number) =>
  m <= 20 ? 100 : m >= 90 ? 5 : Math.round(100 - ((m - 20) / 70) * 95);

const barColor = (s: number) =>
  s >= 75 ? "bg-success" : s >= 50 ? "bg-brand" : s >= 30 ? "bg-warning" : "bg-destructive";

export default function CommuteToPlace({ areas }: Props) {
  const [query, setQuery] = useState("");
  const [dest, setDest] = useState<PlaceResolved | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [primary, setPrimary] = useState<CommuteMode>("transit");

  const lookup = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(null);
    const place = await resolvePlace(query);
    if (!place) {
      setError("Couldn't find that postcode or place. Try a UK postcode like EC2A 4NE.");
      setLoading(false); setDest(null); return;
    }
    setDest(place);
    setLoading(false);
  };

  useEffect(() => {
    if (!dest) { setRows([]); return; }
    let cancelled = false;
    (async () => {
      const out: Row[] = [];
      for (const a of areas) {
        const origin = await resolveAreaCentroid(a.id);
        const times = origin ? await estimateTimes(origin, { lat: dest.lat, lng: dest.lng }) : null;
        out.push({ area: a, origin, times });
        if (cancelled) return;
        // incremental render so users see progress
        setRows([...out]);
      }
      if (!cancelled) setRows(out);
    })();
    return () => { cancelled = true; };
  }, [dest, areas]);

  const sorted = [...rows].sort((a, b) => {
    const ax = a.times?.find((t) => t.mode === primary)?.minutes ?? 999;
    const bx = b.times?.find((t) => t.mode === primary)?.minutes ?? 999;
    return ax - bx;
  });

  return (
    <Card className="p-6 shadow-soft">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Commute to a place
        </p>
        <h3 className="font-serif text-xl font-bold text-brand mt-1">How long to get to anywhere you choose?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Type a UK postcode or place (your office, parents, gym). We estimate door-to-door time from each area by transport, drive, cycle and walk.
        </p>
      </div>

      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <Label>Destination postcode or place</Label>
          <Input
            placeholder="e.g. EC2A 4NE, SW1A 1AA, or Manchester"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            className="mt-1.5"
          />
        </div>
        <Button onClick={lookup} disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Calculate"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive mt-3">{error}</p>}

      {dest && (
        <div className="mt-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <p className="text-sm">
              Destination: <span className="font-semibold">{dest.label}</span>
            </p>
            <div className="flex gap-1 bg-muted rounded-md p-0.5">
              {(["transit", "drive", "cycle", "walk"] as CommuteMode[]).map((m) => {
                const Icon = MODE_ICON[m];
                return (
                  <button key={m} onClick={() => setPrimary(m)}
                    className={`flex items-center gap-1 text-xs rounded px-2 py-1 transition-colors ${
                      primary === m ? "bg-card shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}>
                    <Icon className="w-3 h-3" /> {MODE_LABEL[m]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            {sorted.map(({ area, times }, i) => {
              if (!times) return (
                <div key={area.id} className="text-sm text-muted-foreground py-2 border-b">
                  {area.name} — couldn't resolve postcode centroid
                </div>
              );
              const focused = times.find((t) => t.mode === primary)!;
              const score = scoreFromMins(focused.minutes);
              return (
                <div key={area.id} className="grid grid-cols-12 items-center gap-2 py-2 border-b last:border-0">
                  <div className="col-span-12 sm:col-span-4 flex items-center gap-2">
                    {i === 0 && sorted.length > 1 && (
                      <Badge className="bg-success/15 text-success border-0 hover:bg-success/15">Closest</Badge>
                    )}
                    <span className="font-serif font-bold text-brand">{area.name}</span>
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-sm font-mono font-semibold flex items-center gap-1.5">
                    {focused.minutes} min
                    {focused.source === "tfl" && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-success/40 text-success">TfL</Badge>
                    )}
                  </div>
                  <div className="col-span-9 sm:col-span-3">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${barColor(score)}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                  <div className="col-span-12 sm:col-span-3 flex gap-3 text-[11px] text-muted-foreground font-mono">
                    {times.filter((t) => t.mode !== primary).map((t) => {
                      const Icon = MODE_ICON[t.mode];
                      return (
                        <span key={t.mode} className="flex items-center gap-1">
                          <Icon className="w-3 h-3" /> {t.minutes}m
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-4 flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              <strong>TfL live</strong> badges use the real Journey Planner (London journeys).
              Other times are estimated from straight-line distance × 1.25 and typical UK speeds.
              Drive times are always estimated.
            </span>
          </p>
        </div>
      )}
    </Card>
  );
}
