// ─────────────────────────────────────────────────────────────────────────────
// PlateSpin shared contract — the spine. Every module binds to these types.
// No module invents its own shape.
// ─────────────────────────────────────────────────────────────────────────────

export type CuisineId =
  | "italian"
  | "indian"
  | "chinese"
  | "japanese"
  | "thai"
  | "mexican"
  | "turkish"
  | "greek"
  | "american"
  | "british"
  | "korean"
  | "vietnamese"
  | "spanish"
  | "french"
  | "lebanese"
  | "ethiopian"
  | "caribbean"
  | "pizza"
  | "burger"
  | "seafood";
// NOTE: "vegan" was removed from CuisineId — vegan is a DIET, not a cuisine
// (you can want vegan Thai). See DietId below.

export interface Cuisine {
  id: CuisineId;
  label: string; // "Italian"
  emoji: string; // "🍝"
  osmValues: string[]; // OSM cuisine tag values that map to this, e.g. ["italian","pizza"]
  color: string; // wheel slice colour token (hex)
}

// ── Dietary requirements ─────────────────────────────────────────────────────
// Driven by OSM `diet:*` tags (free, real, sparse). Treated as a persistent lens,
// not a one-off filter. SAFETY: allergy-class diets are ADVISORY ONLY — crowdsourced
// data is never a safety guarantee. The UI must never render an allergy diet as "safe".

export type DietId =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "halal"
  | "kosher"
  | "gluten_free"
  | "dairy_free"
  | "nut_free";

/** Diets where a wrong answer is a health risk — must show "confirm with venue" and never a green "safe" state. */
export type AllergyClassDiet = Extract<DietId, "gluten_free" | "dairy_free" | "nut_free">;

export interface Diet {
  id: DietId;
  label: string; // "Vegetarian"
  emoji: string;
  /** OSM key suffix, e.g. "vegetarian" → diet:vegetarian. Some diets have no direct OSM tag. */
  osmKey?: string;
  /** True for allergy-class diets that require the advisory safety treatment. */
  safetyCritical: boolean;
  /** Short line shown when this diet is active and data is uncertain. */
  advisory?: string;
}

/** OSM availability values for a diet:* tag. */
export type DietAvailability = "only" | "yes" | "limited" | "no" | "unknown";

/** OSM `reservation` tag values. Absent = unknown (we still offer a booking handoff for sit-down restaurants). */
export type ReservationStatus = "yes" | "no" | "required" | "recommended";

// ── Geo ──────────────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

// ── Places ───────────────────────────────────────────────────────────────────

/**
 * Honesty signal. OSM gives name+location+cuisine reliably; ratings, prices and
 * photos almost never. The card uses this to avoid implying data it doesn't have.
 *  - "rich"   : has hours/website/diet tags, enough to act on in-app
 *  - "basic"  : name + cuisine + location only
 *  - "sparse" : minimal tags; lean hard on deep-links
 */
export type DataQuality = "rich" | "basic" | "sparse";

export interface PlaceResult {
  id: string; // stable id (osm type+id, or fsq id)
  source: "osm" | "fsq";
  name: string;
  cuisine: CuisineId[]; // normalised
  location: LatLng;
  address?: string;
  rating?: number; // 0–5 if available (rarely present from OSM)
  ratingCount?: number;
  priceLevel?: 1 | 2 | 3 | 4; // rarely present from OSM
  openNow?: boolean; // derived from opening_hours via opening_hours.js; may be undefined
  hours?: string; // raw OSM opening_hours string
  /** Per-diet availability from OSM diet:* tags. Absent key = unknown, NOT "no". */
  diet?: Partial<Record<DietId, DietAvailability>>;
  phone?: string; // OSM phone / contact:phone — powers the "Call" booking action
  /** OSM `reservation` tag (sparse). "no" = walk-in only; absent = unknown. */
  reservation?: ReservationStatus;
  /** True for sit-down venues we can offer a booking handoff for (amenity=restaurant, not reservation=no). */
  bookable?: boolean;
  dataQuality: DataQuality;
  // Media: photos are NOT hosted — they are external links
  links: PlaceLinks;
  videoSearchUrl?: string; // YouTube search deep-link (no quota); embeds are post-v1
  distanceMeters?: number;
}

export interface PlaceLinks {
  googleMaps: string; // search/directions URL
  tiktokSearch: string; // https://www.tiktok.com/search?q=...
  instagramSearch: string;
  youtubeSearch: string; // free deep-link instead of quota-limited embed
  website?: string;
  reserve?: string; // OpenTable search deep-link — booking handoff, no API/quota
}

// ── Search ───────────────────────────────────────────────────────────────────

export interface SearchRequest {
  center: LatLng;
  radiusMeters: number; // default 2000
  cuisines: CuisineId[]; // usually the single spun result, but supports multi
  diets?: DietId[]; // persistent dietary lens, applied to the Overpass query
  dietStrictness?: "only" | "any"; // "only" → diet:x in {only,yes}; "any" also allows "limited"
  openNowOnly?: boolean;
  excludeIds?: string[]; // "somewhere new" — hide already-visited places
  limit?: number; // default 30
}

/**
 * Result of pre-flighting an area: how many compliant places exist per cuisine.
 * This powers the HONEST WHEEL — we only spin to cuisines that actually have
 * in-range, diet-compliant results, and can show counts. Undefined = unknown
 * (Phase 2 has no API, so the wheel treats every selected cuisine as available).
 */
export type AvailabilityMap = Partial<Record<CuisineId, number>>;

// ── Persisted user state (localStorage) ──────────────────────────────────────

export interface SpinState {
  selected: CuisineId[]; // cuisines "in play"
  lastResult?: CuisineId;
  recentResults: CuisineId[]; // for soft anti-repeat weighting
}

export interface SavedLocation {
  label: string;
  center: LatLng;
}

export interface UserState {
  spin: SpinState;
  diet: {
    profile: DietId[]; // persistent dietary requirements applied everywhere
    strictness: "only" | "any";
  };
  lastLocation?: SavedLocation;
  liked: string[]; // PlaceResult.id[]
  visited: string[]; // PlaceResult.id[]
}
