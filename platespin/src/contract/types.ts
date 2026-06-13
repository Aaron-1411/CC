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
  phone?: string; // raw OSM phone / contact:phone — powers a "Call to book" tel: link
  /** OSM `reservation` tag if present (advisory): whether the venue takes bookings. */
  reservation?: "yes" | "no" | "required" | "recommended";
  /** Per-diet availability from OSM diet:* tags. Absent key = unknown, NOT "no". */
  diet?: Partial<Record<DietId, DietAvailability>>;
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
  /** Generic web search (Google) for the place — surfaces ratings/reviews/menus from
   *  Google/TripAdvisor/etc. The honest, zero-API stand-in for an inline rating. */
  webSearch: string;
  website?: string;
  /** Find / make a reservation — OpenTable search deep-link keyed on name + locality.
   *  Zero-API. Only set for table-service venues that don't explicitly say reservation=no. */
  reserve?: string;
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

// ═════════════════════════════════════════════════════════════════════════════
// v2 — SOCIAL CONTRACT (Letterboxd × OpenTable for restaurants)
// Accounts, one-way follows, meal posts with ratings + photos, friend-aware
// discovery. These DTO shapes are the single source of truth shared by both the
// React client and the Cloudflare Pages Functions (imported relatively server-side).
// ═════════════════════════════════════════════════════════════════════════════

/** A rating value: 0.5–5.0 in 0.5 steps (Letterboxd-style half stars). */
export type Rating = number;

/** Public-safe view of a user (never includes email / provider ids). */
export interface PublicUser {
  id: string;
  handle: string; // unique, lowercase [a-z0-9_]
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: number; // unix seconds
}

/** A user's profile page payload: public user + social counts + viewer relation. */
export interface UserProfile extends PublicUser {
  followerCount: number;
  followingCount: number;
  mealCount: number;
  avgRating?: number; // mean of this user's ratings, if any
  isFollowing: boolean; // does the current viewer follow them
  isSelf: boolean;
}

/** Lightweight venue reference embedded in a meal / used across the social UI. */
export interface VenueLite {
  id: string; // OSM id space, e.g. "node/123" — matches the wheel/Overpass proxy
  name: string;
  location: LatLng;
  address?: string;
  cuisines: CuisineId[];
}

/** A meal post — the core unit of the social graph ("I ate X at Y, n stars"). */
export interface Meal {
  id: string;
  author: PublicUser;
  venue: VenueLite;
  dish: string;
  rating: Rating;
  note?: string;
  photoUrl?: string; // served via /api/photo/<key>
  dietTags: DietId[]; // diets the user asserts this dish met (advisory, not a guarantee)
  eatenOn?: string; // optional ISO yyyy-mm-dd
  createdAt: number; // unix seconds
  likeCount: number;
  likedByMe: boolean;
}

/** Feed selector. */
export type FeedScope = "following" | "everyone";

/** Payload to create a meal post. venue carries enough to upsert the cache row. */
export interface CreateMealInput {
  venue: VenueLite;
  dish: string;
  rating: Rating;
  note?: string;
  photoKey?: string; // photo key returned by /api/upload (stored in D1)
  dietTags?: DietId[];
  eatenOn?: string;
}

/** Aggregated rating signal for a venue, optionally split out for the viewer's friends. */
export interface VenueStats {
  id: string; // venue id
  avg: number; // mean rating across all PlateSpin meals
  count: number; // number of meals
  friendAvg?: number; // mean among people the viewer follows
  friendCount?: number; // number of meals from followed users
}

/** Full venue aggregate page payload. */
export interface VenueAggregate {
  venue: VenueLite;
  stats: VenueStats;
  meals: Meal[]; // recent meals at this venue
}

/** Response wrapper for the authenticated-user lookup. */
export interface MeResponse {
  user: PublicUser | null;
  /** Which login methods the server has secrets configured for. */
  authMethods: { dev: boolean; google: boolean; email: boolean };
}
