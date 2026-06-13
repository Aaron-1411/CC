-- PlateSpin v2 schema — social food platform on Cloudflare D1 (SQLite).
-- Apply locally:  bunx wrangler d1 migrations apply platespin --local
-- Apply to prod:  bunx wrangler d1 migrations apply platespin --remote
--
-- Design notes:
--  • Letterboxd-style ONE-WAY follow (follower -> followee). No mutual requirement.
--  • Venues are CACHED OSM records, keyed by the same id the Overpass proxy emits
--    (e.g. "node/123456") so meal posts and the live wheel speak one id space.
--  • Ratings are 0.5–5.0 in 0.5 steps, stored as REAL.
--  • Photos live in D1 (base64 in the `photos` table, see 0002); meals store
--    the photo key, served via /api/photo/<key>.
--  • All timestamps are unix epoch seconds (INTEGER) for cheap ordering.

PRAGMA foreign_keys = ON;

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,            -- uuid
  handle        TEXT NOT NULL UNIQUE,        -- lowercase, [a-z0-9_], 3–20
  display_name  TEXT NOT NULL,
  email         TEXT UNIQUE,                 -- nullable for dev-login users
  avatar_url    TEXT,
  bio           TEXT,
  password_hash TEXT,                        -- pbkdf2$iter$salt$hash (email signups only)
  auth_provider TEXT NOT NULL DEFAULT 'dev', -- 'dev' | 'google' | 'email'
  provider_sub  TEXT,                        -- provider subject id (google sub etc.)
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_handle ON users (handle);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users (auth_provider, provider_sub);

-- ── Sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,              -- opaque random hex, sent as httpOnly cookie
  user_id     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

-- Short-lived single-use tokens for email magic-link / OAuth state.
CREATE TABLE IF NOT EXISTS login_tokens (
  token       TEXT PRIMARY KEY,
  kind        TEXT NOT NULL,                 -- 'magic' | 'oauth_state'
  payload     TEXT,                          -- email or redirect target
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);

-- ── Follows (one-way) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  follower_id  TEXT NOT NULL,
  followee_id  TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (follower_id, followee_id),
  FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (followee_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows (followee_id);

-- ── Venues (cached OSM POIs) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venues (
  id          TEXT PRIMARY KEY,              -- OSM id, e.g. "node/123" (matches proxy)
  name        TEXT NOT NULL,
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  address     TEXT,
  cuisines    TEXT,                          -- csv of CuisineId
  source      TEXT NOT NULL DEFAULT 'osm',
  created_at  INTEGER NOT NULL
);

-- ── Meals (the post / "diary entry") ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meals (
  id          TEXT PRIMARY KEY,             -- uuid
  user_id     TEXT NOT NULL,
  venue_id    TEXT NOT NULL,
  dish        TEXT NOT NULL,                -- what they ate, e.g. "Margherita pizza"
  rating      REAL NOT NULL,                -- 0.5–5.0 in 0.5 steps
  note        TEXT,                         -- free text review
  photo_key   TEXT,                         -- key into the `photos` D1 table (nullable)
  diet_tags   TEXT,                         -- csv of DietId actually served (user-asserted)
  eaten_on    TEXT,                         -- optional ISO date (yyyy-mm-dd)
  created_at  INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_meals_user ON meals (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meals_venue ON meals (venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meals_created ON meals (created_at DESC);

-- ── Likes (on meals) ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  user_id    TEXT NOT NULL,
  meal_id    TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, meal_id),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (meal_id) REFERENCES meals (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_likes_meal ON likes (meal_id);
