// Shared types + tiny response helpers for every Pages Function.
// Lives under functions/_lib (leading underscore) so the Pages router never
// treats it as a route — it is import-only.

import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  // D1 binding (see wrangler.toml). Absent under plain `vite dev`.
  DB?: D1Database;
  // Access gate.
  APP_SHARED_SECRET?: string;
  // Discord ingest.
  DISCORD_BOT_TOKEN?: string;
  DISCORD_CHANNEL_ID?: string;
  // Parsing.
  ANTHROPIC_API_KEY?: string;
  // Charting.
  TWELVEDATA_API_KEY?: string;
  // Optional: live quote / symbol search only — never used for candles.
  FINNHUB_API_KEY?: string;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

// Most routes need D1. When it is unbound (local `vite dev` with no
// `wrangler pages dev`), surface a clear, JSON error so the client's
// demo-fallback kicks in only on genuine network/non-json failures.
export function requireDB(env: Env): D1Database | Response {
  if (!env.DB) {
    return error('Database not configured (D1 binding "DB" is unbound).', 503);
  }
  return env.DB;
}
