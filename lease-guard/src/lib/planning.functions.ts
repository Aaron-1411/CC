import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PlanningResultSchema = z.object({
  postcode: z.string(),
  location: z.object({ lat: z.number(), lng: z.number(), district: z.string() }),
  applications: z.array(
    z.object({
      reference: z.string(),
      description: z.string(),
      status: z.string(),
      dataset: z.string(),
      entryDate: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      typology: z.string().optional(),
      documentUrl: z.string().optional(),
    }),
  ),
  layers: z.object({
    conservationAreas: z.number(),
    listedBuildings: z.number(),
    treePreservationOrders: z.number(),
    article4Directions: z.number(),
    brownfieldSites: z.number(),
  }),
  summary: z.string().describe("Plain-English summary of planning context for this location"),
  coverageNote: z.string(),
});

export type PlanningResult = z.infer<typeof PlanningResultSchema>;

async function resolvePostcode(postcode: string) {
  const clean = postcode.replace(/\s+/g, "").toUpperCase();
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
  if (!res.ok) throw new Error(`Postcode not found: ${postcode}`);
  const data = (await res.json()) as {
    result: { latitude: number; longitude: number; admin_district: string };
  };
  return {
    lat: data.result.latitude,
    lng: data.result.longitude,
    district: data.result.admin_district,
  };
}

const PLANNING_DATASETS = [
  "planning-application",
  "conservation-area",
  "listed-building-outline",
  "tree-preservation-zone",
  "article-4-direction-area",
  "brownfield-land",
] as const;

type DatasetResult = { dataset: string; count: number; entities: PlanningDataEntity[] };

interface PlanningDataEntity {
  reference?: string;
  name?: string;
  description?: string;
  entry_date?: string;
  start_date?: string;
  end_date?: string;
  typology?: string;
  document_url?: string;
  dataset?: string;
}

async function queryPlanningDataset(
  dataset: string,
  lat: number,
  lng: number,
  radius = 500,
): Promise<DatasetResult> {
  const params = new URLSearchParams({
    geometry_reference: `POINT(${lng} ${lat})`,
    geometry_relation: "intersects",
    dataset,
    limit: "20",
    entries_per_resource: "1",
  });

  // Use point + buffer for some datasets
  const url = `https://www.planning.data.gov.uk/api/v1/entity.json?${params}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { dataset, count: 0, entities: [] };
    const json = (await res.json()) as { count: number; entities: PlanningDataEntity[] };
    return { dataset, count: json.count ?? 0, entities: json.entities ?? [] };
  } catch {
    return { dataset, count: 0, entities: [] };
  }
}

async function queryNearbyApplications(lat: number, lng: number): Promise<DatasetResult> {
  // Use a lat/lng bounding box approach for planning applications near a point (~500m)
  const delta = 0.0045; // ~500m at UK latitudes
  const params = new URLSearchParams({
    dataset: "planning-application",
    limit: "20",
    field: "reference,description,entry_date,start_date,end_date,status,document_url",
  });

  // Try geometry_within (bounding box)
  const bbox = `POLYGON((${lng - delta} ${lat - delta},${lng + delta} ${lat - delta},${lng + delta} ${lat + delta},${lng - delta} ${lat + delta},${lng - delta} ${lat - delta}))`;
  const urlWithin = `https://www.planning.data.gov.uk/api/v1/entity.json?${params}&geometry=${encodeURIComponent(bbox)}&geometry_relation=within`;

  try {
    const res = await fetch(urlWithin, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { dataset: "planning-application", count: 0, entities: [] };
    const json = (await res.json()) as { count: number; entities: PlanningDataEntity[] };
    return { dataset: "planning-application", count: json.count ?? 0, entities: json.entities ?? [] };
  } catch {
    return { dataset: "planning-application", count: 0, entities: [] };
  }
}

function buildSummary(
  district: string,
  postcode: string,
  layers: PlanningResult["layers"],
  appCount: number,
): string {
  const parts: string[] = [];
  if (layers.conservationAreas > 0)
    parts.push(`This location falls within a Conservation Area — permitted development rights are significantly restricted`);
  if (layers.listedBuildings > 0)
    parts.push(`${layers.listedBuildings} listed building(s) nearby — any works affecting their setting require Listed Building Consent`);
  if (layers.treePreservationOrders > 0)
    parts.push(`Tree Preservation Orders in this area — any tree works require council approval`);
  if (layers.article4Directions > 0)
    parts.push(`Article 4 Direction(s) active — some permitted development rights (e.g. HMO conversion, extensions) have been removed`);
  if (layers.brownfieldSites > 0)
    parts.push(`Brownfield land in the vicinity — development pressure likely`);
  if (appCount > 0)
    parts.push(`${appCount} planning application(s) recorded near this postcode`);
  if (parts.length === 0)
    return `No major planning constraints or recent applications found near ${postcode} in ${district}. Standard permitted development rights likely apply.`;
  return parts.join(". ") + ".";
}

export const searchPlanning = createServerFn({ method: "POST" })
  .inputValidator((input: { postcode: string }) => {
    return z
      .object({ postcode: z.string().min(3).max(10).transform((s) => s.trim()) })
      .parse(input);
  })
  .handler(async ({ data }) => {
    const location = await resolvePostcode(data.postcode);

    // Parallel: applications + 5 constraint layers
    const [appResult, ...constraintResults] = await Promise.all([
      queryNearbyApplications(location.lat, location.lng),
      queryPlanningDataset("conservation-area", location.lat, location.lng),
      queryPlanningDataset("listed-building-outline", location.lat, location.lng),
      queryPlanningDataset("tree-preservation-zone", location.lat, location.lng),
      queryPlanningDataset("article-4-direction-area", location.lat, location.lng),
      queryPlanningDataset("brownfield-land", location.lat, location.lng),
    ]);

    const [consArea, listed, tpo, art4, brownfield] = constraintResults;

    const layers: PlanningResult["layers"] = {
      conservationAreas: consArea.count,
      listedBuildings: listed.count,
      treePreservationOrders: tpo.count,
      article4Directions: art4.count,
      brownfieldSites: brownfield.count,
    };

    const applications: PlanningResult["applications"] = appResult.entities.slice(0, 15).map((e) => ({
      reference: e.reference ?? "—",
      description: e.description ?? e.name ?? "No description",
      status: (e as { status?: string }).status ?? "Unknown",
      dataset: e.dataset ?? "planning-application",
      entryDate: e.entry_date,
      startDate: e.start_date,
      endDate: e.end_date,
      typology: e.typology,
      documentUrl: e.document_url,
    }));

    const summary = buildSummary(location.district, data.postcode, layers, appResult.count);

    const result: PlanningResult = {
      postcode: data.postcode.toUpperCase(),
      location,
      applications,
      layers,
      summary,
      coverageNote:
        "Planning application data is sourced from DLUHC planning.data.gov.uk. Coverage varies by local authority — not all councils have submitted data. Conservation areas, listed buildings, TPOs and Article 4 Directions are more comprehensively recorded. Always verify with your local planning authority.",
    };

    return PlanningResultSchema.parse(result);
  });
