import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ActionBar, Card, DataProvenance, ErrorNote, FlagPill, LiveBadge, SectionHeader, Skeleton } from "@/components/primitives";
import { getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/acoba")({
  head: () => ({
    meta: [
      { title: "Revolving Door — transparenC" },
      { name: "description", content: "ACOBA publishes every case of a minister or senior civil servant taking a private sector role related to their government work." },
      { property: "og:title", content: "Revolving Door — transparenC" },
    ],
  }),
  component: AcobaPage,
});

type AcobaResp = {
  cases: Array<{ title: string; description?: string; url: string; date: string }>;
};

function AcobaPage() {
  const q = useQuery({
    queryKey: ["acoba"],
    queryFn: () => getJSON<AcobaResp>("/api/acoba"),
    staleTime: 5 * 60_000,
  });

  const cases = q.data?.data.cases ?? [];

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Revolving Door"
          title="Ministers and officials moving to private sector"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          ACOBA — the Advisory Committee on Business Appointments — advises on and publishes every
          case of a minister or senior civil servant taking a private sector role related to their
          government work.
        </p>
      </div>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      <div className="grid gap-3">
        {q.isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full" />
              </Card>
            ))
          : cases.map((c, i) => <AcobaCard key={i} c={c} />)}
        {!q.isLoading && cases.length === 0 && !q.error && (
          <div className="text-muted-foreground text-sm py-12 text-center">No ACOBA cases found.</div>
        )}
      </div>

      <ActionBar
        mpTopic="revolving door, ACOBA and ministers moving into private sector roles"
        briefingTopic="UK revolving door, ACOBA approvals and ministers into private sector 2025"
        shareText="Ministers and officials approved to take private sector jobs after leaving government"
      />

      <DataProvenance
        source="ACOBA via GOV.UK"
        url="https://www.gov.uk/government/organisations/advisory-committee-on-business-appointments"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}

function AcobaCard({ c }: { c: { title: string; description?: string; url: string; date: string } }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <FlagPill variant="restricted">Approved move</FlagPill>
          </div>
          <a
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="font-display text-lg font-semibold hover:text-amber leading-snug"
          >
            {c.title}
          </a>
          {c.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
          )}
        </div>
        <div className="label-mono text-[10px] uppercase text-muted-foreground shrink-0">
          {relTime(c.date)}
        </div>
      </div>
    </Card>
  );
}
