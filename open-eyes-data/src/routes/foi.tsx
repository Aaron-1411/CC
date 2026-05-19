import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, DataProvenance, ErrorNote, FlagPill, LiveBadge, SectionHeader, Skeleton } from "@/components/primitives";
import { fmtNumber, getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/foi")({
  head: () => ({
    meta: [
      { title: "FOI Refusal League Table — transparenC" },
      {
        name: "description",
        content:
          "Freedom of Information requests that have been refused or where information was not held. Which public bodies refuse the most requests?",
      },
      { property: "og:title", content: "FOI Refusal League Table — transparenC" },
    ],
  }),
  component: FOIPage,
});

type RefusalRecord = {
  id: number;
  title: string;
  bodyName: string;
  state: string;
  date: string;
  url: string;
};

type BodyRefusalCount = {
  bodyName: string;
  refusedCount: number;
  requests: RefusalRecord[];
};

type FOIData = {
  refusals: BodyRefusalCount[];
  recentRefusals: RefusalRecord[];
};

function stateLabel(state: string): string {
  if (state === "not_held") return "Not held";
  if (state === "refused") return "Refused";
  return state.replace(/_/g, " ");
}

function FOIPage() {
  const q = useQuery({
    queryKey: ["foi-refusals"],
    queryFn: () => getJSON<FOIData>("/api/foi"),
    staleTime: 30 * 60_000,
  });

  const refusals = q.data?.data.refusals ?? [];
  const recentRefusals = q.data?.data.recentRefusals ?? [];

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
          Freedom of Information requests that have been refused or where information was not held.
          Which public bodies refuse the most requests?
        </p>
      </div>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* League table */}
      <div>
        <h3 className="font-display text-xl font-bold mb-3">
          Top Refusing Bodies
        </h3>
        <p className="text-xs text-muted-foreground label-mono mb-4">
          Grouped by public body — refused or information not held — from WhatDoTheyKnow
        </p>

        {q.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-6 shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <Skeleton className="h-6 w-8 shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!q.isLoading && refusals.length === 0 && !q.error && (
          <Card>
            <p className="text-muted-foreground text-sm">
              No refusal data available from WhatDoTheyKnow at this time.
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
                    <div className="label-mono text-sm font-bold text-muted-foreground w-6 text-right shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-display text-sm font-semibold truncate">
                          {body.bodyName}
                        </span>
                        <span className="label-mono text-sm font-bold text-flag shrink-0">
                          {fmtNumber(body.refusedCount)}
                        </span>
                      </div>
                      <div className="relative h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-flag/60 rounded-full transition-all"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Recent refused/withheld requests */}
      <div>
        <h3 className="font-display text-xl font-bold mb-3">
          Recent Refused & Not-Held Requests
        </h3>
        <p className="text-xs text-muted-foreground label-mono mb-4">
          Most recent FOI requests refused or marked as information not held
        </p>

        {q.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-1" />
                <Skeleton className="h-3 w-1/4" />
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-3">
          {!q.isLoading &&
            recentRefusals.map((req) => (
              <Card key={req.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <FlagPill variant="neutral">{req.bodyName}</FlagPill>
                      <FlagPill variant="direct">{stateLabel(req.state)}</FlagPill>
                      {req.date && (
                        <span className="label-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                          {relTime(req.date)}
                        </span>
                      )}
                    </div>
                    <h4 className="font-display text-base font-semibold leading-snug">
                      <a
                        href={req.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-amber"
                      >
                        {req.title}
                      </a>
                    </h4>
                  </div>
                  <div className="shrink-0">
                    <a
                      href={req.url}
                      target="_blank"
                      rel="noreferrer"
                      className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
                    >
                      View →
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          {!q.isLoading && recentRefusals.length === 0 && !q.error && (
            <Card>
              <p className="text-muted-foreground text-sm">
                No recent refusal data available.
              </p>
            </Card>
          )}
        </div>
      </div>

      <DataProvenance
        source="WhatDoTheyKnow — mySociety"
        url="https://www.whatdotheyknow.com"
        licence="Creative Commons Attribution License"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
