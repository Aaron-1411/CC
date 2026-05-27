import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  ActionBar,
  Card,
  DataProvenance,
  ErrorNote,
  FlagPill,
  LiveBadge,
  SectionHeader,
  Skeleton,
} from "@/components/primitives";
import { fmtNumber, getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Ministerial Meetings & Transparency — transparenC" },
      {
        name: "description",
        content:
          "Quarterly transparency returns published by government departments showing who ministers have met. Required to be published under the Ministerial Code.",
      },
    ],
  }),
  component: MeetingsPage,
});

type Meeting = {
  title: string;
  description?: string;
  link: string;
  publishedDate: string;
  department: string;
};

type MeetingsResp = {
  meetings: Meeting[];
  total: number;
};

function MeetingsPage() {
  const [filter, setFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const q = useQuery({
    queryKey: ["meetings"],
    queryFn: () => getJSON<MeetingsResp>("/api/meetings"),
    staleTime: 30 * 60_000,
  });

  const all = q.data?.data.meetings ?? [];

  const departments = useMemo(() => {
    const depts = Array.from(new Set(all.map((m) => m.department))).sort();
    return depts;
  }, [all]);

  const displayed = useMemo(() => {
    let list = all;
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter((m) =>
        [m.title, m.description, m.department]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(f)),
      );
    }
    if (deptFilter) {
      list = list.filter((m) => m.department === deptFilter);
    }
    return list;
  }, [all, filter, deptFilter]);

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Ministerial Transparency"
          title="Ministerial Meetings & Transparency"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Quarterly transparency returns published by government departments showing who ministers
          have met. Required to be published under the Ministerial Code.
        </p>
      </div>

      {/* Summary stat */}
      {q.data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Returns found
            </div>
            <div className="font-display text-3xl font-bold text-amber mt-1">
              {fmtNumber(displayed.length)}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Departments
            </div>
            <div className="font-display text-3xl font-bold mt-1">
              {fmtNumber(departments.length)}
            </div>
          </div>
          {q.data.data.meetings[0]?.publishedDate && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Most recent
              </div>
              <div className="font-display text-lg font-bold mt-1 leading-tight">
                {relTime(q.data.data.meetings[0].publishedDate) || "—"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by title, description, or department…"
            className="flex-1 min-w-[240px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
          />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none min-w-[200px]"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        {(filter || deptFilter) && (
          <div className="mt-2 label-mono text-xs text-muted-foreground">
            Showing {displayed.length} of {all.length} returns
            {deptFilter && ` · ${deptFilter}`}
          </div>
        )}
      </Card>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* Loading skeletons */}
      {q.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </Card>
          ))}
        </div>
      )}

      {/* Meeting cards */}
      {!q.isLoading && (
        <div className="grid gap-3">
          {displayed.map((m, i) => (
            <MeetingCard key={`${m.link}-${i}`} meeting={m} />
          ))}
          {displayed.length === 0 && !q.error && (
            <div className="text-muted-foreground text-sm py-12 text-center">
              {filter || deptFilter
                ? "No meetings match your search."
                : "No ministerial meetings data available."}
            </div>
          )}
        </div>
      )}

      <ActionBar
        mpTopic="ministerial meetings transparency and lobbying access to government"
        briefingTopic="UK ministerial meetings transparency returns — who has access to government ministers"
        shareText="See which companies and lobbyists are getting access to UK government ministers"
      />

      <DataProvenance
        source="GOV.UK — Cabinet Office Transparency Data"
        url="https://www.gov.uk/government/collections/ministers-transparency-returns"
        licence="Open Government Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const published = meeting.publishedDate
    ? new Date(meeting.publishedDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <FlagPill variant="neutral">{meeting.department}</FlagPill>
          </div>
          <h3 className="font-display text-base sm:text-lg font-semibold leading-snug">
            <a
              href={meeting.link}
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber transition-colors"
            >
              {meeting.title}
            </a>
          </h3>
          {meeting.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{meeting.description}</p>
          )}
        </div>
        {published && (
          <div className="shrink-0 text-right label-mono text-xs text-muted-foreground">
            <div>{published}</div>
            {meeting.publishedDate && (
              <div className="text-[10px] mt-0.5">{relTime(meeting.publishedDate)}</div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
