import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ActionBar,
  Card,
  ContextBlock,
  DataProvenance,
  ErrorNote,
  FlagPill,
  LiveBadge,
  SectionHeader,
  Skeleton,
  Stat,
} from "@/components/primitives";
import { getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/sanctions")({
  head: () => ({
    meta: [
      { title: "Benefits Sanctions Tracker — transparenC" },
      {
        name: "description",
        content:
          "DWP Universal Credit sanctions data: how many claimants are sanctioned, for how long, and the official recorded reasons — from published DWP statistics.",
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
          eyebrow="Welfare"
          title="Benefits sanctions — when the safety net has conditions"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          The DWP can cut or stop Universal Credit payments when claimants miss appointments or fail
          to meet job-search requirements. This is called a sanction. Here is the published data on
          how often this happens and who it affects.
        </p>
      </div>

      {/* What this means */}
      <ContextBlock heading="How the sanctions system works" variant="warn">
        <p>
          Under Universal Credit, claimants accept a "claimant commitment" of agreed activities. If
          the DWP records that a claimant did not meet a requirement without good reason, it can
          apply a sanction that reduces their standard allowance — in the most severe cases to zero,
          for a set period. The data below shows how many sanctions are applied and the official
          recorded reason categories.
        </p>
        <p>
          The reasons the DWP records, in its own categories, include failing to attend or
          participate in a mandatory interview, not undertaking agreed work-search activity, and not
          taking up employment. The Government's stated rationale is that conditionality encourages
          job-seeking; critics, including some select committees and charities, question its
          effectiveness and impact — both positions are part of the public debate.
        </p>
      </ContextBlock>

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
              <Stat key={s.label} label={s.label} value={s.value} accent="amber" hint={s.notes} />
            ))}
        </div>
      </div>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* Publications list */}
      <div>
        <h3 className="font-display text-xl font-bold mb-3">Latest DWP Sanctions Publications</h3>
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

      <ActionBar
        mpTopic="Universal Credit sanctions, welfare conditionality and foodbank use"
        briefingTopic="UK Universal Credit sanctions system, DWP conditionality and impact on vulnerable claimants"
        shareText="DWP Universal Credit sanctions: how many are applied, for how long, and for which official reasons — the published data"
        letterTemplate={`Dear [MP Name],

I am writing as a constituent about the DWP's Universal Credit sanctions system.

Published DWP statistics record the number of Universal Credit sanctions applied, their duration, and the official reason categories. I would like to understand the position in our area and the evidence base for the policy.

I would be grateful if you could help me find out:
1. How many sanctions were applied in our constituency in the most recent period?
2. What proportion of sanctioned claimants successfully appealed or had a sanction overturned?
3. What evidence the Government holds on whether sanctions improve employment outcomes?
4. What safeguards apply for claimants with disabilities or health conditions?

I would be grateful for your response.

Yours sincerely,
[Your name]
[Your address]`}
      />

      <DataProvenance
        source="Department for Work and Pensions — Benefit Sanctions Statistics"
        url="https://www.gov.uk/government/collections/benefit-sanctions-statistics"
        licence="Open Government Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
