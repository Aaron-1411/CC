// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers for Whole Health Compass Pages Functions.
//
// Files/dirs beginning with "_" are NOT routed by Cloudflare Pages, so this is a
// safe home for code imported across the /api routes.
//
// Design principle — GRACEFUL DEGRADATION: every external dependency is optional.
// When `DB` (D1) is unbound, requests still succeed but persist nothing. When
// `RESEND_API_KEY` is unset, leads are accepted but no email is sent. When
// `ADMIN_TOKEN` is unset, the dashboard endpoints report "not configured" rather
// than crashing. This keeps CI/deploys green and makes go-live a config step.
// ─────────────────────────────────────────────────────────────────────────────

export interface Env {
  /** Optional D1 database. Unbound → API runs in accepted/degraded mode. */
  DB?: D1Database;
  /** Optional Resend key. Unset → leads accepted, no email sent. */
  RESEND_API_KEY?: string;
  /** Verified Resend sender, e.g. "Whole Health Compass <noreply@your-domain>". */
  LEAD_FROM?: string;
  /** Comma-separated recipients for lead notifications (the clinic inbox). */
  LEAD_NOTIFY_TO?: string;
  /** Optional bearer token gating /api/admin/*. Unset → endpoints report 503. */
  ADMIN_TOKEN?: string;
}

const JSON_HEADERS: Record<string, string> = {
  "content-type": "application/json; charset=utf-8",
  // Lead/admin/event payloads must never be cached by intermediaries.
  "cache-control": "no-store",
};

export function json(body: unknown, status = 200, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...(extra ?? {}) },
  });
}

export function uid(): string {
  // crypto.randomUUID is available in the Workers runtime.
  return crypto.randomUUID();
}

/** SHA-256 hex of an arbitrary string — used to store an IP fingerprint for the
 *  consent audit trail WITHOUT keeping the raw IP (privacy-by-design). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? "unknown";
}

/** Constant-time string compare to avoid trivial timing oracles on the token. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/** Returns a Response to send back when auth fails/unconfigured, or null when OK. */
export function requireAdmin(request: Request, env: Env): Response | null {
  if (!env.ADMIN_TOKEN) {
    return json(
      {
        ok: false,
        error: "admin_not_configured",
        message:
          "The clinic dashboard isn't switched on yet. Set the ADMIN_TOKEN secret on the Pages project to enable it.",
      },
      503,
    );
  }
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !safeEqual(token, env.ADMIN_TOKEN)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  return null;
}

// Best-effort, per-isolate IP rate limiting (mirrors the moneymind pattern).
// Isolates are ephemeral and unshared, so this blunts bursts rather than being a
// durable limit — good enough to deter casual abuse of public write endpoints.
const buckets = new Map<string, { count: number; reset: number }>();

export function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now > bucket.reset) {
    buckets.set(ip, { count: 1, reset: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

// D1 schema is created lazily on first use (idempotent CREATE ... IF NOT EXISTS)
// so the dashboard works even if the operator created the DB but skipped
// schema.sql. Guarded by a per-isolate flag to avoid repeating the DDL batch.
let schemaReady = false;

export async function ensureSchema(db: D1Database): Promise<void> {
  if (schemaReady) return;
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        clinic_id TEXT NOT NULL,
        name TEXT NOT NULL,
        concern_id TEXT,
        step TEXT,
        meta TEXT,
        anon_id TEXT,
        ts INTEGER NOT NULL
      )`,
    ),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_events_clinic_ts ON events (clinic_id, ts)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_events_name ON events (clinic_id, name)`),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        clinic_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT,
        concern_id TEXT,
        concern_label TEXT,
        include_summary INTEGER NOT NULL DEFAULT 0,
        summary TEXT,
        consent_version TEXT NOT NULL,
        consent_text TEXT NOT NULL,
        consented_at TEXT NOT NULL,
        source TEXT,
        ts INTEGER NOT NULL
      )`,
    ),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_leads_clinic_ts ON leads (clinic_id, ts)`),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS audit (
        id TEXT PRIMARY KEY,
        clinic_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        ref_id TEXT,
        detail TEXT,
        ip_hash TEXT,
        ts INTEGER NOT NULL
      )`,
    ),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_clinic_ts ON audit (clinic_id, ts)`),
  ]);
  schemaReady = true;
}

/** Trim + hard-cap a string field; returns "" for non-strings. */
export function clean(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

/** A short event/clinic slug: lowercased, safe chars only, bounded length. */
export function slug(v: unknown, max = 48): string {
  return clean(v, max)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, max);
}
