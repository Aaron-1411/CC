/* ------------------------------------------------------------------ */
/* REST Countries reference resolver (keyless, read-only).             */
/*                                                                     */
/* The reshape engine stays pure and deterministic: it never fetches.  */
/* The country directory is resolved HERE, server-side, once per run,   */
/* then the resulting lookup index is baked onto each enrichCountry     */
/* spec before the pipeline executes — so the enriched columns are      */
/* reproducible from the spec alone (the value comes from the engine    */
/* reading a recorded dictionary, never from a model). REST Countries   */
/* (restcountries.com) is a free, KEYLESS, strictly read-only reference */
/* dataset of ~250 countries — it never places an order, moves money,   */
/* or initiates a transfer.                                             */
/*                                                                     */
/* Unlike the FX resolver, the data here is static reference (not keyed */
/* by the input column's values), so we fetch the WHOLE directory once  */
/* and build a flat lookup index keyed by lower-cased common name,      */
/* official name and ISO alpha-2/alpha-3 codes. That single index is    */
/* reused for every enrichCountry step in a run and cached in-module    */
/* for a day. A network or HTTP failure throws a single friendly error  */
/* (mirrors the FX/Tableau connectors).                                 */
/* ------------------------------------------------------------------ */

import type { CountryInfo } from "./reshape";

const RESTCOUNTRIES_URL =
  "https://restcountries.com/v3.1/all?fields=name,cca2,cca3,region,subregion,capital,population,currencies";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — the directory changes very rarely
const REQUEST_TIMEOUT_MS = 8000; // the full directory is a chunky response, so cap it

type RestCountry = {
  name?: { common?: string; official?: string };
  cca2?: string;
  cca3?: string;
  region?: string;
  subregion?: string;
  capital?: string[];
  population?: number;
  currencies?: Record<string, { name?: string; symbol?: string }>;
};

let cache: { expires: number; index: Record<string, CountryInfo> } | null = null;

function clean(v: string | undefined): string | undefined {
  const s = (v ?? "").trim();
  return s === "" ? undefined : s;
}

function toCountryInfo(c: RestCountry): CountryInfo | null {
  const name = clean(c.name?.common);
  if (!name) return null;

  let currencyCode: string | undefined;
  let currencyName: string | undefined;
  if (c.currencies) {
    const codes = Object.keys(c.currencies);
    if (codes.length > 0) {
      currencyCode = codes[0];
      currencyName = clean(c.currencies[codes[0]]?.name);
    }
  }

  return {
    name,
    official: clean(c.name?.official),
    cca2: clean(c.cca2)?.toUpperCase(),
    cca3: clean(c.cca3)?.toUpperCase(),
    region: clean(c.region),
    subregion: clean(c.subregion),
    capital: Array.isArray(c.capital) && c.capital.length > 0 ? clean(String(c.capital[0])) : undefined,
    population:
      typeof c.population === "number" && Number.isFinite(c.population) ? c.population : undefined,
    currencyCode,
    currencyName,
  };
}

/**
 * Build a flat lookup index from a list of countries, keyed by lower-cased
 * common name, official name and ISO alpha-2/alpha-3 codes. Earlier entries win
 * if two countries normalise to the same key (rare; common names are unique).
 */
function indexCountries(list: CountryInfo[]): Record<string, CountryInfo> {
  const idx: Record<string, CountryInfo> = {};
  const put = (k: string | undefined, info: CountryInfo) => {
    const key = (k ?? "").trim().toLowerCase();
    if (key && !(key in idx)) idx[key] = info;
  };
  for (const info of list) {
    put(info.name, info);
    put(info.official, info);
    put(info.cca2, info);
    put(info.cca3, info);
  }
  return idx;
}

/**
 * Resolve the full country directory to a flat lookup index, cached in-module for
 * a day. The index is keyed by normalised (lower-cased, trimmed) common name,
 * official name and ISO alpha-2/alpha-3 codes so a column of country names OR ISO
 * codes can be enriched. A network or HTTP failure throws a single friendly error
 * — the caller surfaces it; nothing is baked, so the run fails cleanly rather than
 * inventing data.
 */
export async function resolveCountryIndex(): Promise<Record<string, CountryInfo>> {
  const now = Date.now();
  if (cache && cache.expires > now) return cache.index;

  let res: Response;
  try {
    res = await fetch(RESTCOUNTRIES_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    throw new Error(`Couldn't reach the country directory: ${(e as Error).message}`);
  }
  if (!res.ok) {
    throw new Error(`The country directory is unavailable (HTTP ${res.status}). Try again shortly.`);
  }

  const json = (await res.json()) as unknown;
  if (!Array.isArray(json)) {
    throw new Error("The country directory returned an unexpected response.");
  }

  const list: CountryInfo[] = [];
  for (const c of json as RestCountry[]) {
    const info = toCountryInfo(c);
    if (info) list.push(info);
  }

  const index = indexCountries(list);
  cache = { expires: now + CACHE_TTL_MS, index };
  return index;
}
