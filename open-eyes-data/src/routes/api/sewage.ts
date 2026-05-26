import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

// 2024 EDM dataset — org ID Bb8lfThdhugyc4G3 (correct EA ArcGIS org)
// Previous URL used JJzESW51TqeY9uat which was decommissioned
const ARCGIS_BASE =
  "https://services3.arcgis.com/Bb8lfThdhugyc4G3/arcgis/rest/services/Storm_Overflow_EDM_Annual_Returns_2024/FeatureServer/0/query";
const ARCGIS_FIELDS =
  "waterCompanyName,siteNameEA,totalDurationAllSpillsHrs,countedSpills,recievingWaterName";
const PAGE_SIZE = 1000;

type SpillRecord = {
  company: string;
  site: string;
  spillHours: number;
  spillCount: number;
  receivingWater: string;
};

type SpillResponse = {
  spills: SpillRecord[];
  totalHours: number;
  totalCount: number;
  year: number;
};

type ArcGISFeature = {
  attributes: {
    waterCompanyName?: string | null;
    siteNameEA?: string | null;
    totalDurationAllSpillsHrs?: number | null;
    countedSpills?: number | null;
    recievingWaterName?: string | null;
  };
};

type ArcGISResponse = {
  features?: ArcGISFeature[];
};

async function fetchSpillPage(offset: number): Promise<ArcGISFeature[]> {
  const url = `${ARCGIS_BASE}?where=1%3D1&outFields=${ARCGIS_FIELDS}&f=json&resultRecordCount=${PAGE_SIZE}&resultOffset=${offset}`;
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`ArcGIS returned ${r.status}`);
  const j = (await r.json()) as ArcGISResponse;
  return j.features ?? [];
}

async function fetchSpills(): Promise<SpillResponse> {
  const allFeatures: ArcGISFeature[] = [];
  let offset = 0;

  // Paginate until we get fewer results than PAGE_SIZE (last page)
  for (let page = 0; page < 20; page++) {
    const batch = await fetchSpillPage(offset);
    allFeatures.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  if (allFeatures.length === 0) {
    throw new Error("ArcGIS returned no sewage overflow records");
  }

  const spills: SpillRecord[] = allFeatures
    .map((f) => ({
      company: f.attributes.waterCompanyName ?? "Unknown",
      site: f.attributes.siteNameEA ?? "Unknown site",
      spillHours: Number(f.attributes.totalDurationAllSpillsHrs ?? 0),
      spillCount: Number(f.attributes.countedSpills ?? 0),
      receivingWater: f.attributes.recievingWaterName ?? "—",
    }))
    .sort((a, b) => b.spillHours - a.spillHours);

  const totalHours = spills.reduce((s, x) => s + x.spillHours, 0);
  const totalCount = spills.reduce((s, x) => s + x.spillCount, 0);
  return { spills, totalHours, totalCount, year: 2024 };
}

export const Route = createFileRoute("/api/sewage")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Annual EDM data — 24h cache to avoid re-fetching multiple ArcGIS pages every 30 min
          const data = await cached("sewage:edm:2024:v1", 24 * 60 * 60_000, fetchSpills);
          return jsonResponse(
            envelope(
              data,
              "Environment Agency — EDM Annual Report 2024",
              "https://www.gov.uk/government/collections/storm-overflow-data",
            ),
          );
        } catch (e) {
          return errorResponse(`Sewage data fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
