// Reusable nearby-stations panel. Pass lat/lng (from a postcode lookup) and
// it renders a ranked list of rail/tube/tram stations with walk time + lines.
import { Train, Footprints, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTransport, type NearbyStation } from "@/hooks/use-transport";

interface Props {
  lat: number | null | undefined;
  lng: number | null | undefined;
  limit?: number;
  compact?: boolean;
  title?: string;
}

const KIND_LABEL: Record<NearbyStation["kind"], string> = {
  rail: "Rail",
  tube: "Tube/Metro",
  tram: "Tram",
};
const KIND_COLOR: Record<NearbyStation["kind"], string> = {
  rail: "bg-brand/15 text-brand",
  tube: "bg-accent/15 text-foreground",
  tram: "bg-success/15 text-success",
};

export default function StationsPanel({ lat, lng, limit = 5, compact = false, title = "Nearest stations" }: Props) {
  const q = useTransport(lat, lng);

  if (lat == null || lng == null) {
    return (
      <div className="text-xs text-muted-foreground">Waiting for postcode coordinates…</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold flex items-center gap-2">
          <Train className="h-4 w-4 text-brand" /> {title}
        </span>
        {q.data?.nearestStationWalkMin != null && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <Footprints className="h-3 w-3" /> {q.data.nearestStationWalkMin} min walk
          </Badge>
        )}
      </div>

      {q.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      )}

      {q.error && (
        <div className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Couldn't load stations.
          <Button variant="link" size="sm" className="h-auto px-1 text-xs" onClick={() => q.refetch()}>Try again</Button>
        </div>
      )}

      {q.data && q.data.stations.length === 0 && (
        <p className="text-xs text-muted-foreground">No rail, tube or tram stations within {Math.round(q.data.radiusM / 1000)} km.</p>
      )}

      {q.data && q.data.stations.length > 0 && (
        <ul className="space-y-1.5">
          {q.data.stations.slice(0, limit).map((s) => (
            <li key={`${s.name}-${s.kind}`} className="flex items-start justify-between gap-2 text-xs">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground truncate">{s.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${KIND_COLOR[s.kind]}`}>{KIND_LABEL[s.kind]}</span>
                </div>
                {!compact && s.lines.length > 0 && (
                  <p className="text-[11px] text-muted-foreground truncate">{s.lines.slice(0, 4).join(" · ")}</p>
                )}
                {!compact && !s.lines.length && s.operator && (
                  <p className="text-[11px] text-muted-foreground truncate">{s.operator}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-foreground">{(s.distanceM / 1000).toFixed(2)} km</div>
                <div className="text-[10px] text-muted-foreground">{s.walkMin} min walk</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {q.data && (
        <p className="text-[10px] text-muted-foreground mt-2">Source: OpenStreetMap · cached 30 days</p>
      )}
    </div>
  );
}
