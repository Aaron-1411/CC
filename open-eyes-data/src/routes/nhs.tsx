import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ActionBar, Card, ContextBlock, DataProvenance, ErrorNote, FlagPill, LiveBadge, SectionHeader, Skeleton, Stat } from "@/components/primitives";
import { getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/nhs")({
  head: () => ({
    meta: [
      { title: "NHS A&E Performance — transparenC" },
      {
        name: "description",
        content:
          "A&E waiting times against the 95% four-hour target. The NHS has missed its own target for over a decade.",
      },
      { property: "og:title", content: "NHS A&E Performance — transparenC" },
    ],
  }),
  component: NHSPage,
});

type Publication = {
  title: string;
  link: string;
  date: string;
  summary: string;
};

type ContextStat = {
  label: string;
  value: string;
  target?: string;
  context: string;
};

type NHSData = {
  publications: Publication[];
  stats: ContextStat[];
};

function NHSPage() {
  const q = useQuery({
    queryKey: ["nhs-ae"],
    queryFn: () => getJSON<NHSData>("/api/nhs"),
    staleTime: 60 * 60_000,
  });

  const stats = q.data?.data.stats ?? [];
  const publications = q.data?.data.publications ?? [];

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="NHS Performance"
          title="NHS A&E Performance"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          A&E waiting times against the{" "}
          <span className="text-amber font-mono">95%</span> four-hour target.
          The NHS has missed its own target for over a decade.
        </p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {q.isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border bg-surface rounded-lg p-4">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32 mt-2" />
            </div>
          ))}

        {!q.isLoading &&
          stats.map((s) => {
            const isBelowTarget = s.target != null;
            return (
              <Stat
                key={s.label}
                label={s.label}
                value={
                  <span>
                    {s.value}
                    {s.target && (
                      <span className="text-flag text-base font-mono ml-2">
                        / {s.target} target
                      </span>
                    )}
                  </span>
                }
                accent={isBelowTarget ? "flag" : "amber"}
                hint={s.context}
              />
            );
          })}
      </div>

      {/* What this means */}
      {!q.isLoading && (
        <ContextBlock heading="The NHS has missed its own A&E target every single month since July 2015 — nearly a decade" variant="critical">
          <p>
            The target is that <strong className="text-foreground">95% of A&E patients</strong> should be seen,
            treated, admitted or discharged within 4 hours. In early 2025 the figure was around{" "}
            <strong className="text-foreground">76%</strong> — meaning roughly 1 in 4 patients waits longer
            than 4 hours. That gap represents hundreds of thousands of people per month.
          </p>
          <p>
            Nine different Health Secretaries have held the post since the target was last met. The NHS waiting
            list peaked at <strong className="text-foreground">7.8 million</strong> in 2023 and has only
            partially reduced. Labour's manifesto promised 2 million extra appointments per week. The NHS
            England tracking data below shows whether publications confirm that progress.
          </p>
        </ContextBlock>
      )}

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* Publications */}
      <div>
        <h3 className="font-display text-xl font-bold mb-3">
          Latest A&E Statistics Publications
        </h3>
        <p className="text-xs text-muted-foreground label-mono mb-4">
          From NHS England published statistics releases
        </p>

        {q.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-1/3" />
              </Card>
            ))}
          </div>
        )}

        {!q.isLoading && publications.length === 0 && !q.error && (
          <Card>
            <p className="text-muted-foreground text-sm">
              No publications available. Visit{" "}
              <a
                href="https://www.england.nhs.uk/statistics/statistical-work-areas/ae-waiting-times-and-activity/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-amber"
              >
                NHS England statistics
              </a>{" "}
              for the latest A&E data.
            </p>
          </Card>
        )}

        <div className="grid gap-3">
          {!q.isLoading &&
            publications.map((pub, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <FlagPill variant="neutral">NHS England</FlagPill>
                      {pub.date && (
                        <span className="label-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                          {relTime(pub.date)}
                        </span>
                      )}
                    </div>
                    <h4 className="font-display text-base font-semibold leading-snug">
                      <a
                        href={pub.link}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-amber"
                      >
                        {pub.title}
                      </a>
                    </h4>
                    {pub.summary && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {pub.summary}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <a
                      href={pub.link}
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
        </div>
      </div>

      <ActionBar
        mpTopic="NHS waiting times, A&E performance and waiting list reduction"
        briefingTopic="NHS England A&E performance, waiting list and Labour's 2 million appointments pledge"
        shareText="The NHS has missed its A&E 4-hour target every month since 2015"
      />

      <DataProvenance
        source="NHS England — A&E Attendances and Emergency Admissions"
        url="https://www.england.nhs.uk/statistics/statistical-work-areas/ae-waiting-times-and-activity/"
        licence="Open Government Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
