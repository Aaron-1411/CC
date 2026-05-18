// Side-by-side transport comparison for shortlisted properties.
// Two properties in the same area can have very different value depending on
// how close they are to a station — this panel ranks them by proximity and
// shows the actual nearest stations + lines for each.
import { useEffect, useMemo, useReducer } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Train, Trophy, Footprints, AlertCircle } from "lucide-react";
import { usePostcodeLookup } from "@/hooks/use-postcode-lookup";
import { useTransport, type NearbyStation } from "@/hooks/use-transport";
import type { SavedProperty } from "@/lib/shortlist";
import PropertyStationsMap from "@/components/PropertyStationsMap";

interface Props { properties: SavedProperty[] }

const POSTCODE_RE = /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/i;

function extractPostcode(p: SavedProperty): string | null {
  const blobs = [p.area, p.address, p.notes].filter(Boolean) as string[];
  for (const b of blobs) {
    const m = b.match(POSTCODE_RE);
    if (m) return m[0].toUpperCase().replace(/\s+/g, " ").trim();
  }
  return null;
}

interface Row {
  property: SavedProperty;
  postcode: string | null;
  loading: boolean;
  error?: string;
  lat: number | null;
  lng: number | null;
  nearestStationM: number | null;
  nearestStationWalkMin: number | null;
  stations: NearbyStation[];
  transportScore: number | null;
}

function PropertyRow({ property, onResolve }: { property: SavedProperty; onResolve: (r: Row) => void }) {
  const postcode = extractPostcode(property);
  const pc = usePostcodeLookup(postcode);
  const t = useTransport(pc.data?.latitude, pc.data?.longitude);

  const row: Row = {
    property,
    postcode,
    loading: !!postcode && (pc.isLoading || t.isLoading),
    error: !postcode
      ? "No postcode found in address — edit the property to add one."
      : pc.error?.message || t.error?.message,
    lat: pc.data?.latitude ?? null,
    lng: pc.data?.longitude ?? null,
    nearestStationM: t.data?.nearestStationM ?? null,
    nearestStationWalkMin: t.data?.nearestStationWalkMin ?? null,
    stations: t.data?.stations ?? [],
    transportScore: t.data?.score ?? null,
  };
  // bubble row data up so parent can rank
  // (cheap: this fires once per data change; React batches.)
  useMemoBubble(row, onResolve);
  return null;
}

// Custom helper to push the latest row state up only when meaningful values change.
function useMemoBubble(row: Row, onResolve: (r: Row) => void) {
  const key = `${row.property.id}|${row.loading}|${row.error ?? ""}|${row.nearestStationM ?? ""}|${row.transportScore ?? ""}|${row.stations.length}`;
  useEffect(() => { onResolve(row); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}

export default function ShortlistTransportCompare({ properties }: Props) {
  // Local resolved rows — we collect them from child fetchers so we can rank.
  const [rows, setRows] = useReducer(
    (acc: Map<string, Row>, next: Row) => {
      const m = new Map(acc);
      m.set(next.property.id, next);
      return m;
    },
    new Map<string, Row>(),
  );

  const ranked = useMemo(() => {
    const arr: Row[] = properties.map((p) => rows.get(p.id) ?? {
      property: p, postcode: extractPostcode(p), loading: true, stations: [],
      lat: null, lng: null,
      nearestStationM: null, nearestStationWalkMin: null, transportScore: null,
    });
    return arr.sort((a, b) => {
      const ax = a.nearestStationM ?? Number.POSITIVE_INFINITY;
      const bx = b.nearestStationM ?? Number.POSITIVE_INFINITY;
      return ax - bx;
    });
  }, [properties, rows]);

  if (!properties.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Train className="h-5 w-5 text-brand" /> Transport ranking
          <Badge variant="outline" className="ml-2 text-[10px]">Closer to a station = more valuable</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden fetchers — one per property */}
        <div className="hidden">
          {properties.map((p) => (
            <PropertyRow key={p.id} property={p} onResolve={(r) => setRows(r)} />
          ))}
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Property</th>
                <th className="px-2 py-2 text-right">Nearest station</th>
                <th className="px-2 py-2 text-right">Distance</th>
                <th className="px-2 py-2 text-right">Walk</th>
                <th className="px-2 py-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => {
                const top = r.stations[0];
                return (
                  <tr key={r.property.id} className="border-t align-top">
                    <td className="px-2 py-3">
                      {i === 0 && r.nearestStationM != null
                        ? <Trophy className="h-4 w-4 text-accent" aria-label="Closest to a station" />
                        : <span className="text-muted-foreground">{i + 1}</span>}
                    </td>
                    <td className="px-2 py-3">
                      <div className="font-semibold text-foreground">{r.property.address}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.postcode ?? <span className="text-destructive">No postcode</span>}
                        {r.property.area && r.property.area !== r.postcode ? ` · ${r.property.area}` : ""}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right">
                      {r.error ? (
                        <span className="text-xs text-destructive flex items-center gap-1 justify-end">
                          <AlertCircle className="h-3 w-3" /> {r.error}
                        </span>
                      ) : r.loading ? (
                        <Skeleton className="h-4 w-32 ml-auto" />
                      ) : top ? (
                        <div>
                          <div className="font-semibold">{top.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {top.kind === "tube" ? "Tube/Metro" : top.kind === "tram" ? "Tram" : "Rail"}
                            {top.lines.length ? ` · ${top.lines.slice(0, 3).join(" · ")}` : ""}
                          </div>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-2 py-3 text-right font-mono">
                      {r.nearestStationM != null ? `${(r.nearestStationM / 1000).toFixed(2)} km` : "—"}
                    </td>
                    <td className="px-2 py-3 text-right font-mono">
                      {r.nearestStationWalkMin != null
                        ? <span className="inline-flex items-center gap-1"><Footprints className="h-3 w-3" /> {r.nearestStationWalkMin}m</span>
                        : "—"}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className="font-mono font-bold">{r.transportScore ?? "—"}</span>
                      <span className="text-[10px] text-muted-foreground">/100</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Per-property map + station detail */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ranked.map((r) => (
            <div key={`d-${r.property.id}`} className="rounded-md border p-3 space-y-2">
              <div>
                <div className="text-xs font-semibold text-foreground truncate">{r.property.address}</div>
                <div className="text-[11px] text-muted-foreground">{r.postcode ?? "—"}</div>
              </div>
              {r.lat != null && r.lng != null ? (
                <PropertyStationsMap
                  lat={r.lat}
                  lng={r.lng}
                  label={r.property.address}
                  stations={r.stations}
                  height={180}
                  maxStations={5}
                />
              ) : (
                <div className="h-[180px] rounded-md bg-muted flex items-center justify-center text-[11px] text-muted-foreground text-center px-3">
                  {r.error ?? "Resolving location…"}
                </div>
              )}
              {r.stations.length === 0 && !r.loading && r.lat != null && (
                <div className="text-[11px] text-muted-foreground">No stations indexed nearby.</div>
              )}
              <ul className="space-y-1">
                {r.stations.slice(0, 3).map((s, i) => (
                  <li key={`${r.property.id}-${s.name}-${s.kind}`} className="text-[11px] flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand text-[9px] text-brand-foreground font-bold shrink-0">{i + 1}</span>
                      <span className="font-semibold truncate">{s.name}</span>
                    </span>
                    <span className="font-mono text-muted-foreground shrink-0">
                      {(s.distanceM/1000).toFixed(2)}km · {s.walkMin}m
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

