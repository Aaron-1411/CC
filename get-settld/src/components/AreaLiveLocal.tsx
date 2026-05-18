// Live transport + schools for an area, looked up by its outcode (area.id).
import { useOutcode } from "@/hooks/use-outcode";
import StationsPanel from "@/components/StationsPanel";
import SchoolsPanel from "@/components/SchoolsPanel";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { outcode: string }

export default function AreaLiveLocal({ outcode }: Props) {
  const oc = outcode.toUpperCase();
  const q = useOutcode(oc);

  return (
    <div className="mt-6 pt-5 border-t space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
          Live local · {oc}
        </p>
        {q.isLoading && <Skeleton className="h-3 w-32" />}
        {q.error && <p className="text-xs text-destructive">Couldn't locate {oc}.</p>}
      </div>

      <StationsPanel
        lat={q.data?.latitude}
        lng={q.data?.longitude}
        limit={5}
        title="Nearest stations"
      />

      <SchoolsPanel postcode={oc} radiusKm={2} limit={5} title="Nearest schools (2km)" />
    </div>
  );
}
