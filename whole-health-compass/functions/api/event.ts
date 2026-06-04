// POST /api/event — first-party, cookieless funnel analytics.
//
// Privacy-by-design: we store an event slug, an optional concern id/step, a tiny
// meta blob, and a per-session random `anonId` (NOT a cookie, NOT PII). We never
// store names, emails, free-text health descriptions, IPs or user-agents here.
// When D1 is unbound the event is simply accepted and dropped.

import { type Env, json, uid, slug, clean, isRateLimited, ensureSchema } from "../_shared";

const RATE_LIMIT = 120; // events
const RATE_WINDOW_MS = 60_000; // per minute per edge isolate
const MAX_META_CHARS = 500;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (isRateLimited(`ev:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return json({ ok: true, stored: false, throttled: true });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const name = slug(payload.name, 48);
  if (!name) return json({ ok: false, error: "missing_event_name" }, 400);

  const clinicId = slug(payload.clinicId, 48) || "default";
  const concernId = slug(payload.concernId, 48) || null;
  const step = slug(payload.step, 48) || null;
  const anonId = slug(payload.anonId, 64) || null;

  let meta: string | null = null;
  if (payload.meta && typeof payload.meta === "object") {
    try {
      meta = JSON.stringify(payload.meta).slice(0, MAX_META_CHARS);
    } catch {
      meta = null;
    }
  } else if (typeof payload.meta === "string") {
    meta = clean(payload.meta, MAX_META_CHARS);
  }

  // No storage bound → accept and move on (degraded mode).
  if (!env.DB) return json({ ok: true, stored: false });

  try {
    await ensureSchema(env.DB);
    await env.DB.prepare(
      `INSERT INTO events (id, clinic_id, name, concern_id, step, meta, anon_id, ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(uid(), clinicId, name, concernId, step, meta, anonId, Date.now())
      .run();
    return json({ ok: true, stored: true });
  } catch {
    // Analytics must never break the page — swallow and report soft failure.
    return json({ ok: true, stored: false, error: "write_failed" });
  }
};
