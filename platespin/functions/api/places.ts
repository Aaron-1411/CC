// Cloudflare Pages Function — restaurant POIs via OpenStreetMap Overpass.
//
// Route: GET /api/places?lat&lng&radius&cuisines&diets&strictness&openNowOnly&limit
// Returns: { results: PlaceResult[], count, degraded?: boolean }
//
// Guardrails (per spec + critique):
//  - Snap center to a coarse grid (~3 dp) so nearby searches SHARE one cache entry.
//  - Cache 1h on Cloudflare's edge (Cache API) — public Overpass is a community
//    resource, never an app backend, so we must not hammer it.
//  - Try multiple Overpass mirrors; on total failure return 200 + degraded:true
//    (empty results) so the client degrades gracefully instead of erroring.

import type { CuisineId, DietId, PlaceResult } from "../../src/contract/types";
import { buildOverpassQuery, isDietCompliant, normaliseOverpass } from "../../src/data/osm";
import { rankPlaces } from "../../src/data/ranking";

interface Env {}

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const CACHE_SECONDS = 3600; // 1h
const VALID_CUISINES = new Set<string>([
  "italian", "pizza", "indian", "chinese", "japanese", "thai", "mexican", "turkish",
  "greek", "american", "burger", "british", "korean", "vietnamese", "spanish", "french",
  "lebanese", "ethiopian", "caribbean", "seafood",
]);
const VALID_DIETS = new Set<string>([
  "vegetarian", "vegan", "pescatarian", "halal", "kosher", "gluten_free", "dairy_free", "nut_free",
]);

function snap(n: number): number {
  return Math.round(n * 1000) / 1000; // ~110m grid
}

function json(body: unknown, status = 200, maxAge = 0): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": maxAge ? `public, max-age=${maxAge}` : "no-store",
    },
  });
}

async function fetchOverpass(query: string): Promise<{ elements?: unknown[] } | null> {
  for (const url of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": "PlateSpin/0.1 (+https://platespin-app.pages.dev)",
        },
        body: "data=" + encodeURIComponent(query),
      });
      if (!res.ok) continue;
      return (await res.json()) as { elements?: unknown[] };
    } catch {
      // try next mirror
    }
  }
  return null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const p = url.searchParams;

  const lat = Number(p.get("lat"));
  const lng = Number(p.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return json({ error: "invalid lat/lng" }, 400);
  }

  const radius = Math.max(200, Math.min(Number(p.get("radius")) || 2000, 20000));
  const cuisines = (p.get("cuisines") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => VALID_CUISINES.has(s)) as CuisineId[];
  if (cuisines.length === 0) return json({ error: "no valid cuisines" }, 400);

  const diets = (p.get("diets") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => VALID_DIETS.has(s)) as DietId[];
  const strictness = p.get("strictness") === "only" ? "only" : "any";
  const limit = Math.max(1, Math.min(Number(p.get("limit")) || 60, 120));

  // ── Edge cache (snapped key so nearby searches collide on purpose) ──────────
  const center = { lat: snap(lat), lng: snap(lng) };
  const keyUrl = new URL(url.origin + "/api/places");
  keyUrl.searchParams.set("lat", String(center.lat));
  keyUrl.searchParams.set("lng", String(center.lng));
  keyUrl.searchParams.set("radius", String(radius));
  keyUrl.searchParams.set("cuisines", [...cuisines].sort().join(","));
  keyUrl.searchParams.set("diets", [...diets].sort().join(","));
  keyUrl.searchParams.set("strictness", strictness);
  const cacheKey = new Request(keyUrl.toString());
  const cache = (caches as unknown as { default: Cache }).default;

  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  // ── Live Overpass ───────────────────────────────────────────────────────────
  const query = buildOverpassQuery(center, radius, cuisines);
  const raw = await fetchOverpass(query);
  if (!raw) {
    // Upstream down — degrade gracefully, don't cache the failure.
    return json({ results: [], count: 0, degraded: true }, 200);
  }

  let results: PlaceResult[] = normaliseOverpass(raw as { elements?: never }, center);
  if (diets.length) results = results.filter((r) => isDietCompliant(r, diets, strictness));
  results = rankPlaces(results, diets).slice(0, limit);

  const res = json({ results, count: results.length }, 200, CACHE_SECONDS);
  context.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
};
