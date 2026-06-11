import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CuisineId, PlaceResult, UserState, VenueStats } from "@/contract/types";
import {
  loadUserState,
  markVisited,
  recordSpinResult,
  saveUserState,
  setDietStrictness,
  setLastLocation,
  toggleCuisine,
  toggleDiet,
  toggleLiked,
} from "@/state/userState";
import { useAuth } from "@/auth/AuthContext";
import { getVenueStats } from "@/data/social";
import { CuisinePicker } from "@/features/wheel/CuisinePicker";
import { Wheel } from "@/features/wheel/Wheel";
import { useSpin } from "@/features/wheel/useSpin";
import { useAvailability } from "@/features/wheel/useAvailability";
import { DietProfile } from "@/features/diet/DietProfile";
import { LocationInput } from "@/features/location/LocationInput";
import { SpinResultCard } from "@/features/results/SpinResultCard";
import { ResultsList } from "@/features/results/ResultsList";
import { RatingStars } from "@/features/social/RatingStars";

// Slice E: pull PlateSpin/friend ratings for the visible places so discovery is
// friend-aware ("people you follow rated this 4.5"). Reads from /api/venue-stats.
function useVenueStats(places: PlaceResult[]): Map<string, VenueStats> {
  const [stats, setStats] = useState<Map<string, VenueStats>>(new Map());
  const ids = useMemo(() => places.slice(0, 60).map((p) => p.id), [places]);
  const key = ids.join(",");
  useEffect(() => {
    if (ids.length === 0) {
      setStats(new Map());
      return;
    }
    let cancelled = false;
    getVenueStats(ids)
      .then((rows) => {
        if (cancelled) return;
        setStats(new Map(rows.map((r) => [r.id, r])));
      })
      .catch(() => {
        /* social ratings are a bonus layer — ignore failures */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return stats;
}

function FriendPicksStrip({
  places,
  stats,
}: {
  places: PlaceResult[];
  stats: Map<string, VenueStats>;
}) {
  const rated = places
    .map((p) => ({ place: p, stat: stats.get(p.id) }))
    .filter((x): x is { place: PlaceResult; stat: VenueStats } => Boolean(x.stat && x.stat.count > 0))
    // friends' picks first, then most-reviewed
    .sort((a, b) => (b.stat.friendCount ?? 0) - (a.stat.friendCount ?? 0) || b.stat.count - a.stat.count)
    .slice(0, 10);
  if (rated.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-300">Rated on PlateSpin nearby</h2>
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
        {rated.map(({ place, stat }) => (
          <Link
            key={place.id}
            to={`/venue?id=${encodeURIComponent(place.id)}`}
            className="w-40 shrink-0 snap-start rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <p className="truncate text-sm font-semibold text-slate-100">{place.name}</p>
            <div className="mt-1 flex items-center gap-1">
              <RatingStars value={stat.friendAvg ?? stat.avg} size={13} />
              <span className="text-xs text-slate-400">{(stat.friendAvg ?? stat.avg).toFixed(1)}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {stat.friendCount
                ? `${stat.friendCount} from friends`
                : `${stat.count} review${stat.count === 1 ? "" : "s"}`}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function DiscoverPage() {
  const { user } = useAuth();
  const [state, setState] = useState<UserState>(() => loadUserState());
  useEffect(() => saveUserState(state), [state]);

  const { availability, places, degraded } = useAvailability(
    state.lastLocation,
    state.spin.selected,
    state.diet.profile,
    state.diet.strictness,
  );

  const venueStats = useVenueStats(places);

  const onResult = useCallback((id: CuisineId) => {
    setState((s) => recordSpinResult(s, id));
  }, []);
  const handleToggleLike = useCallback((id: string) => setState((s) => toggleLiked(s, id)), []);
  const handleVisit = useCallback((id: string) => setState((s) => markVisited(s, id)), []);

  const wheel = useSpin(state.spin.selected, state.spin.recentResults, availability, onResult);

  const handleRespin = useCallback(() => {
    wheel.reset();
    wheel.spin();
  }, [wheel]);

  const handleRespinWithout = useCallback(() => {
    if (wheel.result) setState((s) => toggleCuisine(s, wheel.result!));
    wheel.reset();
    setTimeout(() => wheel.spin(), 0);
  }, [wheel]);

  const selectedCount = state.spin.selected.length;
  const canShowWheel = selectedCount > 0;

  const resultHasPlaces = useMemo(
    () => (wheel.result ? places.some((p) => p.cuisine.includes(wheel.result!)) : false),
    [wheel.result, places],
  );

  const headerSub = useMemo(() => {
    if (selectedCount === 0) return "Pick a few cuisines to get started";
    if (availability) {
      const live = state.spin.selected.filter((c) => (availability[c] ?? 0) > 0).length;
      return `${live} of ${selectedCount} available nearby`;
    }
    return `${selectedCount} cuisine${selectedCount === 1 ? "" : "s"} in play`;
  }, [selectedCount, availability, state.spin.selected]);

  return (
    <div className="flex flex-col gap-4">
      <header className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-50">
          Plate<span className="text-amber-300">Spin</span>
        </h1>
        <p className="mt-0.5 text-sm text-slate-400">Can't decide where to eat? Spin for it.</p>
      </header>

      {!user && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2.5">
          <p className="text-xs text-amber-100/90">
            Spin freely — no account needed. Sign in to post meals & follow friends.
          </p>
          <Link
            to="/login"
            className="shrink-0 rounded-full bg-amber-300 px-3 py-1.5 text-xs font-bold text-slate-900"
          >
            Sign in
          </Link>
        </div>
      )}

      <LocationInput value={state.lastLocation} onSet={(loc) => setState((s) => setLastLocation(s, loc))} />

      {degraded && (
        <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-200/90">
          Live place data is temporarily unavailable — the wheel still spins, and deep-links out work
          as normal.
        </p>
      )}

      <DietProfile
        profile={state.diet.profile}
        strictness={state.diet.strictness}
        onToggle={(id) => setState((s) => toggleDiet(s, id))}
        onStrictness={(st) => setState((s) => setDietStrictness(s, st))}
      />

      {canShowWheel ? (
        <>
          <Wheel
            slices={wheel.slices}
            rotation={wheel.rotation}
            spinning={wheel.spinning}
            durationMs={wheel.durationMs}
            onTransitionEnd={wheel.onTransitionEnd}
          />

          <button
            type="button"
            onClick={() => {
              wheel.reset();
              wheel.spin();
            }}
            disabled={!wheel.canSpin}
            className="min-h-[52px] w-full rounded-2xl bg-amber-300 text-lg font-extrabold text-slate-900 shadow-lg shadow-amber-300/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            {wheel.spinning ? "Spinning…" : "SPIN"}
          </button>

          {wheel.result && !wheel.spinning && (
            <>
              <SpinResultCard
                result={wheel.result}
                location={state.lastLocation}
                diets={state.diet.profile}
                hasResults={resultHasPlaces}
                onRespin={handleRespin}
                onRespinWithout={handleRespinWithout}
              />
              <ResultsList
                cuisine={wheel.result}
                places={places}
                diets={state.diet.profile}
                likedIds={state.liked}
                onToggleLike={handleToggleLike}
                onVisit={handleVisit}
              />
            </>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
          Select at least one cuisine below to build your wheel.
        </div>
      )}

      <FriendPicksStrip places={places} stats={venueStats} />

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Your cuisines</h2>
          <span className="text-xs text-slate-500">{headerSub}</span>
        </div>
        <CuisinePicker
          selected={state.spin.selected}
          availability={availability}
          onToggle={(id) => setState((s) => toggleCuisine(s, id))}
        />
      </section>
    </div>
  );
}
