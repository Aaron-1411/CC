/**
 * FRED (Federal Reserve Economic Data) client — SERVER ONLY
 */
import type { MacroData } from "@/types/market";

const BASE = "https://api.stlouisfed.org/fred";

function getApiKey(): string {
  return process.env.FRED_API_KEY ?? "";
}

export const FRED_SERIES: Record<string, { name: string; unit: string; frequency: string }> = {
  DFF: { name: "Federal Funds Rate", unit: "%", frequency: "daily" },
  T10Y2Y: { name: "10Y-2Y Treasury Spread", unit: "%", frequency: "daily" },
  CPIAUCSL: { name: "CPI (All Urban)", unit: "index", frequency: "monthly" },
  DEXUSUK: { name: "USD/GBP Exchange Rate", unit: "USD per GBP", frequency: "daily" },
  VIXCLS: { name: "CBOE VIX", unit: "index", frequency: "daily" },
};

interface FredObservation {
  date: string;
  value: string;
}

interface FredResponse {
  observations: FredObservation[];
}

async function fetchSeries(
  seriesId: string,
  limit: number = 1
): Promise<FredObservation | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const url = `${BASE}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as FredResponse;
    const obs = data.observations ?? [];
    // Find the most recent non-'.' value
    for (const o of obs) {
      if (o.value !== ".") return o;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchSeriesHistory(
  seriesId: string,
  limit: number = 252
): Promise<FredObservation[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const url = `${BASE}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as FredResponse;
    return (data.observations ?? []).filter((o) => o.value !== ".").reverse();
  } catch {
    return [];
  }
}

export async function fetchMacroSnapshot(): Promise<MacroData[]> {
  const seriesIds = Object.keys(FRED_SERIES);

  const results = await Promise.allSettled(
    seriesIds.map((id) => fetchSeries(id, 2))
  );

  return results
    .map((result, i) => {
      const seriesId = seriesIds[i];
      const meta = FRED_SERIES[seriesId];
      if (result.status === "rejected" || !result.value) return null;
      const obs = result.value;
      return {
        series: seriesId,
        name: meta.name,
        value: parseFloat(obs.value),
        date: obs.date,
        unit: meta.unit,
        frequency: meta.frequency,
      };
    })
    .filter((d): d is MacroData => d !== null && !isNaN(d.value));
}

export async function fetchVIXHistory(
  limit: number = 252
): Promise<{ date: string; value: number }[]> {
  const obs = await fetchSeriesHistory("VIXCLS", limit);
  return obs.map((o) => ({ date: o.date, value: parseFloat(o.value) }));
}

export async function fetchYieldCurveHistory(
  limit: number = 252
): Promise<{ date: string; value: number }[]> {
  const obs = await fetchSeriesHistory("T10Y2Y", limit);
  return obs.map((o) => ({ date: o.date, value: parseFloat(o.value) }));
}
