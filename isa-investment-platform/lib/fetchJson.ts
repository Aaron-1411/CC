/**
 * Fetch JSON and throw on non-2xx so React Query retries automatically.
 * Drop-in replacement for fetch(url).then(r => r.json()).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<T>;
}
