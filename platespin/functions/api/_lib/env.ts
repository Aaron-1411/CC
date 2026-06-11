// Shared bindings + raw D1 row shapes for PlateSpin v2 Pages Functions.
// (Files under _lib export no onRequest* handler, so they create no route — they
// are plain importable modules compiled with the rest of /functions.)

export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  /** Public origin, e.g. https://platespin-app.pages.dev — for OAuth redirects. */
  SITE_ORIGIN?: string;
  /** "1" enables the no-OAuth email-only dev login. NEVER set in production. */
  ALLOW_DEV_LOGIN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
}

// ── Raw D1 rows (snake_case, exactly as stored) ──────────────────────────────

export interface UserRow {
  id: string;
  handle: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  auth_provider: string;
  provider_sub: string | null;
  created_at: number;
}

export interface VenueRow {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  cuisines: string | null;
  source: string;
  created_at: number;
}

export interface MealRow {
  id: string;
  user_id: string;
  venue_id: string;
  dish: string;
  rating: number;
  note: string | null;
  photo_key: string | null;
  diet_tags: string | null;
  eaten_on: string | null;
  created_at: number;
}
