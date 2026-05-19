import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

const ARCGIS_URL =
  "https://services.arcgis.com/JJzESW51TqeY9uat/ArcGIS/rest/services/Edm_Storm_Overflow_Annual_Return_data_2023_for_download/FeatureServer/0/query?where=1%3D1&outFields=Company_Name,Site_Name,Total_spill_hours,Total_spill_count,Receiving_Water&f=json&resultRecordCount=100";

const FALLBACK_URL =
  "https://environment.data.gov.uk/water-quality/id/sampling-point.json?_limit=20";

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

async function fetchSpills(): Promise<SpillResponse> {
  let spills: SpillRecord[] = [];

  const r = await fetch(ARCGIS_URL, { headers: { accept: "application/json" } });

  if (r.ok) {
    const j = (await r.json()) as ArcGISResponse;
    const features = j.features ?? [];

    if (features.length > 0 && features[0].attributes?.Company_Name !== undefined) {
      spills = features
        .map((f) => ({
          company: f.attributes.Company_Name ?? "Unknown",
          site: f.attributes.Site_Name ?? "Unknown site",
          spillHours: Number(f.attributes.Total_spill_hours ?? 0),
          spillCount: Number(f.attributes.Total_spill_count ?? 0),
          receivingWater: f.attributes.Receiving_Water ?? "—",
        }))
        .sort((a, b) => b.spillHours - a.spillHours);
    } else {
      // ArcGIS returned OK but unexpected shape — use fallback
      spills = await fetchFallback();
    }
  } else {
    spills = await fetchFallback();
  }

  const totalHours = spills.reduce((s, x) => s + x.spillHours, 0);
  const totalCount = spills.reduce((s, x) => s + x.spillCount, 0);
  return { spills, totalHours, totalCount };
}

type FallbackSamplingPoint = {
  notation?: string;
  label?: string;
  subType?: { label?: string };
  riverName?: string;
};

type FallbackResponse = {
  items?: FallbackSamplingPoint[];
};

async function fetchFallback(): Promise<SpillRecord[]> {
  const r = await fetch(FALLBACK_URL, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`Fallback API returned ${r.status}`);
  const j = (await r.json()) as FallbackResponse;
  return (j.items ?? []).map((item) => ({
    company: item.subType?.label ?? "Environment Agency",
    site: item.label ?? item.notation ?? "Unknown site",
    spillHours: 0,
    spillCount: 0,
    receivingWater: item.riverName ?? "—",
  }));
}

export const Route = createFileRoute("/api/sewage")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await cached("sewage:edm:v1", 30 * 60_000, fetchSpills);
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
