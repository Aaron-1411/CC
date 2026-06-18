import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

const CF_BASE = "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search";
const MIN_VALUE = 1_000_000;
const WINDOW_MONTHS = 10;
const MAX_PAGES = 25; // 25 × 100 = up to 2,500 award notices scanned per (hourly-cached) refresh
const PAGE_DELAY_MS = 120; // polite spacing between pages to avoid upstream 429s

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
    status?: string;
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

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function windowStart(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - WINDOW_MONTHS);
  return d;
}

function windowStartISO(): string {
  return windowStart().toISOString().slice(0, 10);
}

/**
 * Convert one OCDS release into a Notice, applying every correctness gate.
 * Returns null for anything that is NOT a major, recently-awarded contract:
 *  - must carry an "award" tag AND an actual award object (drops tenders/RfQs/opportunities)
 *  - the award must be active (drops cancelled/pending awards)
 *  - value is taken from the AWARD only — never the tender estimate, which is a
 *    framework ceiling and badly inflated headline figures (up to billions)
 *  - the AWARD DATE must fall inside the rolling 10-month window. Filtering on the
 *    publish date alone let awards made years ago (back to 2021) leak in.
 */
function normalise(r: OcdsRelease, windowStartMs: number): Notice | null {
  const isAward = (r.tag ?? []).some((t) => t.toLowerCase().includes("award"));
  const award = r.awards?.[0];
  if (!isAward || !award) return null;

  // Active awards only — skip cancelled, pending or unsuccessful awards.
  if (award.status && award.status.toLowerCase() !== "active") return null;

  // Award value ONLY. No tender-estimate fallback.
  const value = award.value?.amount ?? 0;
  if (value < MIN_VALUE) return null;

  // The award itself must have been made within the last 10 months.
  const awardedDate = award.date ?? award.datePublished;
  if (!awardedDate) return null;
  const awardedMs = new Date(awardedDate).getTime();
  if (Number.isNaN(awardedMs) || awardedMs < windowStartMs) return null;

  const tag = r.tag?.[0] ?? "";
  return {
    id: r.ocid ?? r.id ?? Math.random().toString(),
    title: r.tender?.title ?? "Untitled",
    organisationName: r.buyer?.name ?? "Unknown department",
    description: r.tender?.description,
    awardedValue: value,
    awardedSupplier: award.suppliers?.[0]?.name ?? "—",
    awardedDate,
    publishedDate: r.date,
    procedureType: r.tender?.procurementMethodDetails ?? r.tender?.procurementMethod,
    noticeType: tag ? tag.charAt(0).toUpperCase() + tag.slice(1) : undefined,
    link: award.documents?.[0]?.url,
  };
}

/**
 * Fetch with exponential backoff on HTTP 429. The Contracts Finder OCDS API
 * throttles rapid pagination; rather than throwing (and losing the whole
 * dataset) we retry a few times, then return null so the caller can stop and
 * serve the partial results it already gathered.
 */
async function fetchWithBackoff(url: string, maxRetries = 3): Promise<Response | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (r.status === 429) {
      if (attempt === maxRetries) return null;
      await sleep(500 * 2 ** attempt); // 0.5s, 1s, 2s
      continue;
    }
    if (!r.ok) throw new Error(`Contracts Finder ${r.status}`);
    return r;
  }
  return null;
}

type ContractsPayload = {
  results: Notice[];
  totalResults: number;
  totalValue: number;
  recordsScanned: number;
  pagesScanned: number;
  partial: boolean;
  windowStart: string;
  earliestAward?: string;
  latestAward?: string;
};

async function fetchAllMajorContracts(): Promise<ContractsPayload> {
  const windowStartMs = windowStart().getTime();
  // Dedupe by ocid (one contracting process). Award + awardUpdate notices share
  // an ocid; keep whichever release was published most recently.
  const byOcid = new Map<string, { notice: Notice; publishedMs: number }>();

  // stages=award filters server-side to award/awardUpdate notices — the single
  // biggest correctness win, since it removes every tender and opportunity notice.
  let nextUrl: string | null = `${CF_BASE}?publishedFrom=${windowStartISO()}&stages=award&limit=100`;
  let pagesScanned = 0;
  let recordsScanned = 0;
  let partial = false;

  for (let page = 0; page < MAX_PAGES && nextUrl; page++) {
    if (page > 0) await sleep(PAGE_DELAY_MS);

    const r = await fetchWithBackoff(nextUrl);
    if (!r) {
      // Upstream throttled us past our retry budget — stop and serve partials.
      partial = true;
      break;
    }
    pagesScanned++;

    const j = (await r.json()) as { releases?: OcdsRelease[]; links?: { next?: string } };
    const releases = j.releases ?? [];
    recordsScanned += releases.length;

    for (const release of releases) {
      const n = normalise(release, windowStartMs);
      if (!n) continue;
      const key = release.ocid ?? n.id;
      const publishedMs = new Date(release.date ?? 0).getTime();
      const existing = byOcid.get(key);
      if (!existing || publishedMs >= existing.publishedMs) {
        byOcid.set(key, { notice: n, publishedMs });
      }
    }

    nextUrl = j.links?.next ?? null;
  }

  // If we exhausted our page budget but the feed still had more pages, the view
  // is necessarily a partial (most-recently-published) slice — say so honestly.
  if (nextUrl) partial = true;

  const results = Array.from(byOcid.values())
    .map((v) => v.notice)
    .sort((a, b) => b.awardedValue - a.awardedValue);

  const awardDates = results
    .map((n) => n.awardedDate)
    .filter((d): d is string => Boolean(d))
    .sort();

  return {
    results,
    totalResults: results.length,
    totalValue: results.reduce((s, n) => s + n.awardedValue, 0),
    recordsScanned,
    pagesScanned,
    partial,
    windowStart: windowStartISO(),
    earliestAward: awardDates[0],
    latestAward: awardDates[awardDates.length - 1],
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
            "access-control-allow-methods": "GET, POST, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        }),

      // GET — major (£1mn+) contract AWARDS made in the last 10 months.
      GET: async () => {
        try {
          const payload = await cached("cf:major:v2", 60 * 60_000, fetchAllMajorContracts);
          return jsonResponse(
            envelope(payload, "Contracts Finder — Cabinet Office (OCDS)", CF_BASE),
          );
        } catch (e) {
          return errorResponse(`Contracts fetch failed: ${(e as Error).message}`);
        }
      },

      // POST — keyword search across recently-published award notices.
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as { keyword?: string };
          const keyword = (body.keyword ?? "").trim();
          const cacheKey = `cf:search:${keyword || "latest"}`;

          const upstream = keyword
            ? `${CF_BASE}?keyword=${encodeURIComponent(keyword)}&stages=award&limit=100`
            : `${CF_BASE}?stages=award&limit=100`;

          const releases = await cached(cacheKey, 60_000, async () => {
            const r = await fetchWithBackoff(upstream);
            if (!r) throw new Error("Contracts Finder 429 (rate limited)");
            const j = (await r.json()) as { releases?: OcdsRelease[] };
            return j.releases ?? [];
          });

          const results = releases
            .map((r) => {
              const award = r.awards?.[0];
              const tag = r.tag?.[0];
              return {
                id: r.ocid ?? r.id,
                title: r.tender?.title ?? "Untitled",
                organisationName: r.buyer?.name ?? "—",
                description: r.tender?.description,
                awardedValue: award?.value?.amount, // award value only — no tender-estimate fallback
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
