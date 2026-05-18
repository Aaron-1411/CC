import type { ProxyEnvelope } from "./proxy";

export async function getJSON<T>(url: string, init?: RequestInit): Promise<ProxyEnvelope<T>> {
  const r = await fetch(url, init);
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error ?? `${r.status}`);
  return j as ProxyEnvelope<T>;
}

export function fmtNumber(n: number | null | undefined) {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en-GB");
}

export function fmtGBP(n: number | null | undefined) {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000_000) return `£${(n / 1_000_000_000).toFixed(2)}bn`;
  if (Math.abs(n) >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}m`;
  if (Math.abs(n) >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n.toLocaleString("en-GB")}`;
}

export function relTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = 86400_000;
  if (diff < day) return "today";
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  if (diff < 30 * day) return `${Math.floor(diff / (7 * day))}w ago`;
  return d.toLocaleDateString("en-GB");
}