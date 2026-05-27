import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";
import { withSnapshot } from "@/lib/snapshot";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CommitteeReport = {
  id: number;
  title: string;
  summary: string;
  publishedAt: string;
  committee: string;
  committeeId: number;
  house: "Commons" | "Lords" | "Joint";
  url: string;
  inquiry?: string;
};

export type CommitteesData = {
  reports: CommitteeReport[];
};

// ─── Parliament Committees API ────────────────────────────────────────────────

type CommitteePublicationResponse = {
  items: Array<{
    id: number;
    title: string;
    summary?: string;
    publicationDate: string;
    links: Array<{ url: string; contentType: string }>;
    inquiry?: { title: string };
    committee: {
      id: number;
      name: string;
      house: number; // 1=Commons, 2=Lords
    };
  }>;
  totalResults: number;
};

async function fetchCommitteeReports(): Promise<CommitteesData> {
  // Commons and Lords select committee publications — type 4 = "Report"
  const urls = [
    "https://committees.api.parliament.uk/api/v1/Publications?publicationTypes=4&House=Commons&take=30&skip=0",
    "https://committees.api.parliament.uk/api/v1/Publications?publicationTypes=4&House=Lords&take=15&skip=0",
  ];

  const results = await Promise.allSettled(
    urls.map((url) =>
      fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(12_000),
      }).then((r) => {
        if (!r.ok) throw new Error(`Committees API: ${r.status}`);
        return r.json() as Promise<CommitteePublicationResponse>;
      }),
    ),
  );

  const reports: CommitteeReport[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const item of result.value.items ?? []) {
      const house: CommitteeReport["house"] =
        item.committee.house === 1 ? "Commons" : item.committee.house === 2 ? "Lords" : "Joint";
      const link =
        item.links?.find((l) => l.contentType?.includes("html") || l.url?.includes("parliament.uk"))
          ?.url ?? `https://committees.parliament.uk/committee/${item.committee.id}/publications/`;
      reports.push({
        id: item.id,
        title: item.title,
        summary: (item.summary ?? "").slice(0, 300),
        publishedAt: item.publicationDate,
        committee: item.committee.name,
        committeeId: item.committee.id,
        house,
        url: link,
        inquiry: item.inquiry?.title,
      });
    }
  }

  // Sort by date descending
  reports.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return { reports: reports.slice(0, 40) };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/committees")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await withSnapshot("committees_reports", () =>
            cached("committees:reports:v1", 6 * 60 * 60_000, fetchCommitteeReports),
          );
          return jsonResponse(
            envelope(
              data,
              "UK Parliament — Select Committee Reports",
              "https://committees.parliament.uk",
            ),
          );
        } catch (e) {
          return errorResponse(`Committees fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
