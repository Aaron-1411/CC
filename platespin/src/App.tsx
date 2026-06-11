import { useCallback, useEffect, useMemo, useState } from "react";
import type { CuisineId, UserState } from "@/contract/types";
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
import { CuisinePicker } from "@/features/wheel/CuisinePicker";
import { Wheel } from "@/features/wheel/Wheel";
import { useSpin } from "@/features/wheel/useSpin";
import { useAvailability } from "@/features/wheel/useAvailability";
import { DietProfile } from "@/features/diet/DietProfile";
import { LocationInput } from "@/features/location/LocationInput";
import { SpinResultCard } from "@/features/results/SpinResultCard";
import { ResultsList } from "@/features/results/ResultsList";

export default function App() {
  const [state, setState] = useState<UserState>(() => loadUserState());

  // Persist on every change.
  useEffect(() => saveUserState(state), [state]);

  // Honest wheel: pre-flight the area (one cached Overpass call) so the wheel
  // only spins to cuisines that actually have nearby, diet-compliant results.
  // Until we have a real location/selection this is `undefined` (all in play).
  const { availability, places, degraded } = useAvailability(
    state.lastLocation,
    state.spin.selected,
    state.diet.profile,
    state.diet.strictness,
  );

  const onResult = useCallback((id: CuisineId) => {
    setState((s) => recordSpinResult(s, id));
  }, []);

  const handleToggleLike = useCallback((id: string) => {
    setState((s) => toggleLiked(s, id));
  }, []);

  const handleVisit = useCallback((id: string) => {
    setState((s) => markVisited(s, id));
  }, []);

  const wheel = useSpin(state.spin.selected, state.spin.recentResults, availability, onResult);

  const handleRespin = useCallback(() => {
    wheel.reset();
    wheel.spin();
  }, [wheel]);

  const handleRespinWithout = useCallback(() => {
    if (wheel.result) {
      setState((s) => toggleCuisine(s, wheel.result!));
    }
    wheel.reset();
    // Let the selection update flush before spinning again.
    setTimeout(() => wheel.spin(), 0);
  }, [wheel]);

  const selectedCount = state.spin.selected.length;
  const canShowWheel = selectedCount > 0;

  // Does the landed cuisine have real in-app places? Drives whether SpinResultCard
  // shows its compact hero (yes) or the deep-link fallback grid (no).
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
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 pb-12 pt-6">
      <header className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-50">
          Plate<span className="text-amber-300">Spin</span>
        </h1>
        <p className="mt-0.5 text-sm text-slate-400">Can't decide where to eat? Spin for it.</p>
      </header>

      <LocationInput value={state.lastLocation} onSet={(loc) => setState((s) => setLastLocation(s, loc))} />

      {degraded && (
        <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-200/90">
          Live place data is temporarily unavailable — the wheel still spins, and
          deep-links out work as normal.
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

      <footer className="mt-auto pt-6 text-center text-[11px] leading-relaxed text-slate-600">
        Place data © OpenStreetMap contributors. Free · no login · no tracking.
      </footer>
    </div>
  );
}
