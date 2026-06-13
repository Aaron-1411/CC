import { useEffect, useMemo, useState } from "react";
import type { CuisineId, DietId, PlaceResult, VenueStats } from "@/contract/types";
import { CUISINE_BY_ID } from "@/data/cuisines";
import { getVenueStats } from "@/data/social";
import { PlaceCard } from "@/features/results/PlaceCard";

interface ResultsListProps {
  cuisine: CuisineId;
  places: PlaceResult[]; // the pre-flight pool (already ranked + diet-filtered)
  diets: DietId[];
  likedIds: string[];
  onToggleLike: (id: string) => void;
  onVisit: (id: string) => void;
}

const MAX_SHOWN = 12;

// Shows the actual nearby places for the cuisine the wheel landed on. Reuses the
// pre-flight pool (no extra request) and filters to this cuisine, preserving the
// server's ranking. Falls back gracefully when the pool has no match (the spin
// card above still offers deep-links out).
export function ResultsList({ cuisine, places, diets, likedIds, onToggleLike, onVisit }: ResultsListProps) {
  const matches = useMemo(
    () => places.filter((p) => p.cuisine.includes(cuisine)).slice(0, MAX_SHOWN),
    [places, cuisine],
  );

  // Pull PlateSpin's OWN community ratings for the shown venues — the only rating
  // source that's genuinely reliable AND $0 (no card-backed Google/TripAdvisor key).
  const [statsById, setStatsById] = useState<Record<string, VenueStats>>({});
  useEffect(() => {
    const ids = matches.map((p) => p.id);
    if (ids.length === 0) return;
    let alive = true;
    getVenueStats(ids)
      .then((rows) => {
        if (!alive) return;
        const map: Record<string, VenueStats> = {};
        for (const r of rows) map[r.id] = r;
        setStatsById(map);
      })
      .catch(() => {
        /* ratings are additive — a failed fetch just means no community badge */
      });
    return () => {
      alive = false;
    };
  }, [matches]);

  const c = CUISINE_BY_ID[cuisine];
  if (matches.length === 0) return null;

  const liked = new Set(likedIds);

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-300">
          {c?.emoji} {c?.label} near you
        </h2>
        <span className="text-xs text-slate-500">
          {matches.length}
          {matches.length === MAX_SHOWN ? "+" : ""} found
        </span>
      </div>
      <ul className="space-y-2.5">
        {matches.map((p) => (
          <PlaceCard
            key={p.id}
            place={p}
            diets={diets}
            stats={statsById[p.id]}
            liked={liked.has(p.id)}
            onToggleLike={onToggleLike}
            onVisit={onVisit}
          />
        ))}
      </ul>
    </section>
  );
}
