import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";
import { withSnapshot } from "@/lib/snapshot";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EconSeries = {
  label: string;
  description: string;
  unit: string;
  latestValue: string;
  latestDate: string;
  trend: Array<{ date: string; value: number }>; // last 12 points
  source: string;
  sourceId: string;
};

export type EconomyData = {
  series: EconSeries[];
  updatedAt: string;
};

// ─── ONS API ─────────────────────────────────────────────────────────────────

type ONSResponse = {
  months?: Array<{ date: string; value: string }>;
  quarters?: Array<{ date: string; value: string }>;
  years?: Array<{ date: string; value: string }>;
};

async function fetchONSSeries(
  dataset: string,
  seriesId: string,
  label: string,
  description: string,
  unit: string,
  granularity: "months" | "quarters" | "years" = "quarters",
): Promise<EconSeries> {
  const url = `https://api.ons.gov.uk/v1/datasets/${dataset}/timeseries/${seriesId}/data`;
  const r = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!r.ok) throw new Error(`ONS ${seriesId}: HTTP ${r.status}`);
  const json = (await r.json()) as ONSResponse;

  const points = (json[granularity] ?? [])
    .filter((p) => p.value !== "" && p.value !== ".")
    .map((p) => ({ date: p.date, value: parseFloat(p.value) }))
    .filter((p) => !isNaN(p.value));

  const latest = points[points.length - 1];
  const trend = points.slice(-12);

  return {
    label,
    description,
    unit,
    latestValue: latest ? latest.value.toFixed(1) : "—",
    latestDate: latest?.date ?? "—",
    trend,
    source: `ONS — ${dataset.toUpperCase()} series ${seriesId}`,
    sourceId: seriesId,
  };
}

// ─── Fetch all indicators ─────────────────────────────────────────────────────

async function fetchEconomy(): Promise<EconomyData> {
  const SERIES: Array<Parameters<typeof fetchONSSeries>> = [
    // GDP quarter-on-quarter growth %
    ["qna", "IHYQ", "GDP growth", "Quarter-on-quarter GDP growth (seasonally adjusted)", "%", "quarters"],
    // CPI 12-month rate
    ["mm23", "D7G7", "CPI inflation", "Consumer Prices Index — 12-month rate", "%", "months"],
    // Unemployment rate (ILO)
    ["lms", "MGSX", "Unemployment", "ILO unemployment rate (16+)", "%", "months"],
    // Real wage growth (CPIH-deflated regular pay, 3m/yr)
    ["earn", "KAB9", "Real wage growth", "Real regular pay — 3 month on year change (CPIH adjusted)", "%", "months"],
    // Net debt as % GDP
    ["pusf", "HF6W", "Public debt", "Public sector net debt excluding Bank of England (£bn)", "£bn", "months"],
    // Public sector net borrowing (deficit)
    ["pusf", "J5II", "Government deficit", "Public sector net borrowing (PSNB), rolling 12 months (£bn)", "£bn", "months"],
  ];

  const results = await Promise.allSettled(
    SERIES.map(([d, s, l, desc, u, g]) => fetchONSSeries(d, s, l, desc, u, g)),
  );

  const series: EconSeries[] = results
    .map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      // Return placeholder on error so the page still renders
      const [, seriesId, label, description, unit] = SERIES[i];
      console.error(`Economy series ${seriesId} failed:`, r.reason);
      return {
        label,
        description,
        unit,
        latestValue: "—",
        latestDate: "Data unavailable",
        trend: [],
        source: `ONS — ${seriesId}`,
        sourceId: seriesId,
      } satisfies EconSeries;
    });

  return { series, updatedAt: new Date().toISOString() };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/economy")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await withSnapshot("economy_ons", () =>
            cached("economy:ons:v1", 6 * 60 * 60_000, fetchEconomy),
          );
          return jsonResponse(
            envelope(
              data,
              "Office for National Statistics — Economic Indicators",
              "https://api.ons.gov.uk",
            ),
          );
        } catch (e) {
          return errorResponse(`Economy fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
