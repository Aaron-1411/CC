import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, DataProvenance, ErrorNote, LiveBadge, SectionHeader, Skeleton, Stat } from "@/components/primitives";
import { fmtNumber, getJSON } from "@/lib/api";

export const Route = createFileRoute("/foi")({
  head: () => ({
    meta: [
      { title: "FOI Refusal League Table — transparenC" },
      {
        name: "description",
        content:
          "Official government statistics on Freedom of Information refusals. Which public bodies refuse the most requests?",
      },
      { property: "og:title", content: "FOI Refusal League Table — transparenC" },
    ],
  }),
  component: FOIPage,
});

type BodyRefusalCount = {
  bodyName: string;
  refusedCount: number;
  totalReceived: number;
  withheldPct: number;
};

type FOIData = {
  refusals: BodyRefusalCount[];
  year: number;
  totalRequests: number;
  totalWithheld: number;
  // Legacy fields kept for compat
  recentRefusals?: unknown[];
};

function FOIPage() {
  const q = useQuery({
    queryKey: ["foi-refusals"],
    queryFn: () => getJSON<FOIData>("/api/foi"),
    staleTime: 60 * 60_000,
  });

  const refusals = q.data?.data.refusals ?? [];
  const year = q.data?.data.year;
  const totalRequests = q.data?.data.totalRequests ?? 0;
  const totalWithheld = q.data?.data.totalWithheld ?? 0;
  const withholdRate = totalRequests > 0 ? ((totalWithheld / totalRequests) * 100).toFixed(1) : "—";

  const maxCount = useMemo(
    () => Math.max(1, ...refusals.map((r) => r.refusedCount)),
    [refusals],
  );

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Freedom of Information"
          title="FOI Refusal League Table"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Official Cabinet Office statistics on Freedom of Information requests — which public bodies
          fully withhold the most information.{year ? ` Data for ${year}.` : ""}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat
          label="Total requests"
          value={fmtNumber(totalRequests)}
          accent="amber"
          loading={q.isLoading}
        />
        <Stat
          label="Fully withheld"
          value={fmtNumber(totalWithheld)}
          accent="flag"
          loading={q.isLoading}
        />
        <Stat
          label="Withhold rate"
          value={q.isLoading ? "—" : `${withholdRate}%`}
          loading={q.isLoading}
        />
      </div>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* League table */}
      <div>
        <h3 className="font-display text-xl font-bold mb-1">
          Top Bodies by Full Refusals
        </h3>
        <p className="text-xs text-muted-foreground label-mono mb-4">
          Number of requests fully withheld · {year ?? "Latest year"} · 30 highest
        </p>

        {q.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i}>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-6 shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <Skeleton className="h-6 w-12 shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!q.isLoading && refusals.length === 0 && !q.error && (
          <Card>
            <p className="text-muted-foreground text-sm">
              No refusal data available at this time.
            </p>
          </Card>
        )}

        <div className="grid gap-2">
          {!q.isLoading &&
            refusals.map((body, i) => {
              const barPct = Math.round((body.refusedCount / maxCount) * 100);
              return (
                <Card key={body.bodyName} className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="label-mono text-sm font-bold text-muted-foreground w-7 text-right shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-display text-sm font-semibold truncate">
                          {body.bodyName}
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          {body.withheldPct > 0 && (
                            <span className="label-mono text-[11px] text-muted-foreground">
                              {body.withheldPct}%
                            </span>
                          )}
                          <span className="label-mono text-sm font-bold text-flag">
                            {fmtNumber(body.refusedCount)}
                          </span>
                        </div>
                      </div>
                      <div className="relative h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-flag/60 rounded-full transition-all"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <div className="label-mono text-[10px] text-muted-foreground mt-1">
                        {fmtNumber(body.totalReceived)} requests received
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>

      <DataProvenance
        source="Cabinet Office — Freedom of Information Statistics"
        url="https://www.gov.uk/government/statistics/freedom-of-information-statistics-annual-2025"
        licence="Open Government Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
