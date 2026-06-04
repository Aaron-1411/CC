-- Whole Health Compass — D1 schema.
--
-- The Functions create these tables lazily (CREATE ... IF NOT EXISTS) on first
-- use, so running this file is optional — but doing it once at provisioning time
-- is cleaner and lets you inspect/seed the DB up front:
--
--   bunx wrangler d1 create whole-health-compass
--   bunx wrangler d1 execute whole-health-compass --remote --file=./schema.sql
--
-- Then bind it in wrangler.toml as `DB` and redeploy.

CREATE TABLE IF NOT EXISTS events (
  id         TEXT PRIMARY KEY,
  clinic_id  TEXT NOT NULL,
  name       TEXT NOT NULL,   -- funnel event slug, e.g. compass_start
  concern_id TEXT,
  step       TEXT,
  meta       TEXT,            -- small JSON blob, no PII
  anon_id    TEXT,            -- per-session random id (not a cookie, not PII)
  ts         INTEGER NOT NULL -- epoch ms
);
CREATE INDEX IF NOT EXISTS idx_events_clinic_ts ON events (clinic_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_name ON events (clinic_id, name);

CREATE TABLE IF NOT EXISTS leads (
  id              TEXT PRIMARY KEY,
  clinic_id       TEXT NOT NULL,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  message         TEXT,
  concern_id      TEXT,
  concern_label   TEXT,
  include_summary INTEGER NOT NULL DEFAULT 0,
  summary         TEXT,
  -- GDPR Article 9 (special-category health data): we record exactly what the
  -- person consented to, in which version, and when.
  consent_version TEXT NOT NULL,
  consent_text    TEXT NOT NULL,
  consented_at    TEXT NOT NULL,
  source          TEXT,
  ts              INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_clinic_ts ON leads (clinic_id, ts);

-- Append-only consent/event audit trail (compliance-as-product).
CREATE TABLE IF NOT EXISTS audit (
  id        TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL,
  kind      TEXT NOT NULL,  -- e.g. lead_consent
  ref_id    TEXT,           -- e.g. lead id
  detail    TEXT,           -- e.g. consent version
  ip_hash   TEXT,           -- SHA-256 of IP — never the raw address
  ts        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_clinic_ts ON audit (clinic_id, ts);
