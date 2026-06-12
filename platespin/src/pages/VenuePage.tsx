import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { VenueAggregate } from "@/contract/types";
import { getVenue } from "@/data/social";
import { CUISINE_BY_ID } from "@/data/cuisines";
import { useAuth } from "@/auth/AuthContext";
import { MealCard } from "@/features/social/MealCard";
import { RatingStars } from "@/features/social/RatingStars";

export function VenuePage() {
  const [params] = useSearchParams();
  const id = params.get("id") || "";
  const { user } = useAuth();
  const [data, setData] = useState<VenueAggregate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No venue specified");
      return;
    }
    let c = false;
    setData(null);
    setError(null);
    getVenue(id)
      .then((d) => !c && setData(d))
      .catch((e) => !c && setError(e instanceof Error ? e.message : "Venue not found"));
    return () => {
      c = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="pt-10 text-center">
        <p className="text-sm text-slate-400">{error}</p>
        <Link to="/discover" className="mt-3 inline-block text-sm text-amber-300">
          Find places to eat
        </Link>
      </div>
    );
  }
  if (!data) return <p className="py-10 text-center text-sm text-slate-500">Loading…</p>;

  const { venue, stats, meals } = data;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    venue.name,
  )}%20${venue.location.lat},${venue.location.lng}`;
  // Zero-API booking: OpenTable search keyed on name + locality. Honest deep-link —
  // it finds a reservation page where one exists, never claims a guaranteed table.
  const reserveUrl = `https://www.opentable.com/s?term=${encodeURIComponent(
    `${venue.name} ${venue.address ?? ""}`.trim(),
  )}`;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-50">{venue.name}</h1>
        <p className="text-sm text-slate-500">
          {venue.cuisines
            .map((c) => CUISINE_BY_ID[c])
            .filter(Boolean)
            .map((c) => `${c.emoji} ${c.label}`)
            .join(" · ")}
          {venue.address ? (venue.cuisines.length ? " · " : "") + venue.address : ""}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          {stats.count > 0 ? (
            <div className="flex items-center gap-2">
              <RatingStars value={stats.avg} size={18} />
              <span className="text-sm font-semibold text-slate-100">{stats.avg.toFixed(1)}</span>
              <span className="text-xs text-slate-500">
                ({stats.count} review{stats.count === 1 ? "" : "s"})
              </span>
            </div>
          ) : (
            <span className="text-sm text-slate-400">No PlateSpin reviews yet.</span>
          )}
          {stats.friendCount ? (
            <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-xs text-amber-200">
              Friends: {stats.friendAvg?.toFixed(1)} ★ ({stats.friendCount})
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Link
            to="/compose"
            state={{ venue }}
            className="flex min-h-[44px] items-center justify-center rounded-xl bg-amber-300 px-4 text-center text-sm font-bold text-slate-900 transition active:scale-[0.98]"
          >
            {user ? "I ate here" : "Sign in to review"}
          </Link>
          <div className="flex gap-2">
            <a
              href={reserveUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-300 px-3 text-center text-sm font-bold text-slate-900 transition active:scale-[0.98]"
            >
              🍽️ Book a table
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 px-3 text-center text-sm font-semibold text-slate-300"
            >
              🗺️ Map
            </a>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Recent meals here</h2>
        {meals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
            Be the first to log a meal here.
          </p>
        ) : (
          meals.map((m) => <MealCard key={m.id} meal={m} />)
        )}
      </section>
    </div>
  );
}
