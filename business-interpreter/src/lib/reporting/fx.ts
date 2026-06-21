/* ------------------------------------------------------------------ */
/* Frankfurter FX rate resolver (keyless, read-only).                  */
/*                                                                     */
/* The reshape engine stays pure and deterministic: it never fetches.  */
/* Live exchange rates are resolved HERE, server-side, once per run,    */
/* then baked onto each fxNormalize spec before the pipeline executes — */
/* so the converted numbers are reproducible from the spec alone (the   */
/* number comes from the engine multiplying by a recorded rate, never   */
/* from a model). Frankfurter (frankfurter.app) serves the ECB daily    */
/* reference rates with no API key and is strictly read-only data input */
/* — it never places an order, moves money, or initiates a transfer.    */
/* ------------------------------------------------------------------ */

/** A currency pair to resolve, e.g. `{ from: "USD", to: "GBP" }`. */
export type FxPair = { from: string; to: string };

/** A resolved rate: units of `to` per 1 `from`, plus the ECB reference date. */
export type FxRate = { rate: number; date: string };

const FRANKFURTER_BASE = "https://api.frankfurter.app/latest";

/** Stable map key for a pair. Codes are upper-cased by the caller. */
export function fxKey(from: string, to: string): string {
  return `${from}>${to}`;
}

type FrankfurterResp = {
  amount?: number;
  base?: string;
  date?: string;
  rates?: Record<string, number>;
};

/**
 * Resolve a set of currency pairs to live rates. Pairs are grouped by source
 * currency so each base is fetched at most once (Frankfurter returns every
 * requested symbol in one call). Same-currency pairs resolve to rate 1 without a
 * network call. Unknown/unsupported codes are simply omitted from the result —
 * the caller decides how to treat a missing pair. A network or HTTP failure
 * throws a single friendly error (mirrors the Tableau connector's behaviour).
 *
 * Returns a map keyed by `fxKey(from, to)`.
 */
export async function resolveFxRates(pairs: FxPair[]): Promise<Map<string, FxRate>> {
  const out = new Map<string, FxRate>();

  // Normalise + de-dupe; bucket target currencies by base.
  const byBase = new Map<string, Set<string>>();
  for (const p of pairs) {
    const from = (p.from ?? "").trim().toUpperCase();
    const to = (p.to ?? "").trim().toUpperCase();
    if (!from || !to) continue;
    if (from === to) {
      // No feed needed — a currency is always 1:1 with itself.
      out.set(fxKey(from, to), { rate: 1, date: "" });
      continue;
    }
    const set = byBase.get(from) ?? new Set<string>();
    set.add(to);
    byBase.set(from, set);
  }

  await Promise.all(
    [...byBase.entries()].map(async ([base, targets]) => {
      const url = new URL(FRANKFURTER_BASE);
      url.searchParams.set("base", base);
      url.searchParams.set("symbols", [...targets].join(","));

      let res: Response;
      try {
        res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      } catch (e) {
        throw new Error(`Couldn't reach the currency feed: ${(e as Error).message}`);
      }
      if (!res.ok) {
        // 404/422 here usually means an unsupported base currency code.
        throw new Error(
          `The currency feed rejected base "${base}" (HTTP ${res.status}). Use ISO codes like USD, GBP, EUR.`,
        );
      }
      const json = (await res.json()) as FrankfurterResp;
      const date = typeof json.date === "string" ? json.date : "";
      const rates = json.rates ?? {};
      for (const to of targets) {
        const rate = rates[to];
        if (typeof rate === "number" && Number.isFinite(rate)) {
          out.set(fxKey(base, to), { rate, date });
        }
      }
    }),
  );

  return out;
}
