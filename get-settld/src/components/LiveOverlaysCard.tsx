// Live data overlays: flood risk (Environment Agency) + nearest schools (Ofsted/GIAS).
// Drop in next to any postcode-driven view to add real-world risk context.
//
// UX hardening:
// - Persists last postcode to localStorage + syncs ?pc= in URL for shareable state.
// - Distinct loading / empty / error states with retry affordance.
// - Validates postcode shape client-side before firing requests.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Droplets, GraduationCap, AlertTriangle, RefreshCw, MapPin } from "lucide-react";
import { useFloodRisk, useSchools } from "@/hooks/use-area-overlays";
import { usePostcodeLookup } from "@/hooks/use-postcode-lookup";
import StationsPanel from "@/components/StationsPanel";

interface Props {
  postcode?: string;
  showInput?: boolean;
}

const STORAGE_KEY = "ftb:lastPostcode";
const POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

export default function LiveOverlaysCard({ postcode: initialPostcode, showInput = true }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const seed =
    initialPostcode ??
    searchParams.get("pc") ??
    (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) ?? "" : "");
  const [postcode, setPostcode] = useState(seed);
  const trimmed = postcode.trim().toUpperCase();
  const valid = POSTCODE_RE.test(trimmed);

  // Persist when valid
  useEffect(() => {
    if (!valid) return;
    try { localStorage.setItem(STORAGE_KEY, trimmed); } catch { /* ignore */ }
    if (showInput && searchParams.get("pc") !== trimmed) {
      const next = new URLSearchParams(searchParams);
      next.set("pc", trimmed);
      setSearchParams(next, { replace: true });
    }
  }, [trimmed, valid, showInput, searchParams, setSearchParams]);

  const flood = useFloodRisk(valid ? trimmed : undefined);
  const schools = useSchools(valid ? trimmed : undefined, 2);
  const pc = usePostcodeLookup(valid ? trimmed : null);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif font-bold text-brand text-lg">Live area overlays</h3>
        <Badge variant="outline" className="text-[10px]">Live data</Badge>
      </div>
      {showInput && (
        <div className="mb-4">
          <Label htmlFor="lo-postcode" className="text-xs flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Postcode
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              id="lo-postcode"
              placeholder="e.g. SW9 8DE"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              maxLength={10}
              className="max-w-[200px]"
              aria-invalid={postcode.length > 0 && !valid}
              aria-describedby="lo-postcode-help"
            />
            {valid && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { flood.refetch(); schools.refetch(); }}
                aria-label="Refresh live data"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p id="lo-postcode-help" className="text-[11px] text-muted-foreground mt-1">
            {postcode.length === 0
              ? "Enter a UK postcode to see flood and school data."
              : valid
                ? "Looks good — pulling live data."
                : "That doesn't look like a valid UK postcode yet."}
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Section
          icon={<Droplets className="h-4 w-4 text-brand" />}
          title="Flood warnings"
          empty={!valid}
          loading={flood.isLoading}
          error={flood.error?.message}
          onRetry={() => flood.refetch()}
        >
          {flood.data && (
            <div>
              <p className={`text-sm font-semibold ${flood.data.light === "red" ? "text-destructive" : flood.data.light === "amber" ? "text-warning" : "text-success"}`}>
                {flood.data.headline}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Source: Environment Agency</p>
            </div>
          )}
        </Section>

        <Section
          icon={<GraduationCap className="h-4 w-4 text-brand" />}
          title="Nearby schools"
          empty={!valid}
          loading={schools.isLoading}
          error={schools.error?.message}
          onRetry={() => schools.refetch()}
        >
          {schools.data && (
            <div>
              <p className="text-sm font-semibold text-foreground">{schools.data.headline}</p>
              {schools.data.schools.slice(0, 3).map((s) => (
                <p key={s.urn ?? s.name} className="text-[11px] text-muted-foreground truncate">
                  {s.name}{s.ofsted ? ` · ${s.ofsted}` : ""}{s.distanceKm != null ? ` · ${s.distanceKm}km` : ""}
                </p>
              ))}
              {schools.data.schools.length === 0 && (
                <p className="text-[11px] text-muted-foreground">No rated schools within 2km.</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">Source: Ofsted / GIAS</p>
            </div>
          )}
        </Section>
      </div>

      {valid && (
        <div className="mt-4 pt-4 border-t">
          <StationsPanel lat={pc.data?.latitude ?? null} lng={pc.data?.longitude ?? null} limit={5} />
        </div>
      )}
    </Card>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  empty: boolean;
  loading: boolean;
  error?: string;
  onRetry: () => void;
  children: React.ReactNode;
}

function Section({ icon, title, empty, loading, error, onRetry, children }: SectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
      </div>
      {empty ? (
        <p className="text-xs text-muted-foreground">Enter a postcode above to check.</p>
      ) : loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ) : error ? (
        <div className="text-xs text-destructive">
          <p className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Couldn't load. {error}
          </p>
          <Button variant="link" size="sm" className="h-auto px-0 text-xs" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
