const BASE = "https://api.firecrawl.dev/v2";

function key() {
  const k = process.env.FIRECRAWL_API_KEY;
  if (!k) throw new Error("FIRECRAWL_API_KEY is not configured");
  return k;
}

async function call(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Firecrawl ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function firecrawlSearch(query: string, limit = 10, opts: Record<string, unknown> = {}) {
  return call("/search", { query, limit, ...opts });
}

export async function firecrawlScrape(
  url: string,
  formats: Array<string | Record<string, unknown>> = ["markdown"],
) {
  return call("/scrape", { url, formats, onlyMainContent: true });
}

export async function firecrawlMap(
  url: string,
  opts: { search?: string; limit?: number; includeSubdomains?: boolean } = {},
) {
  return call("/map", { url, limit: 200, includeSubdomains: false, ...opts });
}

// Run async fns with a concurrency cap.
export async function pMapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (x: T, i: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}
