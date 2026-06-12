export type ProxyEnvelope<T> = {
  data: T;
  meta: {
    source: string;
    sourceUrl: string;
    licence: string;
    fetchedAt: string;
  };
  error?: string;
};

const OGL = "Open Government Licence v3.0";

const cache = new Map<string, { at: number; body: unknown }>();

/**
 * Cache a fetch. `at` records when the underlying data was ACTUALLY retrieved,
 * so callers can report honest freshness rather than request-build time.
 */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  return (await cachedTimed(key, ttlMs, fn)).value;
}

/** Like `cached`, but also returns the true retrieval timestamp of the data. */
export async function cachedTimed<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<{ value: T; fetchedAt: string; fromCache: boolean }> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return { value: hit.body as T, fetchedAt: new Date(hit.at).toISOString(), fromCache: true };
  }
  const body = await fn();
  const at = Date.now();
  cache.set(key, { at, body });
  return { value: body, fetchedAt: new Date(at).toISOString(), fromCache: false };
}

/** Per-key last-known retrieval time, for /api/status. */
export function cacheRegistry(): Array<{ key: string; fetchedAt: string; ageMs: number }> {
  const now = Date.now();
  return Array.from(cache.entries()).map(([key, { at }]) => ({
    key,
    fetchedAt: new Date(at).toISOString(),
    ageMs: now - at,
  }));
}

/**
 * Lightweight in-memory sliding-window rate limiter. Per Worker isolate (not
 * global), so it throttles a single abuser hitting one edge — a pragmatic guard
 * until a KV/Durable-Object limiter is provisioned (see LAUNCH_NOTES).
 * Returns true if the request is ALLOWED.
 */
const rlBuckets = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (rlBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    rlBuckets.set(key, hits);
    return false;
  }
  hits.push(now);
  rlBuckets.set(key, hits);
  return true;
}

export function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "anon"
  );
}

export function envelope<T>(
  data: T,
  source: string,
  sourceUrl: string,
  licence = OGL,
  fetchedAt?: string,
): ProxyEnvelope<T> {
  return {
    data,
    meta: {
      source,
      sourceUrl,
      licence,
      // Honest: callers pass the true retrieval time; default only when unknown.
      fetchedAt: fetchedAt ?? new Date().toISOString(),
    },
  };
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=60",
    },
  });
}

export function errorResponse(message: string, status = 502) {
  return jsonResponse({ error: message }, status);
}
