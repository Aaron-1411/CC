import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";
import { withSnapshot } from "@/lib/snapshot";

// Environment Agency Bathing Water Quality — keyless linked-data JSON, OGL v3.0.
// Each designated bathing water carries its latest annual classification, a
// real-time pollution-risk prediction, and the water company responsible for
// the local sewerage — the accountability link.
const SOURCE_URL =
  "https://environment.data.gov.uk/doc/bathing-water.json?_pageSize=1000";

type Classification = "Excellent" | "Good" | "Sufficient" | "Poor" | "Closed" | "Unknown";

type BathingWater = {
  name: string;
  company: string;
  region: string;
  district: string;
  classification: Classification;
  classYear: number | null;
  riskLevel: "normal" | "increased" | "none" | "unknown";
  heavyRainImpacted: boolean;
};

type BathingResponse = {
  waters: BathingWater[];
  total: number;
  excellent: number;
  good: number;
  sufficient: number;
  poor: number;
  closed: number;
  increasedRisk: number;
};

type LangVal = { _value?: string } | string | null | undefined;

type RawItem = {
  name?: LangVal;
  appointedSewerageUndertaker?: { name?: LangVal } | null;
  regionalOrganization?: { name?: LangVal } | null;
  district?: Array<{ name?: LangVal } | string> | null;
  waterQualityImpactedByHeavyRain?: boolean | null;
  latestComplianceAssessment?: {
    _about?: string;
    complianceClassification?: { name?: LangVal } | null;
  } | null;
  latestRiskPrediction?: { riskLevel?: { name?: LangVal } | null } | null;
};

type RawResponse = { result?: { items?: RawItem[] } };

function langValue(v: LangVal): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v._value ?? "";
}

// "Northumbrian Water Limited" → "Northumbrian Water"
function tidyCompany(name: string): string {
  return name
    .replace(/\b(Limited|Ltd|Services|Utilities|Cyfyngedig)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim() || name;
}

function asClassification(s: string): Classification {
  switch (s) {
    case "Excellent":
    case "Good":
    case "Sufficient":
    case "Poor":
    case "Closed":
      return s;
    default:
      return "Unknown";
  }
}

function yearFromAbout(about: string | undefined): number | null {
  const m = about?.match(/\/year\/(\d{4})/);
  return m ? Number(m[1]) : null;
}

function firstDistrict(d: RawItem["district"]): string {
  if (!Array.isArray(d)) return "";
  for (const entry of d) {
    if (entry && typeof entry === "object") {
      const n = langValue(entry.name);
      if (n) return n;
    }
  }
  return "";
}

async function fetchBathingWaters(): Promise<BathingResponse> {
  const r = await fetch(SOURCE_URL, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`Environment Agency returned ${r.status}`);
  const j = (await r.json()) as RawResponse;
  const items = j.result?.items ?? [];
  if (items.length === 0) throw new Error("Environment Agency returned no bathing waters");

  const waters: BathingWater[] = items.map((it) => {
    const rawRisk = langValue(it.latestRiskPrediction?.riskLevel?.name);
    const riskLevel =
      rawRisk === "normal" || rawRisk === "increased" || rawRisk === "none"
        ? rawRisk
        : "unknown";
    const company = tidyCompany(langValue(it.appointedSewerageUndertaker?.name)) || "Unknown";
    return {
      name: langValue(it.name) || "Unnamed bathing water",
      company,
      region: langValue(it.regionalOrganization?.name) || "—",
      district: firstDistrict(it.district) || "—",
      classification: asClassification(
        langValue(it.latestComplianceAssessment?.complianceClassification?.name),
      ),
      classYear: yearFromAbout(it.latestComplianceAssessment?._about),
      riskLevel,
      heavyRainImpacted: Boolean(it.waterQualityImpactedByHeavyRain),
    };
  });

  const count = (c: Classification) => waters.filter((w) => w.classification === c).length;

  return {
    waters,
    total: waters.length,
    excellent: count("Excellent"),
    good: count("Good"),
    sufficient: count("Sufficient"),
    poor: count("Poor"),
    closed: count("Closed"),
    increasedRisk: waters.filter((w) => w.riskLevel === "increased").length,
  };
}

export const Route = createFileRoute("/api/bathing-water")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await withSnapshot("bathing_water", () =>
            cached("bathing-water:v1", 6 * 60 * 60_000, fetchBathingWaters),
          );
          return jsonResponse(
            envelope(
              data,
              "Environment Agency — Bathing Water Quality",
              "https://environment.data.gov.uk/bwq/profiles/",
            ),
          );
        } catch (e) {
          return errorResponse(`Bathing water data fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
