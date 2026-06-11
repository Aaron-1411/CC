import { useEffect, useMemo, useState } from "react";
import type { PlaceResult, SavedLocation, VenueLite } from "@/contract/types";
import { fetchPlaces } from "@/data/api";
import { CUISINES, CUISINE_BY_ID } from "@/data/cuisines";

const ALL_CUISINES = CUISINES.map((c) => c.id);

function toVenue(p: PlaceResult): VenueLite {
  return {
    id: p.id,
    name: p.name,
    location: p.location,
    address: p.address,
    cuisines: p.cuisine,
  };
}

export function VenuePicker({
  location,
  onPick,
}: {
  location: SavedLocation;
  onPick: (v: VenueLite) => void;
}) {
  const [places, setPlaces] = useState<PlaceResult[] | null>(null);
  const [q, setQ] = useState("");
  const [degraded, setDegraded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPlaces(null);
    setDegraded(false);
    fetchPlaces({
      center: location.center,
      radiusMeters: 3000,
      cuisines: ALL_CUISINES,
      strictness: "any",
      limit: 50,
    })
      .then((r) => {
        if (cancelled) return;
        setPlaces(r.results);
        setDegraded(Boolean(r.degraded));
      })
      .catch(() => {
        if (cancelled) return;
        setPlaces([]);
        setDegraded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [location.center.lat, location.center.lng]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = places ?? [];
    return (t ? list.filter((p) => p.name.toLowerCase().includes(t)) : list).slice(0, 40);
  }, [q, places]);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search nearby restaurants by name"
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-300/40 focus:outline-none"
      />
      {places === null && <p className="py-4 text-center text-sm text-slate-500">Finding places…</p>}
      {degraded && places && places.length === 0 && (
        <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-200/90">
          Couldn't load nearby places right now. Try a different location or come back shortly.
        </p>
      )}
      {places && places.length > 0 && (
        <ul className="max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02]">
          {filtered.map((p) => {
            const cuisine = p.cuisine[0] ? CUISINE_BY_ID[p.cuisine[0]] : undefined;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPick(toVenue(p))}
                  className="flex w-full items-center justify-between gap-2 border-b border-white/5 px-3 py-2.5 text-left last:border-b-0 hover:bg-white/5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-100">{p.name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {cuisine ? `${cuisine.emoji} ${cuisine.label}` : ""}
                      {p.distanceMeters != null
                        ? `${cuisine ? " · " : ""}${Math.round(p.distanceMeters)}m`
                        : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-amber-300">＋</span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-3 py-3 text-center text-sm text-slate-500">No matches.</li>
          )}
        </ul>
      )}
    </div>
  );
}
