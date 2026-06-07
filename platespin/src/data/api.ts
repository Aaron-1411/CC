import type { CuisineId, DietId, LatLng, PlaceResult } from "@/contract/types";

// Client-side fetch wrappers for the Pages Functions proxies. Every call fails
// SOFT: on network/HTTP error we return an empty/degraded result rather than
// throwing, so the UI never hard-crashes when an upstream is down — it just
// shows fewer options (honest degradation, matching the server's degraded flag).

export interface PlacesResponse {
  results: PlaceResult[];
  count: number;
  degraded?: boolean;
}

export interface GeoSuggestion {
  label: string;
  center: LatLng;
}

export interface FetchPlacesParams {
  center: LatLng;
  radiusMeters?: number;
  cuisines: CuisineId[];
  diets?: DietId[];
  strictness?: "only" | "any";
  limit?: number;
  signal?: AbortSignal;
}

export async function fetchPlaces(params: FetchPlacesParams): Promise<PlacesResponse> {
  const { center, radiusMeters = 2000, cuisines, diets = [], strictness = "any", limit, signal } = params;
  if (cuisines.length === 0) return { results: [], count: 0 };
  const q = new URLSearchParams({
    lat: String(center.lat),
    lng: String(center.lng),
    radius: String(radiusMeters),
    cuisines: cuisines.join(","),
    strictness,
  });
  if (diets.length) q.set("diets", diets.join(","));
  if (limit) q.set("limit", String(limit));
  try {
    const res = await fetch(`/api/places?${q.toString()}`, { signal });
    if (!res.ok) return { results: [], count: 0, degraded: true };
    return (await res.json()) as PlacesResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    return { results: [], count: 0, degraded: true };
  }
}

export async function fetchGeocode(query: string, signal?: AbortSignal): Promise<GeoSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: GeoSuggestion[] };
    return data.results ?? [];
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    return [];
  }
}
