import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

const GOVUK_SEARCH = "https://www.gov.uk/api/search.json";

type GovUKResult = {
  title?: string;
  description?: string;
  link?: string;
  public_timestamp?: string;
  organisations?: Array<{ title?: string; slug?: string }>;
};

type GovUKSearchResp = {
  results: GovUKResult[];
  total: number;
};

export type Meeting = {
  title: string;
  description?: string;
  link: string;
  publishedDate: string;
  department: string;
};

async function fetchMeetings(): Promise<{ meetings: Meeting[]; total: number }> {
  const fields = "fields%5B%5D=title&fields%5B%5D=description&fields%5B%5D=public_timestamp&fields%5B%5D=link&fields%5B%5D=organisations";

  // Attempt 1: transparency-data document type, ministerial meetings query
  let resp = await fetch(
    `${GOVUK_SEARCH}?filter_document_type=transparency-data&q=ministerial+meetings&count=20&${fields}`,
  );
  let json: GovUKSearchResp = resp.ok ? await resp.json() : { results: [], total: 0 };

  // Attempt 2: broader document types
  if (!json.results?.length) {
    resp = await fetch(
      `${GOVUK_SEARCH}?filter_any_document_type%5B%5D=transparency-data&filter_any_document_type%5B%5D=transparency&q=quarterly+meetings&count=20&${fields}`,
    );
    json = resp.ok ? await resp.json() : { results: [], total: 0 };
  }

  // Attempt 3: open keyword search fallback
  if (!json.results?.length) {
    resp = await fetch(
      `${GOVUK_SEARCH}?q=ministerial+meetings+transparency&count=20&${fields}`,
    );
    if (!resp.ok) throw new Error(`GOV.UK search ${resp.status}`);
    json = await resp.json();
  }

  const meetings: Meeting[] = (json.results ?? []).map((r) => {
    const orgs = r.organisations ?? [];
    const department =
      orgs[0]?.title ??
      (r.link ? r.link.split("/").filter(Boolean).slice(-2, -1)[0] ?? "Government" : "Government");

    return {
      title: r.title ?? "Untitled",
      description: r.description,
      link: r.link ? `https://www.gov.uk${r.link.startsWith("/") ? r.link : `/${r.link}`}` : "#",
      publishedDate: r.public_timestamp ?? "",
      department,
    };
  });

  // Sort by date descending
  meetings.sort(
    (a, b) =>
      new Date(b.publishedDate || 0).getTime() - new Date(a.publishedDate || 0).getTime(),
  );

  return { meetings, total: json.total ?? meetings.length };
}

export const Route = createFileRoute("/api/meetings")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await cached("meetings:v1", 30 * 60_000, fetchMeetings);
          return jsonResponse(
            envelope(
              data,
              "GOV.UK — Cabinet Office Transparency Data",
              "https://www.gov.uk/government/collections/ministers-transparency-returns",
            ),
          );
        } catch (e) {
          return errorResponse(`Meetings fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
