import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

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
  id?: string;
  title?: string;
  organisationName?: string;
  description?: string;
  valueLow?: number;
  valueHigh?: number;
  awardedValue?: number;
  awardedSupplier?: string;
  awardedDate?: string;
  publishedDate?: string;
  procedureType?: string;
  noticeType?: string;
  status?: string;
  link?: string;
};

function normalise(r: OcdsRelease): Notice {
  const award = r.awards?.[0];
  const tag = r.tag?.[0];
  return {
    id: r.id ?? r.ocid,
    title: r.tender?.title,
    organisationName: r.buyer?.name,
    description: r.tender?.description,
    awardedValue: award?.value?.amount ?? r.tender?.value?.amount,
    awardedSupplier: award?.suppliers?.[0]?.name,
    awardedDate: award?.date ?? award?.datePublished,
    publishedDate: r.date,
    procedureType:
      r.tender?.procurementMethodDetails ?? r.tender?.procurementMethod,
    noticeType: tag ? tag.charAt(0).toUpperCase() + tag.slice(1) : undefined,
    status: r.tender?.status,
    link: award?.documents?.[0]?.url,
  };
}

export const Route = createFileRoute("/api/contracts")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        }),
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            keyword?: string;
          };
          const keyword = (body.keyword ?? "").trim();

          const CF_BASE =
            "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search";

          const upstream = keyword
            ? `${CF_BASE}?keyword=${encodeURIComponent(keyword)}&limit=100`
            : `${CF_BASE}?limit=100`;

          const cacheKey = `cf:search:${keyword || "latest"}`;

          const releases = await cached(
            cacheKey,
            60_000,
            async () => {
              const r = await fetch(upstream, {
                headers: { accept: "application/json" },
              });
              if (!r.ok) {
                const text = await r.text();
                throw new Error(
                  `Contracts Finder ${r.status}: ${text.slice(0, 200)}`,
                );
              }
              const j = (await r.json()) as { releases?: OcdsRelease[] };
              return j.releases ?? [];
            },
          );

          let results = releases.map(normalise);
          results = results.slice(0, 50);

          return jsonResponse(
            envelope(
              { results, totalResults: results.length },
              "Contracts Finder (OCDS)",
              upstream,
            ),
          );
        } catch (e) {
          return errorResponse(`Contracts fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});