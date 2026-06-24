import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";
import { withSnapshot } from "@/lib/snapshot";

// Environment Agency Flood Monitoring — real-time flood warnings & alerts for
// England. Keyless linked-data JSON, OGL v3.0. An empty list is the valid
// "all clear" state (no flooding expected), so the fetcher never throws on zero
// items — only on a transport/HTTP error.
const SOURCE_URL = "https://environment.data.gov.uk/flood-monitoring/id/floods";

// severityLevel semantics, per the EA reference:
//   1 = Severe Flood Warning (danger to life)
//   2 = Flood Warning        (flooding expected — act now)
//   3 = Flood Alert          (flooding possible — be prepared)
//   4 = Warning no longer in force
const SEVERITY_LABEL: Record<number, string> = {
  1: "Severe Flood Warning",
  2: "Flood Warning",
  3: "Flood Alert",
  4: "No longer in force",
};

type FloodWarning = {
  id: string;
  severityLevel: number;
  severity: string;
  area: string;
  county: string;
  riverOrSea: string;
  eaArea: string;
  isTidal: boolean;
  message: string;
  raised: string;
  updated: string;
};

type FloodResponse = {
  warnings: FloodWarning[];
  total: number;
  severe: number; // level 1
  warning: number; // level 2
  alert: number; // level 3
  removed: number; // level 4
  updatedAt: string;
};

type RawFloodArea = {
  county?: string;
  riverOrSea?: string;
  notation?: string;
  label?: string;
  eaAreaName?: string;
  description?: string;
};

type RawItem = {
  "@id"?: string;
  description?: string;
  eaAreaName?: string;
  message?: string;
  severity?: string;
  severityLevel?: number;
  timeRaised?: string;
  timeMessageChanged?: string;
  isTidal?: boolean;
  floodArea?: RawFloodArea | null;
};

type RawResponse = { items?: RawItem[] };

function tidy(s: string | undefined): string {
  return (s ?? "").replace(/\s{2,}/g, " ").trim();
}

async function fetchFloodWarnings(): Promise<FloodResponse> {
  const r = await fetch(SOURCE_URL, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`Environment Agency returned ${r.status}`);
  const j = (await r.json()) as RawResponse;
  // No `items` key at all is a real failure; an empty array is "all clear".
  if (!Array.isArray(j.items)) throw new Error("Environment Agency returned no flood feed");

  const warnings: FloodWarning[] = j.items.map((it) => {
    const fa = it.floodArea ?? {};
    const level = Number(it.severityLevel ?? 4);
    return {
      id: tidy(it["@id"]) || tidy(fa.notation) || tidy(it.description) || "flood",
      severityLevel: level,
      severity: tidy(it.severity) || SEVERITY_LABEL[level] || "Unknown",
      area: tidy(fa.description) || tidy(fa.label) || tidy(it.description) || "Unnamed area",
      county: tidy(fa.county) || "—",
      riverOrSea: tidy(fa.riverOrSea) || "—",
      eaArea: tidy(it.eaAreaName) || tidy(fa.eaAreaName) || "—",
      isTidal: Boolean(it.isTidal),
      message: tidy(it.message),
      raised: tidy(it.timeRaised),
      updated: tidy(it.timeMessageChanged) || tidy(it.timeRaised),
    };
  });

  // Most severe first; within a level, most-recently updated first.
  warnings.sort((a, b) => {
    if (a.severityLevel !== b.severityLevel) return a.severityLevel - b.severityLevel;
    return (b.updated || "").localeCompare(a.updated || "");
  });

  const atLevel = (n: number) => warnings.filter((w) => w.severityLevel === n).length;

  return {
    warnings,
    total: warnings.length,
    severe: atLevel(1),
    warning: atLevel(2),
    alert: atLevel(3),
    removed: atLevel(4),
    updatedAt: new Date().toISOString(),
  };
}

export const Route = createFileRoute("/api/flood-warnings")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Real-time data → short cache (15 min) so the page stays current
          // while keeping calls to the EA polite.
          const data = await withSnapshot("flood_warnings", () =>
            cached("flood-warnings:v1", 15 * 60_000, fetchFloodWarnings),
          );
          return jsonResponse(
            envelope(
              data,
              "Environment Agency — Flood warnings",
              "https://check-for-flooding.service.gov.uk/",
            ),
          );
        } catch (e) {
          return errorResponse(`Flood warning data fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
