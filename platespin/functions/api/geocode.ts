// Cloudflare Pages Function — forward geocoding (place text → coordinates).
//
// Route: GET /api/geocode?q=<text>&limit=<n>
// Returns: { results: GeoSuggestion[], degraded?: boolean }
//
// Guardrails (per spec + critique):
//  - Photon (komoot) is primary — purpose-built autocomplete, permissive use.
//  - Nominatim is the fallback — heavier, strict usage policy, so we only hit it
//    when Photon fails and we send a proper User-Agent (required by their policy).
//  - Cache 7 days on the edge (Cache API) keyed by normalised query — place
//    coordinates don't move, and this keeps us far under any rate limit.
//  - On total upstream failure return 200 + degraded:true (empty results) so the
//    client degrades gracefully (text-only location) instead of erroring.

interface Env {}

interface GeoSuggestion {
  label: string;
  center: { lat: number; lng: number };
}

const CACHE_SECONDS = 604800; // 7 days
const PHOTON_URL = "https://photon.komoot.io/api/";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const UA = "PlateSpin/0.1 (+https://platespin-app.pages.dev)";

function json(body: unknown, status = 200, maxAge = 0): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": maxAge ? `public, max-age=${maxAge}` : "no-store",
    },
  });
}

// ── Photon ───────────────────────────────────────────────────────────────────
interface PhotonFeature {
  geometry?: { coordinates?: [number, number] }; // [lng, lat]
  properties?: Record<string, string | undefined>;
}

function photonLabel(p: Record<string, string | undefined>): string {
  const parts = [
    p.name,
    p.street && !p.name ? p.street : undefined,
    p.city || p.county || p.locality,
    p.state,
    p.country,
  ].filter(Boolean);
  // De-dupe consecutive repeats (e.g. name === city).
  const seen: string[] = [];
  for (const part of parts as string[]) {
    if (seen[seen.length - 1] !== part) seen.push(part);
  }
  return seen.join(", ");
}

async function fetchPhoton(q: string, limit: number): Promise<GeoSuggestion[] | null> {
  try {
    const u = new URL(PHOTON_URL);
    u.searchParams.set("q", q);
    u.searchParams.set("limit", String(limit));
    const res = await fetch(u.toString(), { headers: { "user-agent": UA } });
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: PhotonFeature[] };
    const out: GeoSuggestion[] = [];
    for (const f of data.features ?? []) {
      const coords = f.geometry?.coordinates;
      const props = f.properties;
      if (!coords || !props) continue;
      const [lng, lat] = coords;
      const label = photonLabel(props);
      if (!label) continue;
      out.push({ label, center: { lat, lng } });
    }
    return out;
  } catch {
    return null;
  }
}

// ── Nominatim (fallback) ─────────────────────────────────────────────────────
interface NominatimItem {
  lat?: string;
  lon?: string;
  display_name?: string;
}

async function fetchNominatim(q: string, limit: number): Promise<GeoSuggestion[] | null> {
  try {
    const u = new URL(NOMINATIM_URL);
    u.searchParams.set("q", q);
    u.searchParams.set("format", "jsonv2");
    u.searchParams.set("limit", String(limit));
    u.searchParams.set("addressdetails", "0");
    const res = await fetch(u.toString(), { headers: { "user-agent": UA, "accept-language": "en" } });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimItem[];
    const out: GeoSuggestion[] = [];
    for (const item of data) {
      const lat = Number(item.lat);
      const lng = Number(item.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !item.display_name) continue;
      out.push({ label: item.display_name, center: { lat, lng } });
    }
    return out;
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (q.length < 3) return json({ results: [] }, 200);
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit")) || 5, 10));

  // ── Edge cache (normalised query key) ───────────────────────────────────────
  const keyUrl = new URL(url.origin + "/api/geocode");
  keyUrl.searchParams.set("q", q.toLowerCase());
  keyUrl.searchParams.set("limit", String(limit));
  const cacheKey = new Request(keyUrl.toString());
  const cache = (caches as unknown as { default: Cache }).default;

  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  // ── Live: Photon first, Nominatim fallback ──────────────────────────────────
  let results = await fetchPhoton(q, limit);
  if (results === null) results = await fetchNominatim(q, limit);
  if (results === null) {
    // Both upstreams down — degrade gracefully, don't cache the failure.
    return json({ results: [], degraded: true }, 200);
  }

  const res = json({ results }, 200, CACHE_SECONDS);
  context.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
};
