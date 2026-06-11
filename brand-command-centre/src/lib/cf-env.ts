/**
 * Read a string secret / config value in a way that works in every runtime we
 * deploy to:
 *
 *  - Cloudflare Pages (production): request-scoped values live on
 *    `getRequestContext().env`. next-on-pages also mirrors string vars onto
 *    `process.env`, but the request context is the authoritative source.
 *  - `next dev` / Node: `@cloudflare/next-on-pages` isn't in a request context,
 *    so `getRequestContext()` throws — we fall through to `process.env`, which
 *    Next populates from `.env`.
 *
 * KV and other object bindings are read directly via `getRequestContext().env`
 * in src/lib/db.ts; this helper is only for string values.
 */
export function cfEnv(key: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require("@cloudflare/next-on-pages");
    const env = getRequestContext()?.env as Record<string, unknown> | undefined;
    const v = env?.[key];
    if (typeof v === "string" && v.length > 0) return v;
  } catch {
    // Not inside a Cloudflare request context — fall back to process.env.
  }
  const pv = process.env[key];
  return pv && pv.length > 0 ? pv : undefined;
}
