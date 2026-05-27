import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ActionBar, Card, DataProvenance, ErrorNote, FlagPill, LiveBadge, SectionHeader, Skeleton } from "@/components/primitives";
import { getJSON, relTime } from "@/lib/api";

export const Route = createFileRoute("/votes")({
  head: () => ({
    meta: [
      { title: "Voting Records — transparenC" },
      { name: "description", content: "Track how MPs vote in the House of Commons. Every division live from Parliament's Votes API." },
      { property: "og:title", content: "Voting Records — transparenC" },
    ],
  }),
  component: VotesPage,
});

type Division = {
  divisionId: number;
  date: string;
  title: string;
  ayes: number;
  noes: number;
  passed: boolean;
};

type VotesResp = { items: Division[]; totalResults: number };

function VotesPage() {
  const q = useQuery({
    queryKey: ["votes"],
    queryFn: () => getJSON<VotesResp>("/api/votes?take=25&skip=0"),
    staleTime: 5 * 60_000,
  });

  const items = q.data?.data.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Voting Records"
          title="How MPs voted"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Every vote in the House of Commons, live from Parliament's Votes API. See what passed,
          what failed, and by how much.
        </p>
      </div>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      <div className="grid gap-3">
        {q.isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-8 w-32" />
              </Card>
            ))
          : items.map((d) => <DivisionCard key={d.divisionId} d={d} />)}
        {!q.isLoading && items.length === 0 && !q.error && (
          <div className="text-muted-foreground text-sm py-12 text-center">No divisions found.</div>
        )}
      </div>

      <ActionBar
        mpTopic="how my MP votes and parliamentary accountability"
        briefingTopic="Recent House of Commons votes and key parliamentary divisions"
        shareText="See how Parliament voted — every Commons division with ayes, noes and margin"
      />

      <DataProvenance
        source="UK Parliament Votes API"
        url="https://votes.parliament.uk"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}

function DivisionCard({ d }: { d: Division }) {
  const margin = d.ayes - d.noes;
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <FlagPill variant={d.passed ? "ok" : "direct"}>
              {d.passed ? "Passed" : "Failed"}
            </FlagPill>
          </div>
          <a
            href={`https://votes.parliament.uk/votes/commons/division/${d.divisionId}`}
            target="_blank"
            rel="noreferrer"
            className="font-display text-lg font-semibold hover:text-amber leading-snug"
          >
            {d.title}
          </a>
          <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-2">
            {relTime(d.date)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-2xl font-bold text-amber">
            {d.ayes} — {d.noes}
          </div>
          <div className="label-mono text-[10px] uppercase text-muted-foreground">
            majority: {margin >= 0 ? `+${margin}` : `${margin}`}
          </div>
        </div>
      </div>
    </Card>
  );
}
