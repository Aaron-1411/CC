import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ActionBar,
  Card,
  ContextBlock,
  DataProvenance,
  FlagPill,
  SectionHeader,
  Skeleton,
} from "@/components/primitives";
import { SourcedStat } from "@/components/sourced-stat";
import { getJSON } from "@/lib/api";
import { ISSUES } from "@/data/issues";
import type { IssueKey } from "@/data/issues";
import type { PartyPromise, PromiseStatus } from "@/data/parties";
import type { NewsStory } from "@/routes/api/news";

// ─── Types ────────────────────────────────────────────────────────────────────

type PartiesData = {
  parties: Array<{ id: string; name: string; colour: string; seats: number }>;
  pledges: Record<string, PartyPromise[]>;
};

type PledgeRow = {
  partyId: string;
  partyName: string;
  partyColour: string;
  pledge: PartyPromise;
};

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/issues/$issue")({
  head: ({ params }) => {
    const def = ISSUES[params.issue as IssueKey];
    return {
      meta: [
        { title: def ? `${def.title} — transparenC` : "Issue — transparenC" },
        { name: "description", content: def?.question ?? "UK government accountability by issue" },
        { property: "og:title", content: def ? `${def.title} — transparenC` : "transparenC" },
      ],
    };
  },
  component: IssuePage,
});

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusVariant(s: PromiseStatus): React.ComponentProps<typeof FlagPill>["variant"] {
  switch (s) {
    case "done":
      return "ok";
    case "in-progress":
      return "neutral";
    case "behind-target":
      return "warn";
    case "stalled":
      return "direct";
    case "contested":
      return "warn";
    case "proposed":
      return "neutral";
  }
}

function statusLabel(s: PromiseStatus): string {
  switch (s) {
    case "done":
      return "Done ✓";
    case "in-progress":
      return "In progress";
    case "behind-target":
      return "Behind target";
    case "stalled":
      return "Stalled";
    case "contested":
      return "Contested";
    case "proposed":
      return "Proposed";
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function IssuePage() {
  const { issue } = Route.useParams();
  const def = ISSUES[issue as IssueKey];
  if (!def) throw notFound();

  const partiesQ = useQuery({
    queryKey: ["parties"],
    queryFn: () => getJSON<PartiesData>("/api/parties"),
    staleTime: 24 * 60 * 60_000,
  });

  const newsQ = useQuery({
    queryKey: ["news-uk"],
    queryFn: () => getJSON<NewsStory[]>("/api/news"),
    staleTime: 60 * 60_000,
  });

  // Gather all pledges for this issue across all parties
  const pledgeRows: PledgeRow[] = [];
  const partiesData = partiesQ.data?.data;
  if (partiesData) {
    for (const party of partiesData.parties) {
      const partyPledges = (partiesData.pledges[party.id] ?? []).filter(
        (p) => p.issue === def.partyIssue,
      );
      for (const pledge of partyPledges) {
        pledgeRows.push({
          partyId: party.id,
          partyName: party.name,
          partyColour: party.colour,
          pledge,
        });
      }
    }
    // Sort: done first, then in-progress, then others
    const order: Record<string, number> = {
      done: 0,
      "in-progress": 1,
      "behind-target": 2,
      stalled: 3,
      contested: 4,
      proposed: 5,
    };
    pledgeRows.sort((a, b) => (order[a.pledge.status] ?? 9) - (order[b.pledge.status] ?? 9));
  }

  // Filter news for this topic
  const allNews: NewsStory[] = Array.isArray(newsQ.data?.data) ? newsQ.data.data : [];
  const topicNews = allNews.filter((s) => s.topic === def.newsTopic).slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="border-l-4 pl-5 py-1" style={{ borderColor: def.color }}>
        <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
          {def.icon} {def.title}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black leading-tight">
          {def.question}
        </h1>
        <p className="mt-3 text-muted-foreground text-base leading-relaxed max-w-2xl">
          {def.description}
        </p>
      </section>

      {/* Headline stat (sourced) + context */}
      <ContextBlock heading="The headline figure" variant="warn">
        <div className="mb-3">
          <SourcedStat stat={def.headlineStat} size="lg" />
        </div>
        <p>{def.keyFactContext}</p>
      </ContextBlock>

      {/* Party pledges */}
      <section>
        <SectionHeader eyebrow="Party pledges" title="What parties promised — and delivered" />
        {partiesQ.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}
        {!partiesQ.isLoading && pledgeRows.length === 0 && (
          <p className="text-muted-foreground text-sm">No specific pledges found for this issue.</p>
        )}
        {!partiesQ.isLoading && pledgeRows.length > 0 && (
          <div className="space-y-2">
            {pledgeRows.map((row, i) => (
              <Card key={i} className="py-3 px-4">
                <div className="flex flex-wrap items-start gap-2">
                  {/* Party colour dot + name */}
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: row.partyColour }}
                    />
                    <span className="label-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                      {row.partyName}
                    </span>
                  </div>
                  <FlagPill variant={statusVariant(row.pledge.status)}>
                    {statusLabel(row.pledge.status)}
                  </FlagPill>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{row.pledge.promise}</p>
                    {row.pledge.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {row.pledge.detail}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Link
            to="/parties"
            className="label-mono text-[11px] uppercase tracking-wider text-amber hover:underline"
          >
            See all party pledges →
          </Link>
        </div>
      </section>

      {/* News */}
      <section>
        <SectionHeader
          eyebrow="In the news"
          title={`What the media is saying about ${def.title.toLowerCase()}`}
        />
        {newsQ.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}
        {!newsQ.isLoading && topicNews.length === 0 && (
          <p className="text-muted-foreground text-sm">No recent stories found for this topic.</p>
        )}
        {!newsQ.isLoading && topicNews.length > 0 && (
          <div className="space-y-2">
            {topicNews.map((story) => {
              const primarySrc = story.sources[0];
              const highCoverage = story.coverage >= 3;
              return (
                <Card key={story.id} className="py-3 px-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`label-mono text-[10px] px-2 py-0.5 rounded border ${
                        highCoverage
                          ? "text-amber border-amber/40 bg-amber/10"
                          : "text-muted-foreground border-border"
                      }`}
                    >
                      {story.coverage} {story.coverage === 1 ? "outlet" : "outlets"}
                    </span>
                    {story.sources.map((src) => (
                      <span
                        key={src.name}
                        className="label-mono text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground"
                      >
                        {src.name}
                      </span>
                    ))}
                  </div>
                  {primarySrc?.url ? (
                    <a
                      href={primarySrc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-sm hover:text-amber transition-colors"
                    >
                      {story.title}
                    </a>
                  ) : (
                    <p className="font-semibold text-sm">{story.title}</p>
                  )}
                  {story.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {story.description}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        <div className="mt-3">
          <Link
            to="/news"
            className="label-mono text-[11px] uppercase tracking-wider text-amber hover:underline"
          >
            See all news →
          </Link>
        </div>
      </section>

      {/* Related tools */}
      <section>
        <SectionHeader eyebrow="Go deeper" title="Related data" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {def.relatedTools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="group block bg-surface border border-border rounded-lg p-4 hover:border-amber/40 hover:bg-surface-2 transition-colors"
            >
              <h3 className="font-display text-base font-bold group-hover:text-amber transition-colors leading-snug">
                {tool.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <ActionBar
        mpTopic={def.mpTopic}
        briefingTopic={def.briefingTopic}
        shareText={`${def.title}: data and party promises — transparenC`}
      />

      <DataProvenance
        source="Parliament APIs · Electoral Commission · NHS England · Environment Agency · RSS news feeds"
        licence="Open Government Licence v3.0 · Editorial (party assessments)"
      />
    </div>
  );
}
