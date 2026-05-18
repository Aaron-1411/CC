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

export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.body as T;
  const body = await fn();
  cache.set(key, { at: Date.now(), body });
  return body;
}

export function envelope<T>(
  data: T,
  source: string,
  sourceUrl: string,
  licence = OGL,
): ProxyEnvelope<T> {
  return {
    data,
    meta: {
      source,
      sourceUrl,
      licence,
      fetchedAt: new Date().toISOString(),
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