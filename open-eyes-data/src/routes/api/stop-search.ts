import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

const POLICE_API = "https://data.police.uk/api";

export type StopRecord = {
  age_range: string | null;
  outcome: string | null;
  self_defined_ethnicity: string | null;
  gender: string | null;
  legislation: string | null;
  datetime: string | null;
  location: { latitude: string; longitude: string; street?: { name?: string } } | null;
  object_of_search: string | null;
  officer_defined_ethnicity: string | null;
  type: string | null;
};

type ForceEntry = { id: string; name: string };

function defaultDate(): string {
  // Try 3 months ago as the most recent available
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function countBy(arr: StopRecord[], key: keyof StopRecord): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of arr) {
    const val = (item[key] as string | null) ?? "Unknown";
    const k = val || "Unknown";
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([, a], [, b]) => b - a),
  );
}

export const Route = createFileRoute("/api/stop-search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const force = url.searchParams.get("force") || "metropolitan";
          const date = url.searchParams.get("date") || defaultDate();

          // Fetch forces list (24h cache)
          const forces = await cached("forces:v1", 24 * 60 * 60_000, async () => {
            const r = await fetch(`${POLICE_API}/forces`);
            if (!r.ok) throw new Error(`Forces list ${r.status}`);
            return (await r.json()) as ForceEntry[];
          });

          // Fetch stop-and-search data (4h cache keyed by force+date)
          const stops = await cached(`stops:${force}:${date}:v1`, 4 * 60 * 60_000, async () => {
            const r = await fetch(
              `${POLICE_API}/stops-force?force=${encodeURIComponent(force)}&date=${encodeURIComponent(date)}`,
            );
            if (!r.ok) throw new Error(`Police API ${r.status}`);
            return (await r.json()) as StopRecord[];
          });

          const byEthnicity = countBy(stops, "self_defined_ethnicity");
          const byOutcome = countBy(stops, "outcome");
          const byObject = countBy(stops, "object_of_search");

          return jsonResponse(
            envelope(
              {
                stops,
                summary: {
                  total: stops.length,
                  byEthnicity,
                  byOutcome,
                  byObject,
                },
                force,
                date,
                forces,
              },
              "data.police.uk — Home Office",
              "https://data.police.uk",
            ),
          );
        } catch (e) {
          return errorResponse(`Stop & search fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
