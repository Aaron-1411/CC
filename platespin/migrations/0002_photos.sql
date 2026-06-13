-- PlateSpin v2: food photos stored IN D1 (no R2 dependency = no card, no extra
-- service to enable, no extra token scope). Images are client-side compressed
-- (canvas downscale + JPEG re-encode) so each row stays well under D1's row-size
-- limit and the whole table stays tiny against the 5 GB free-tier budget.
CREATE TABLE IF NOT EXISTS photos (
  key          TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  data         TEXT NOT NULL,   -- base64-encoded image bytes
  size         INTEGER NOT NULL,
  created_at   INTEGER NOT NULL
);
