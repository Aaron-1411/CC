import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

const CF_BASE = "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search";
const MIN_VALUE = 1_000_000;
const MAX_PAGES = 20; // 20 × 100 = up to 2,000 records scanned

type OcdsRelease = {
  id?: string;
  ocid?: string;
  date?: string;
  tag?: string[];
  tender?: {
    title?: string;
    description?: string;
    status?: string;
    value?: { amount?: number };
    procurementMethod?: string;
    procurementMethodDetails?: string;
  };
  buyer?: { name?: string };
  awards?: Array<{
    date?: string;
    datePublished?: string;
    value?: { amount?: number };
    suppliers?: Array<{ name?: string }>;
    documents?: Array<{ url?: string }>;
  }>;
};

type Notice = {
  id: string;
  title: string;
  organisationName: string;
  description?: string;
  awardedValue: number;
  awardedSupplier: string;
  awardedDate?: string;
  publishedDate?: string;
  procedureType?: string;
  noticeType?: string;
  link?: string;
};

function normalise(r: OcdsRelease): Notice | null {
  const award = r.awards?.[0];
  const value = award?.value?.amount ?? r.tender?.value?.amount ?? 0;
  if (value < MIN_VALUE) return null;

  const tag = r.tag?.[0] ?? "";
  // Only include award notices
  if (!tag.toLowerCase().includes("award") && !r.awards?.length) return null;

  return {
    id: r.id ?? r.ocid ?? Math.random().toString(),
    title: r.tender?.title ?? "Untitled",
    organisationName: r.buyer?.name ?? "Unknown department",
    description: r.tender?.description,
    awardedValue: value,
    awardedSupplier: award?.suppliers?.[0]?.name ?? "—",
    awardedDate: award?.date ?? award?.datePublished,
    publishedDate: r.date,
    procedureType: r.tender?.procurementMethodDetails ?? r.tender?.procurementMethod,
    noticeType: tag ? tag.charAt(0).toUpperCase() + tag.slice(1) : undefined,
    link: award?.documents?.[0]?.url,
  };
}

function tenMonthsAgo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 10);
  return d.toISOString().slice(0, 10);
}

async function fetchAllMajorContracts(): Promise<Notice[]> {
  const results: Notice[] = [];
  let nextUrl: string | null = `${CF_BASE}?publishedFrom=${tenMonthsAgo()}&limit=100`;

  for (let page = 0; page < MAX_PAGES && nextUrl; page++) {
    const r = await fetch(nextUrl, { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`Contracts Finder ${r.status}`);
    const j = (await r.json()) as {
      releases?: OcdsRelease[];
      links?: { next?: string };
    };

    for (const release of j.releases ?? []) {
      const n = normalise(release);
      if (n) results.push(n);
    }

    nextUrl = j.links?.next ?? null;
  }

  return results.sort((a, b) => b.awardedValue - a.awardedValue);
}

export const Route = createFileRoute("/api/contracts")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        }),

      // GET — load all £1mn+ contracts from last 10 months
      GET: async () => {
        try {
          const data = await cached("cf:major:v1", 60 * 60_000, fetchAllMajorContracts);
          const totalValue = data.reduce((s, n) => s + n.awardedValue, 0);
          return jsonResponse(
            envelope(
              { results: data, totalResults: data.length, totalValue },
              "Contracts Finder — Cabinet Office (OCDS)",
              CF_BASE,
            ),
          );
        } catch (e) {
          return errorResponse(`Contracts fetch failed: ${(e as Error).message}`);
        }
      },

      // POST — keyword search across full database
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as { keyword?: string };
          const keyword = (body.keyword ?? "").trim();
          const cacheKey = `cf:search:${keyword || "latest"}`;

          const upstream = keyword
            ? `${CF_BASE}?keyword=${encodeURIComponent(keyword)}&limit=100`
            : `${CF_BASE}?limit=100`;

          const releases = await cached(cacheKey, 60_000, async () => {
            const r = await fetch(upstream, { headers: { accept: "application/json" } });
            if (!r.ok) throw new Error(`Contracts Finder ${r.status}`);
            const j = (await r.json()) as { releases?: OcdsRelease[] };
            return j.releases ?? [];
          });

          const results = releases
            .map((r) => {
              const award = r.awards?.[0];
              const tag = r.tag?.[0];
              return {
                id: r.id ?? r.ocid,
                title: r.tender?.title ?? "Untitled",
                organisationName: r.buyer?.name ?? "—",
                description: r.tender?.description,
                awardedValue: award?.value?.amount ?? r.tender?.value?.amount,
                awardedSupplier: award?.suppliers?.[0]?.name ?? "—",
                awardedDate: award?.date ?? award?.datePublished,
                publishedDate: r.date,
                procedureType: r.tender?.procurementMethodDetails ?? r.tender?.procurementMethod,
                noticeType: tag ? tag.charAt(0).toUpperCase() + tag.slice(1) : undefined,
                link: award?.documents?.[0]?.url,
              };
            })
            .slice(0, 50);

          return jsonResponse(
            envelope({ results, totalResults: results.length }, "Contracts Finder (OCDS)", upstream),
          );
        } catch (e) {
          return errorResponse(`Contracts search failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
