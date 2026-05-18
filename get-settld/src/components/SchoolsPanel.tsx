// Nearby Ofsted-rated schools list for a given postcode/outcode.
import { GraduationCap, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSchools } from "@/hooks/use-area-overlays";

interface Props {
  postcode: string | null | undefined;
  radiusKm?: number;
  limit?: number;
  title?: string;
}

const ratingTone = (r: string) => {
  const s = r.toLowerCase();
  if (s.includes("outstanding")) return "bg-success/15 text-success";
  if (s.includes("good")) return "bg-brand/15 text-brand";
  if (s.includes("requires")) return "bg-warning/15 text-warning";
  if (s.includes("inadequate")) return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

export default function SchoolsPanel({ postcode, radiusKm = 2, limit = 5, title = "Nearest schools" }: Props) {
  const q = useSchools(postcode ?? undefined, radiusKm);

  if (!postcode) {
    return <div className="text-xs text-muted-foreground">No postcode for this area.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-brand" /> {title}
        </span>
        {q.data?.headline && (
          <Badge variant="outline" className="text-[10px]">{q.data.headline}</Badge>
        )}
      </div>

      {q.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      )}

      {q.error && (
        <div className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Couldn't load schools.
          <Button variant="link" size="sm" className="h-auto px-1 text-xs" onClick={() => q.refetch()}>Retry</Button>
        </div>
      )}

      {q.data && q.data.schools.length === 0 && !q.isLoading && (
        <p className="text-xs text-muted-foreground">No Ofsted-rated schools within {radiusKm}km.</p>
      )}

      {q.data && q.data.schools.length > 0 && (
        <ul className="space-y-1.5">
          {q.data.schools.slice(0, limit).map((s) => (
            <li key={`${s.urn ?? s.name}`} className="flex items-start justify-between gap-2 text-xs">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground truncate">{s.name}</div>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  {s.phase && <span className="text-[10px] text-muted-foreground">{s.phase}</span>}
                  {s.ofsted && <span className={`text-[10px] px-1.5 py-0.5 rounded ${ratingTone(s.ofsted)}`}>{s.ofsted}</span>}
                </div>
              </div>
              {s.distanceKm != null && (
                <div className="text-right shrink-0 font-mono text-foreground">{s.distanceKm.toFixed(2)} km</div>
              )}
            </li>
          ))}
        </ul>
      )}

      {q.data && (
        <p className="text-[10px] text-muted-foreground mt-2">Source: Ofsted / GIAS</p>
      )}
    </div>
  );
}
