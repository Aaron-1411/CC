import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

type Publication = {
  title: string;
  description?: string;
  link: string;
  publishedDate: string;
  department: string;
};

type ContextStat = {
  label: string;
  value: string;
  notes: string;
};

type SanctionsData = {
  publications: Publication[];
  contextStats: ContextStat[];
};

const CONTEXT_STATS: ContextStat[] = [
  {
    label: "Total sanctions applied per year",
    value: "~800,000",
    notes:
      "2023/24 figures from DWP Benefit Sanctions Statistics. See gov.uk/government/collections/benefit-sanctions-statistics",
  },
  {
    label: "Universal Credit sanctions",
    value: "Majority",
    notes:
      "Universal Credit accounts for the majority of all benefit sanctions applied. UC claimants face stricter conditionality requirements.",
  },
  {
    label: "Most common sanction reason",
    value: "Missed appointment",
    notes:
      "Failure to attend a mandatory interview or appointment is the most frequently cited reason for a sanction under DWP data.",
  },
];

async function fetchSanctionsData(): Promise<SanctionsData> {
  const publications: Publication[] = [];
  const seen = new Set<string>();

  // Primary: DWP sanctions statistics publications
  try {
    const res1 = await fetch(
      "https://www.gov.uk/api/search.json?filter_organisations=department-for-work-pensions&q=benefit+sanctions+statistics&count=15&fields%5B%5D=title,description,public_timestamp,link",
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) },
    );
    if (res1.ok) {
      const data = (await res1.json()) as {
        results?: Array<{
          title: string;
          description?: string;
          public_timestamp?: string;
          link: string;
        }>;
      };
      for (const item of data.results ?? []) {
        if (item.link && !seen.has(item.link)) {
          seen.add(item.link);
          publications.push({
            title: item.title ?? "Untitled",
            description: item.description,
            link: item.link,
            publishedDate: item.public_timestamp ?? "",
            department: "Department for Work and Pensions",
          });
        }
      }
    }
  } catch {
    // fallthrough
  }

  // Secondary: statistics-announcement type search
  try {
    const res2 = await fetch(
      "https://www.gov.uk/api/search.json?q=benefits+sanctions&filter_document_type=statistics-announcement&count=10&fields%5B%5D=title,description,public_timestamp,link",
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) },
    );
    if (res2.ok) {
      const data = (await res2.json()) as {
        results?: Array<{
          title: string;
          description?: string;
          public_timestamp?: string;
          link: string;
        }>;
      };
      for (const item of data.results ?? []) {
        if (item.link && !seen.has(item.link)) {
          seen.add(item.link);
          publications.push({
            title: item.title ?? "Untitled",
            description: item.description,
            link: item.link,
            publishedDate: item.public_timestamp ?? "",
            department: "Department for Work and Pensions",
          });
        }
      }
    }
  } catch {
    // ignore
  }

  return {
    publications: publications.slice(0, 20),
    contextStats: CONTEXT_STATS,
  };
}

export const Route = createFileRoute("/api/sanctions")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await cached("sanctions:v1", 30 * 60_000, fetchSanctionsData);
          return jsonResponse(
            envelope(
              data,
              "Department for Work and Pensions — Benefit Sanctions Statistics",
              "https://www.gov.uk/government/collections/benefit-sanctions-statistics",
            ),
          );
        } catch (e) {
          return errorResponse(`Sanctions fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
