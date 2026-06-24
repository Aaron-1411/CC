import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

// National Grid ESO Carbon Intensity API — real-time carbon intensity (gCO2/kWh)
// and generation mix for Great Britain's electricity. Keyless, CC-BY 4.0.
// Three endpoints combined: national intensity, national generation mix, and
// per-DNO-region intensity. Updates every half hour.
const BASE = "https://api.carbonintensity.org.uk";

type FuelMix = { fuel: string; perc: number };

type Region = {
  regionid: number;
  shortname: string;
  dnoregion: string;
  forecast: number;
  index: string;
  topFuel: string;
  topPerc: number;
  renewablePerc: number;
  mix: FuelMix[];
};

type CarbonResponse = {
  from: string;
  to: string;
  forecast: number | null;
  actual: number | null;
  index: string; // very low | low | moderate | high | very high
  mix: FuelMix[]; // national generation mix, % descending
  renewablePerc: number; // wind + solar + hydro + biomass
  fossilPerc: number; // gas + coal
  nuclearPerc: number;
  lowCarbonPerc: number; // renewable + nuclear
  cleanest: Region | null; // lowest-intensity DNO region
  dirtiest: Region | null; // highest-intensity DNO region
  regions: Region[];
  updatedAt: string;
};

type IntensityResp = {
  data?: Array<{
    from?: string;
    to?: string;
    intensity?: { forecast?: number | null; actual?: number | null; index?: string };
  }>;
};
type GenerationResp = { data?: { from?: string; to?: string; generationmix?: FuelMix[] } };
type RegionalResp = {
  data?: Array<{
    regions?: Array<{
      regionid?: number;
      shortname?: string;
      dnoregion?: string;
      intensity?: { forecast?: number; index?: string };
      generationmix?: FuelMix[];
    }>;
  }>;
};

async function getJSON<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`Carbon Intensity API returned ${r.status}`);
  return (await r.json()) as T;
}

const RENEWABLE = ["wind", "solar", "hydro", "biomass"];
const FOSSIL = ["gas", "coal"];

function sumFuels(mix: FuelMix[], fuels: string[]): number {
  return round1(mix.filter((m) => fuels.includes(m.fuel)).reduce((n, m) => n + (m.perc ?? 0), 0));
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function byPercDesc(mix: FuelMix[]): FuelMix[] {
  return [...mix].sort((a, b) => (b.perc ?? 0) - (a.perc ?? 0));
}

async function fetchCarbon(): Promise<CarbonResponse> {
  const [intensity, generation, regional] = await Promise.all([
    getJSON<IntensityResp>("/intensity"),
    getJSON<GenerationResp>("/generation"),
    getJSON<RegionalResp>("/regional"),
  ]);

  const nat = intensity.data?.[0];
  if (!nat?.intensity) throw new Error("Carbon Intensity API returned no national intensity");

  const mix = byPercDesc(generation.data?.generationmix ?? []);
  const renewablePerc = sumFuels(mix, RENEWABLE);
  const fossilPerc = sumFuels(mix, FOSSIL);
  const nuclearPerc = sumFuels(mix, ["nuclear"]);
  const lowCarbonPerc = round1(renewablePerc + nuclearPerc);

  // Keep the 14 DNO regions; drop the England/Scotland/Wales/GB rollups (15–18).
  const regions: Region[] = (regional.data?.[0]?.regions ?? [])
    .filter((r) => (r.regionid ?? 99) <= 14)
    .map((r) => {
      const rmix = byPercDesc(r.generationmix ?? []);
      const top = rmix[0];
      return {
        regionid: r.regionid ?? 0,
        shortname: r.shortname ?? "—",
        dnoregion: r.dnoregion ?? "—",
        forecast: r.intensity?.forecast ?? 0,
        index: r.intensity?.index ?? "unknown",
        topFuel: top?.fuel ?? "—",
        topPerc: round1(top?.perc ?? 0),
        renewablePerc: sumFuels(rmix, RENEWABLE),
        mix: rmix,
      };
    })
    .sort((a, b) => a.forecast - b.forecast);

  const cleanest = regions[0] ?? null;
  const dirtiest = regions.length ? regions[regions.length - 1] : null;

  return {
    from: nat.from ?? "",
    to: nat.to ?? "",
    forecast: nat.intensity.forecast ?? null,
    actual: nat.intensity.actual ?? null,
    index: nat.intensity.index ?? "unknown",
    mix,
    renewablePerc,
    fossilPerc,
    nuclearPerc,
    lowCarbonPerc,
    cleanest,
    dirtiest,
    regions,
    updatedAt: new Date().toISOString(),
  };
}

export const Route = createFileRoute("/api/carbon-intensity")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Half-hourly source → 15-min cache keeps the page current while
          // staying polite to the National Grid ESO endpoint.
          const data = await cached("carbon-intensity:v1", 15 * 60_000, fetchCarbon);
          return jsonResponse(
            envelope(
              data,
              "National Grid ESO — Carbon Intensity API",
              "https://carbonintensity.org.uk/",
              "Creative Commons Attribution 4.0",
            ),
          );
        } catch (e) {
          return errorResponse(`Carbon intensity data fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
