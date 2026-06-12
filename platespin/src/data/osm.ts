import type {
  CuisineId,
  DataQuality,
  DietAvailability,
  DietId,
  LatLng,
  PlaceLinks,
  PlaceResult,
} from "../contract/types";
import { CUISINE_BY_ID, OSM_VALUE_TO_CUISINE } from "./cuisines";
import { DIETS } from "./diets";

// Overpass query builder + normaliser. Pure functions, RELATIVE imports only, so
// this module bundles cleanly both in Vite (client) and in the Cloudflare Pages
// Functions esbuild bundler (server). Contract imports are type-only (erased).

const AMENITIES = ["restaurant", "fast_food", "cafe"];

// dietId → OSM tag suffix (e.g. "vegan" → diet:vegan). Built from the diet data.
const DIET_OSM_KEYS: Array<{ id: DietId; key: string }> = DIETS.filter((d) => d.osmKey).map(
  (d) => ({ id: d.id, key: d.osmKey as string }),
);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clampRadius(m: number): number {
  if (!Number.isFinite(m)) return 2000;
  return Math.max(200, Math.min(Math.round(m), 20000));
}

/** Build an Overpass QL query for the given cuisines within radius of center. */
export function buildOverpassQuery(center: LatLng, radiusMeters: number, cuisines: CuisineId[]): string {
  const values = new Set<string>();
  for (const id of cuisines) {
    const c = CUISINE_BY_ID[id];
    if (c) for (const v of c.osmValues) values.add(v);
  }
  const cuisineRegex = [...values].map(escapeRegex).join("|") || "restaurant";
  const r = clampRadius(radiusMeters);
  const { lat, lng } = center;
  return [
    "[out:json][timeout:25];",
    "(",
    `  nwr["amenity"~"^(${AMENITIES.join("|")})$"]["cuisine"~"${cuisineRegex}",i](around:${r},${lat},${lng});`,
    ");",
    "out center tags 120;",
  ].join("\n");
}

// ── Normalisation ────────────────────────────────────────────────────────────

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function normaliseDietValue(raw: string | undefined): DietAvailability | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase();
  if (v === "only") return "only";
  if (v === "yes") return "yes";
  if (v === "limited") return "limited";
  if (v === "no") return "no";
  return undefined;
}

function parseCuisines(raw: string | undefined): CuisineId[] {
  if (!raw) return [];
  const out = new Set<CuisineId>();
  for (const part of raw.toLowerCase().split(/[;,]/)) {
    const token = part.trim();
    if (!token) continue;
    // Exact match first (so multi-word values like "fish_and_chips" or "dim_sum"
    // resolve to their intended cuisine before any sub-token fallback).
    const id = OSM_VALUE_TO_CUISINE[token];
    if (id) {
      out.add(id);
      continue;
    }
    // Fallback: OSM cuisine values are free-form (e.g. "pizza_al_taglio",
    // "italian_pizza"). The Overpass query matches these by substring, so the
    // normaliser must too — split on separators and look up each sub-token.
    for (const word of token.split(/[_\s-]+/)) {
      const wid = OSM_VALUE_TO_CUISINE[word];
      if (wid) out.add(wid);
    }
  }
  return [...out];
}

function classifyQuality(tags: Record<string, string>, hasDiet: boolean): DataQuality {
  const hasHours = !!tags["opening_hours"];
  const hasWeb = !!(tags["website"] || tags["contact:website"]);
  if (hasHours || hasWeb || hasDiet) return "rich";
  if (tags["cuisine"]) return "basic";
  return "sparse";
}

const enc = encodeURIComponent;

/** OpenTable search deep-link — finds a reservation page for this venue. Zero-API. */
function buildReserveUrl(name: string, locality: string): string {
  const term = locality ? `${name} ${locality}` : name;
  return `https://www.opentable.com/s?term=${enc(term)}`;
}

function buildLinks(
  name: string,
  loc: LatLng,
  opts?: { website?: string; reserve?: string },
): PlaceLinks {
  const q = `${name}`;
  const at = `${loc.lat},${loc.lng}`;
  return {
    googleMaps: `https://www.google.com/maps/search/?api=1&query=${enc(q)}%20${at}`,
    tiktokSearch: `https://www.tiktok.com/search?q=${enc(q)}`,
    instagramSearch: `https://www.instagram.com/explore/search/keyword/?q=${enc(q)}`,
    youtubeSearch: `https://www.youtube.com/results?search_query=${enc(q)}`,
    website: opts?.website,
    reserve: opts?.reserve,
  };
}

function normaliseReservation(
  raw: string | undefined,
): "yes" | "no" | "required" | "recommended" | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase();
  if (v === "yes" || v === "no" || v === "required" || v === "recommended") return v;
  return undefined;
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:city"] || tags["addr:suburb"],
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

/** Convert a raw Overpass response into normalised PlaceResult[]. */
export function normaliseOverpass(
  json: { elements?: OverpassElement[] } | null | undefined,
  center: LatLng,
): PlaceResult[] {
  const elements = json?.elements ?? [];
  const out: PlaceResult[] = [];
  for (const el of elements) {
    const tags = el.tags;
    const name = tags?.name;
    if (!tags || !name) continue;
    const loc: LatLng | null =
      typeof el.lat === "number" && typeof el.lon === "number"
        ? { lat: el.lat, lng: el.lon }
        : el.center
          ? { lat: el.center.lat, lng: el.center.lon }
          : null;
    if (!loc) continue;

    const cuisine = parseCuisines(tags["cuisine"]);

    let diet: Partial<Record<DietId, DietAvailability>> | undefined;
    for (const { id, key } of DIET_OSM_KEYS) {
      const v = normaliseDietValue(tags[`diet:${key}`]);
      if (v) (diet ??= {})[id] = v;
    }

    const website = tags["website"] || tags["contact:website"] || undefined;
    const phone = tags["phone"] || tags["contact:phone"] || undefined;
    const reservation = normaliseReservation(tags["reservation"]);
    const locality = tags["addr:city"] || tags["addr:suburb"] || "";
    // "Book where possible": only offer a reservation link for table-service
    // restaurants that don't explicitly say reservation=no (fast_food/cafe = walk-in).
    const bookable = tags["amenity"] === "restaurant" && reservation !== "no";
    const reserve = bookable ? buildReserveUrl(name, locality) : undefined;

    out.push({
      id: `${el.type}/${el.id}`,
      source: "osm",
      name,
      cuisine,
      location: loc,
      address: buildAddress(tags),
      openNow: undefined, // opening_hours parsing deferred to Phase 7 (opening_hours.js)
      hours: tags["opening_hours"],
      phone,
      reservation,
      diet,
      dataQuality: classifyQuality(tags, !!diet),
      links: buildLinks(name, loc, { website, reserve }),
      videoSearchUrl: `https://www.youtube.com/results?search_query=${enc(name)}`,
      distanceMeters: haversineMeters(center, loc),
    });
  }
  return out;
}

// ── Dietary filtering ────────────────────────────────────────────────────────
// Honest behaviour given sparse OSM diet tags:
//  - "only"  (Fully compliant): keep only places explicitly tagged compliant (only|yes).
//  - "any"   (Some options):    keep everything EXCEPT places that explicitly say "no".
//    (Absence of a tag is "unknown", not "no" — excluding unknowns would hide most
//    real options and mislead the user about coverage.)

export function isDietCompliant(
  place: PlaceResult,
  diets: DietId[],
  strictness: "only" | "any",
): boolean {
  if (!diets.length) return true;
  for (const d of diets) {
    const v = place.diet?.[d];
    if (strictness === "only") {
      if (v !== "only" && v !== "yes") return false;
    } else {
      if (v === "no") return false;
    }
  }
  return true;
}
