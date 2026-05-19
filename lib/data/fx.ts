/**
 * FX rates client — SERVER ONLY
 * Primary: open.er-api.com
 * Fallback: hardcoded rates
 */
import type { FXRates } from "@/types/market";

const FALLBACK_RATES: Record<string, number> = {
  USD: 1.27,
  EUR: 1.17,
  GBP: 1.0,
  JPY: 191.5,
  CHF: 1.11,
  CAD: 1.74,
  AUD: 1.96,
  HKD: 9.91,
  SGD: 1.70,
  SEK: 13.1,
  NOK: 13.4,
  DKK: 8.73,
  CNY: 9.22,
  INR: 106.5,
};

interface OpenERResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_unix: number;
}

let cachedFX: FXRates | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchFXRates(base: string = "GBP"): Promise<FXRates> {
  // Return in-memory cache if fresh
  if (cachedFX && Date.now() - cacheTime < CACHE_TTL) {
    return cachedFX;
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`);

    const data = (await res.json()) as OpenERResponse;

    if (data.result !== "success") throw new Error("FX API returned error");

    const rates: FXRates = {
      base: data.base_code,
      rates: data.rates,
      timestamp: data.time_last_update_unix * 1000,
    };

    cachedFX = rates;
    cacheTime = Date.now();
    return rates;
  } catch {
    // Return fallback rates
    return {
      base: "GBP",
      rates: FALLBACK_RATES,
      timestamp: Date.now(),
    };
  }
}

export function convertToGBP(
  amount: number,
  fromCurrency: string,
  fxRates: FXRates
): number {
  if (fromCurrency === "GBP") return amount;
  if (fromCurrency === "GBp") return amount / 100; // pence to pounds

  const rate = fxRates.rates[fromCurrency];
  if (!rate) {
    // Use fallback
    const fallback = FALLBACK_RATES[fromCurrency];
    return fallback ? amount / fallback : amount;
  }
  return amount / rate;
}

export function getGBPUSD(fxRates: FXRates): number {
  return fxRates.rates["USD"] ?? 1.27;
}
