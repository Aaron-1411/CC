import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, DataProvenance, ErrorNote, FlagPill, LiveBadge, SectionHeader, Skeleton, Stat } from "@/components/primitives";
import { getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/sanctions")({
  head: () => ({
    meta: [
      { title: "Benefits Sanctions Tracker — transparenC" },
      {
        name: "description",
        content:
          "DWP applies sanctions (benefit cuts) to claimants for failing conditionality requirements. Critics argue the system is punitive and targets the most vulnerable.",
      },
      { property: "og:title", content: "Benefits Sanctions Tracker — transparenC" },
    ],
  }),
  component: SanctionsPage,
});

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

function SanctionsPage() {
  const q = useQuery({
    queryKey: ["benefits-sanctions"],
    queryFn: () => getJSON<SanctionsData>("/api/sanctions"),
    staleTime: 30 * 60_000,
  });

  const contextStats = q.data?.data.contextStats ?? [];
  const publications = q.data?.data.publications ?? [];

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="DWP — Welfare"
          title="Benefits Sanctions Tracker"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          DWP applies sanctions — temporary benefit cuts — to claimants for failing conditionality
          requirements. Critics argue the system is punitive and disproportionately targets the
          most vulnerable claimants.
        </p>
      </div>

      {/* Context stats */}
      <div>
        <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
          Latest published figures — from DWP Benefit Sanctions Statistics
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {q.isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-border bg-surface rounded-lg p-4">
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-full mt-2" />
              </div>
            ))}

          {!q.isLoading &&
            contextStats.map((s) => (
              <Stat
                key={s.label}
                label={s.label}
                value={s.value}
                accent="amber"
                hint={s.notes}
              />
            ))}
        </div>
      </div>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* Publications list */}
      <div>
        <h3 className="font-display text-xl font-bold mb-3">
          Latest DWP Sanctions Publications
        </h3>
        <p className="text-xs text-muted-foreground label-mono mb-4">
          From GOV.UK — Department for Work and Pensions
        </p>

        {q.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
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
              No publications fetched. Browse DWP sanctions data directly at{" "}
              <a
                href="https://www.gov.uk/government/collections/benefit-sanctions-statistics"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-amber"
              >
                gov.uk/government/collections/benefit-sanctions-statistics
              </a>
              .
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
                      <FlagPill variant="neutral">{pub.department}</FlagPill>
                      {pub.publishedDate && (
                        <span className="label-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                          {relTime(pub.publishedDate)}
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
                    {pub.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {pub.description}
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

      <DataProvenance
        source="Department for Work and Pensions — Benefit Sanctions Statistics"
        url="https://www.gov.uk/government/collections/benefit-sanctions-statistics"
        licence="Open Government Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
