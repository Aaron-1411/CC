import { useEffect, useRef, useState } from "react";
import type { AvailabilityMap, CuisineId, DietId, SavedLocation } from "@/contract/types";
import { fetchPlaces } from "@/data/api";
import { countByCuisine } from "@/data/ranking";

// Pre-flight the area to power the HONEST WHEEL. One /api/places call for ALL
// selected cuisines at once → count compliant results per cuisine → AvailabilityMap.
// The wheel then excludes 0-count cuisines so it never spins to a dead end.
//
// Returns `undefined` (not {}) while we don't yet know — no location, no
// selection, or first load in flight — so the wheel falls back to "all in play"
// rather than wrongly showing every cuisine as unavailable.

const PREFLIGHT_LIMIT = 120; // cap matches the server; enough to count coverage.

function hasRealCenter(loc?: SavedLocation): loc is SavedLocation {
  return !!loc && (loc.center.lat !== 0 || loc.center.lng !== 0);
}

export interface AvailabilityState {
  availability: AvailabilityMap | undefined;
  loading: boolean;
  degraded: boolean;
}

export function useAvailability(
  location: SavedLocation | undefined,
  selected: CuisineId[],
  diets: DietId[],
  strictness: "only" | "any",
): AvailabilityState {
  const [availability, setAvailability] = useState<AvailabilityMap | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [degraded, setDegraded] = useState(false);

  // Stable key for the dependency: only re-run when something material changes.
  const key = hasRealCenter(location)
    ? [
        location.center.lat.toFixed(3),
        location.center.lng.toFixed(3),
        [...selected].sort().join(","),
        [...diets].sort().join(","),
        strictness,
      ].join("|")
    : "";

  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!hasRealCenter(location) || selected.length === 0) {
      setAvailability(undefined);
      setDegraded(false);
      return;
    }
    if (key === lastKey.current) return;
    lastKey.current = key;

    const controller = new AbortController();
    setLoading(true);
    fetchPlaces({
      center: location.center,
      cuisines: selected,
      diets,
      strictness,
      limit: PREFLIGHT_LIMIT,
      signal: controller.signal,
    })
      .then((resp) => {
        const counts = countByCuisine(resp.results);
        // Ensure every selected cuisine has an explicit entry (0 if absent), so
        // the wheel can distinguish "known-empty" from "unknown".
        const map: AvailabilityMap = {};
        for (const c of selected) map[c] = counts[c] ?? 0;
        setAvailability(map);
        setDegraded(!!resp.degraded);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAvailability(undefined);
        setDegraded(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [key, location, selected, diets, strictness]);

  return { availability, loading, degraded };
}
