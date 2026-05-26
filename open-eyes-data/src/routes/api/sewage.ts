import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

const ARCGIS_BASE =
  "https://services.arcgis.com/JJzESW51TqeY9uat/ArcGIS/rest/services/Edm_Storm_Overflow_Annual_Return_data_2023_for_download/FeatureServer/0/query";
const ARCGIS_FIELDS = "Company_Name,Site_Name,Total_spill_hours,Total_spill_count,Receiving_Water";
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
};

type ArcGISFeature = {
  attributes: {
    Company_Name?: string | null;
    Site_Name?: string | null;
    Total_spill_hours?: number | null;
    Total_spill_count?: number | null;
    Receiving_Water?: string | null;
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
      company: f.attributes.Company_Name ?? "Unknown",
      site: f.attributes.Site_Name ?? "Unknown site",
      spillHours: Number(f.attributes.Total_spill_hours ?? 0),
      spillCount: Number(f.attributes.Total_spill_count ?? 0),
      receivingWater: f.attributes.Receiving_Water ?? "—",
    }))
    .sort((a, b) => b.spillHours - a.spillHours);

  const totalHours = spills.reduce((s, x) => s + x.spillHours, 0);
  const totalCount = spills.reduce((s, x) => s + x.spillCount, 0);
  return { spills, totalHours, totalCount };
}

export const Route = createFileRoute("/api/sewage")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Annual EDM data — 24h cache to avoid re-fetching 20 ArcGIS pages every 30 min
          const data = await cached("sewage:edm:v1", 24 * 60 * 60_000, fetchSpills);
          return jsonResponse(
            envelope(
              data,
              "Environment Agency — EDM Annual Report 2023",
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
