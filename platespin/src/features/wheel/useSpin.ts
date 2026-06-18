import { useCallback, useMemo, useRef, useState } from "react";
import type { AvailabilityMap, CuisineId } from "@/contract/types";
import { buildSlices, computeSpin, pickTargetIndex, type WheelSlice } from "@/features/wheel/spin";

const SPIN_MS = 2900;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface UseSpin {
  slices: WheelSlice[];
  rotation: number;
  spinning: boolean;
  durationMs: number;
  result?: CuisineId;
  canSpin: boolean;
  spin: () => void;
  onTransitionEnd: () => void;
  reset: () => void;
}

/**
 * Owns the wheel's transient animation state. Persistent state (selected,
 * recentResults) lives in UserState; this hook just reads it and reports the
 * landed result back via onResult so the caller can persist + act.
 */
export function useSpin(
  selected: CuisineId[],
  recentResults: CuisineId[],
  availability: AvailabilityMap | undefined,
  onResult: (id: CuisineId) => void,
): UseSpin {
  const slices = useMemo(() => buildSlices(selected, availability), [selected, availability]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<CuisineId | undefined>(undefined);
  const pendingIndex = useRef<number | null>(null);

  const availableCount = slices.filter((s) => s.available).length;
  const canSpin = availableCount > 0 && !spinning;

  const settle = useCallback(
    (index: number) => {
      const landed = slices[index]?.id;
      pendingIndex.current = null;
      setSpinning(false);
      if (landed) {
        setResult(landed);
        onResult(landed);
      }
    },
    [slices, onResult],
  );

  const spin = useCallback(() => {
    if (slices.filter((s) => s.available).length === 0 || spinning) return;
    setResult(undefined);
    const index = pickTargetIndex(slices, recentResults);

    if (prefersReducedMotion()) {
      // No animation — snap to the result and settle immediately.
      const { rotation: next } = computeSpin(index, slices.length, rotation, 0);
      setRotation(next);
      settle(index);
      return;
    }

    const { rotation: next } = computeSpin(index, slices.length, rotation);
    pendingIndex.current = index;
    setSpinning(true);
    setRotation(next);
  }, [slices, recentResults, rotation, spinning, settle]);

  const onTransitionEnd = useCallback(() => {
    if (pendingIndex.current !== null) settle(pendingIndex.current);
  }, [settle]);

  const reset = useCallback(() => setResult(undefined), []);

  return {
    slices,
    rotation,
    spinning,
    durationMs: SPIN_MS,
    result,
    canSpin,
    spin,
    onTransitionEnd,
    reset,
  };
}
