// Tiny HTTP helpers shared by every v2 function. Same-origin only (the SPA and
// the API ship from one Pages project), so no CORS headers needed.

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export function error(message: string, status = 400, headers: Record<string, string> = {}): Response {
  return json({ error: message }, status, headers);
}

/** Parse a JSON request body, returning null on any failure (never throws). */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** crypto-strong random hex token. */
export function randomToken(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}
