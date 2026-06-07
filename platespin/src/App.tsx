import { useCallback, useEffect, useMemo, useState } from "react";
import type { AvailabilityMap, CuisineId, UserState } from "@/contract/types";
import {
  loadUserState,
  recordSpinResult,
  saveUserState,
  setDietStrictness,
  setLastLocation,
  toggleCuisine,
  toggleDiet,
} from "@/state/userState";
import { CuisinePicker } from "@/features/wheel/CuisinePicker";
import { Wheel } from "@/features/wheel/Wheel";
import { useSpin } from "@/features/wheel/useSpin";
import { DietProfile } from "@/features/diet/DietProfile";
import { LocationInput } from "@/features/location/LocationInput";
import { SpinResultCard } from "@/features/results/SpinResultCard";

export default function App() {
  const [state, setState] = useState<UserState>(() => loadUserState());

  // Persist on every change.
  useEffect(() => saveUserState(state), [state]);

  // Phase 2 has no API → availability is unknown (every selected cuisine is "in
  // play"). Phase 3 fills this from a cached Overpass pre-flight so the wheel
  // only spins to cuisines that actually have nearby, diet-compliant results.
  const availability: AvailabilityMap | undefined = undefined;

  const onResult = useCallback((id: CuisineId) => {
    setState((s) => recordSpinResult(s, id));
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

  const headerSub = useMemo(
    () =>
      selectedCount === 0
        ? "Pick a few cuisines to get started"
        : `${selectedCount} cuisine${selectedCount === 1 ? "" : "s"} in play`,
    [selectedCount],
  );

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 pb-12 pt-6">
      <header className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-50">
          Plate<span className="text-amber-300">Spin</span>
        </h1>
        <p className="mt-0.5 text-sm text-slate-400">Can't decide where to eat? Spin for it.</p>
      </header>

      <LocationInput value={state.lastLocation} onSet={(loc) => setState((s) => setLastLocation(s, loc))} />

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
            <SpinResultCard
              result={wheel.result}
              location={state.lastLocation}
              diets={state.diet.profile}
              onRespin={handleRespin}
              onRespinWithout={handleRespinWithout}
            />
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
