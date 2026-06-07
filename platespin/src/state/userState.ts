import type { CuisineId, DietId, SavedLocation, UserState } from "@/contract/types";
import { DEFAULT_SELECTED } from "@/data/cuisines";

// Typed localStorage. No backend in v1. Versioned so the shape can evolve safely.

const KEY = "platespin:user:v1";
const RECENT_MAX = 4;

function defaultState(): UserState {
  return {
    spin: { selected: [...DEFAULT_SELECTED], recentResults: [] },
    diet: { profile: [], strictness: "any" },
    liked: [],
    visited: [],
  };
}

export function loadUserState(): UserState {
  if (typeof localStorage === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<UserState>;
    const base = defaultState();
    // Defensive merge — never trust persisted shape across versions.
    return {
      spin: {
        selected: parsed.spin?.selected ?? base.spin.selected,
        lastResult: parsed.spin?.lastResult,
        recentResults: parsed.spin?.recentResults ?? [],
      },
      diet: {
        profile: parsed.diet?.profile ?? [],
        strictness: parsed.diet?.strictness ?? "any",
      },
      lastLocation: parsed.lastLocation,
      liked: parsed.liked ?? [],
      visited: parsed.visited ?? [],
    };
  } catch {
    return defaultState();
  }
}

export function saveUserState(state: UserState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — fail silently, app still works in-memory */
  }
}

// ── Pure reducers (return new state; caller persists) ────────────────────────

export function toggleCuisine(state: UserState, id: CuisineId): UserState {
  const has = state.spin.selected.includes(id);
  const selected = has
    ? state.spin.selected.filter((c) => c !== id)
    : [...state.spin.selected, id];
  return { ...state, spin: { ...state.spin, selected } };
}

export function toggleDiet(state: UserState, id: DietId): UserState {
  const has = state.diet.profile.includes(id);
  const profile = has
    ? state.diet.profile.filter((d) => d !== id)
    : [...state.diet.profile, id];
  return { ...state, diet: { ...state.diet, profile } };
}

export function setDietStrictness(state: UserState, strictness: "only" | "any"): UserState {
  return { ...state, diet: { ...state.diet, strictness } };
}

export function recordSpinResult(state: UserState, result: CuisineId): UserState {
  const recentResults = [result, ...state.spin.recentResults.filter((c) => c !== result)].slice(
    0,
    RECENT_MAX,
  );
  return { ...state, spin: { ...state.spin, lastResult: result, recentResults } };
}

export function setLastLocation(state: UserState, loc: SavedLocation): UserState {
  return { ...state, lastLocation: loc };
}

export function toggleLiked(state: UserState, id: string): UserState {
  const has = state.liked.includes(id);
  return { ...state, liked: has ? state.liked.filter((x) => x !== id) : [...state.liked, id] };
}

export function markVisited(state: UserState, id: string): UserState {
  if (state.visited.includes(id)) return state;
  return { ...state, visited: [...state.visited, id] };
}
