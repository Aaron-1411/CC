import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

type Kpi = {
  label: string;
  value: string;
  period: string;
  source: string;
  trend?: "up" | "down" | "flat";
  live?: boolean;
};

type OnsDataPoint = { date: string; value: string; label?: string };
type OnsResponse = {
  months?: OnsDataPoint[];
  quarters?: OnsDataPoint[];
  years?: OnsDataPoint[];
};

async function fetchOnsSeries(dataset: string, series: string): Promise<OnsDataPoint> {
  const url = `https://api.ons.gov.uk/v1/datasets/${dataset}/timeseries/${series}/data`;
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`ONS ${dataset}/${series} returned ${r.status}`);
  const j = (await r.json()) as OnsResponse;
  const point = j.months?.at(-1) ?? j.quarters?.at(-1) ?? j.years?.at(-1);
  if (!point) throw new Error(`ONS ${dataset}/${series}: no data points returned`);
  return point;
}

const STATIC_KPIS: Kpi[] = [
  {
    label: "NHS Elective Waiting List",
    value: "7.2m",
    period: "Feb 2026",
    source: "NHS England · RTT Statistics",
    live: false,
  },
  {
    label: "Asylum Cases Awaiting Initial Decision",
    value: "35,700",
    period: "Mar 2026",
    source: "Home Office · Asylum Statistics",
    live: false,
  },
];

export const Route = createFileRoute("/api/kpis")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await cached("kpis:ons:v1", 30 * 60_000, async () => {
            const [cpiResult, debtResult, unemployResult, gdpResult] =
              await Promise.allSettled([
                fetchOnsSeries("mm23", "d7g7"),
                fetchOnsSeries("pusf", "hf6x"),
                fetchOnsSeries("lms", "mgsx"),
                fetchOnsSeries("pn2", "ihyq"),
              ]);

            const liveKpis: Kpi[] = [];

            if (cpiResult.status === "fulfilled") {
              liveKpis.push({
                label: "CPI Inflation",
                value: `${cpiResult.value.value}%`,
                period: cpiResult.value.date,
                source: "ONS · mm23/d7g7",
                live: true,
              });
            }

            if (debtResult.status === "fulfilled") {
              liveKpis.push({
                label: "Public Sector Net Debt (% GDP)",
                value: `${debtResult.value.value}%`,
                period: debtResult.value.date,
                source: "ONS · pusf/hf6x",
                live: true,
              });
            }

            if (unemployResult.status === "fulfilled") {
              liveKpis.push({
                label: "Unemployment Rate",
                value: `${unemployResult.value.value}%`,
                period: unemployResult.value.date,
                source: "ONS · lms/mgsx",
                live: true,
              });
            }

            if (gdpResult.status === "fulfilled") {
              liveKpis.push({
                label: "GDP Growth Rate (quarterly)",
                value: `${gdpResult.value.value}%`,
                period: gdpResult.value.date,
                source: "ONS · pn2/ihyq",
                live: true,
              });
            }

            return { kpis: [...liveKpis, ...STATIC_KPIS] };
          });

          return jsonResponse(
            envelope(
              data,
              "ONS API · NHS England · Home Office",
              "https://api.ons.gov.uk",
            ),
          );
        } catch (e) {
          return errorResponse((e as Error).message);
        }
      },
    },
  },
});
