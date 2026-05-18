// Commute estimator. Uses TfL Journey Planner (via edge function) for any
// journey where the destination is inside Greater London; falls back to a
// haversine speed model elsewhere. Public APIs only — no key needed.

import { supabase } from "@/integrations/supabase/client";

export type CommuteMode = "transit" | "drive" | "cycle" | "walk";
export type CommuteSource = "tfl" | "estimate";

export interface LatLng { lat: number; lng: number; }

export interface PlaceResolved {
  query: string;
  label: string;
  lat: number;
  lng: number;
  kind: "postcode" | "outcode";
}

export interface CommuteEstimate {
  mode: CommuteMode;
  minutes: number;
  km: number;
  confidence: "low" | "medium" | "high";
  source: CommuteSource;
}

const POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
const OUTCODE_RE  = /^[A-Z]{1,2}\d[A-Z\d]?$/i;

const CACHE_KEY = "settld-place-cache-v1";
type CacheShape = Record<string, PlaceResolved>;

function readCache(): CacheShape {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}
function writeCache(c: CacheShape) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

export async function resolvePlace(query: string): Promise<PlaceResolved | null> {
  const q = query.trim().toUpperCase().replace(/\s+/g, " ");
  if (!q) return null;
  const cache = readCache();
  if (cache[q]) return cache[q];

  let url: string | null = null;
  let kind: "postcode" | "outcode" = "postcode";
  if (POSTCODE_RE.test(q)) {
    url = `https://api.postcodes.io/postcodes/${encodeURIComponent(q)}`;
    kind = "postcode";
  } else if (OUTCODE_RE.test(q)) {
    url = `https://api.postcodes.io/outcodes/${encodeURIComponent(q)}`;
    kind = "outcode";
  } else {
    url = `https://api.postcodes.io/places?q=${encodeURIComponent(q)}&limit=1`;
    kind = "outcode";
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const r = Array.isArray(data?.result) ? data.result[0] : data?.result;
    if (!r) return null;
    const lat = r.latitude ?? r.lat;
    const lng = r.longitude ?? r.lng ?? r.lon;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    const label =
      r.postcode ? `${r.postcode}` :
      r.outcode  ? `${r.outcode} (${r.admin_district ?? r.region ?? "UK"})` :
      r.name_1   ? `${r.name_1}` : q;
    const resolved: PlaceResolved = { query: q, label, lat, lng, kind };
    cache[q] = resolved;
    writeCache(cache);
    return resolved;
  } catch {
    return null;
  }
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sa));
}

// Greater London bounding box (approx). If either origin or destination falls
// inside, we ask TfL — its planner covers all London modes plus National Rail.
const LDN_BOUNDS = { minLat: 51.28, maxLat: 51.70, minLng: -0.51, maxLng: 0.34 };
function inLondon({ lat, lng }: LatLng) {
  return lat >= LDN_BOUNDS.minLat && lat <= LDN_BOUNDS.maxLat &&
         lng >= LDN_BOUNDS.minLng && lng <= LDN_BOUNDS.maxLng;
}

function heuristic(origin: LatLng, dest: LatLng): CommuteEstimate[] {
  const km = haversineKm(origin, dest) * 1.25;
  const transit = Math.round((km / 32) * 60 + 10);
  const drive   = Math.round((km / 38) * 60 + 5);
  const cycle   = Math.round((km / 16) * 60 + 2);
  const walk    = Math.round((km / 5) * 60);
  return [
    { mode: "transit", minutes: transit, km, confidence: "low", source: "estimate" },
    { mode: "drive",   minutes: drive,   km, confidence: "low", source: "estimate" },
    { mode: "cycle",   minutes: cycle,   km, confidence: "medium", source: "estimate" },
    { mode: "walk",    minutes: walk,    km, confidence: "medium", source: "estimate" },
  ];
}

interface TflResp { transit: number | null; cycle: number | null; walk: number | null; }

async function callTfl(origin: LatLng, dest: LatLng): Promise<TflResp | null> {
  try {
    const { data, error } = await supabase.functions.invoke<TflResp>("tfl-journey", {
      body: { from: `${origin.lat},${origin.lng}`, to: `${dest.lat},${dest.lng}` },
    });
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Door-to-door times. Async because we may call TfL for London journeys.
 * Always returns all 4 modes; falls back to heuristic per-mode where TfL
 * has no data. Drive is always heuristic (TfL doesn't route private cars).
 */
export async function estimateTimes(origin: LatLng, dest: LatLng): Promise<CommuteEstimate[]> {
  const baseline = heuristic(origin, dest);
  const useTfl = inLondon(origin) || inLondon(dest);
  if (!useTfl) return baseline;

  const tfl = await callTfl(origin, dest);
  if (!tfl) return baseline;

  const km = haversineKm(origin, dest) * 1.25;
  const merge = (mode: CommuteMode, mins: number | null): CommuteEstimate => {
    if (mins != null && mins > 0) {
      return { mode, minutes: Math.round(mins), km, confidence: "high", source: "tfl" };
    }
    return baseline.find((b) => b.mode === mode)!;
  };
  return [
    merge("transit", tfl.transit),
    baseline.find((b) => b.mode === "drive")!, // always heuristic
    merge("cycle", tfl.cycle),
    merge("walk", tfl.walk),
  ];
}

export async function resolveAreaCentroid(areaId: string): Promise<LatLng | null> {
  const place = await resolvePlace(areaId.toUpperCase());
  return place ? { lat: place.lat, lng: place.lng } : null;
}

export const MODE_LABEL: Record<CommuteMode, string> = {
  transit: "Public transport",
  drive: "Drive",
  cycle: "Cycle",
  walk: "Walk",
};
