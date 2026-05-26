import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  DataProvenance,
  ErrorNote,
  FlagPill,
  LiveBadge,
  SectionHeader,
  Skeleton,
} from "@/components/primitives";
import { getJSON, relTime } from "@/lib/api";
import type { NewsStory } from "@/routes/api/news";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "UK News — transparenC" },
      {
        name: "description",
        content:
          "UK news ranked by multi-outlet coverage. Stories reported by more outlets indicate broader consensus. Filter by topic: NHS, Housing, Economy, Crime, Environment, Immigration, Education.",
      },
      { property: "og:title", content: "UK News — transparenC" },
    ],
  }),
  component: NewsPage,
});

type Issue = "NHS" | "Housing" | "Economy" | "Crime" | "Environment" | "Immigration" | "Education";
const ISSUES: Issue[] = [
  "NHS",
  "Housing",
  "Economy",
  "Crime",
  "Environment",
  "Immigration",
  "Education",
];

const OUTLETS = [
  { name: "BBC News", bias: "Centre", lean: 0 },
  { name: "The Guardian", bias: "Centre-Left", lean: -2 },
  { name: "Sky News", bias: "Centre", lean: 0 },
  { name: "The Independent", bias: "Centre-Left", lean: -1 },
];

function leanColour(lean: number): string {
  if (lean < -1) return "#3b82f6"; // left — blue
  if (lean > 1) return "#ef4444"; // right — red
  return "#6b7280"; // centre — grey
}

function leanLabel(lean: number): string {
  if (lean <= -2) return "L";
  if (lean === -1) return "CL";
  if (lean === 1) return "CR";
  if (lean >= 2) return "R";
  return "C";
}

function OutletLegend() {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {OUTLETS.map((o) => (
        <div key={o.name} className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: leanColour(o.lean) }}
          />
          <span className="label-mono text-[10px] text-muted-foreground">
            {o.name}
          </span>
          <span
            className="label-mono text-[9px] px-1 rounded"
            style={{ color: leanColour(o.lean), border: `1px solid ${leanColour(o.lean)}40` }}
          >
            {o.bias}
          </span>
        </div>
      ))}
    </div>
  );
}

function SourcePill({ name, lean }: { name: string; lean: number }) {
  return (
    <span
      className="label-mono text-[9px] px-1.5 py-0.5 rounded border shrink-0"
      style={{
        color: leanColour(lean),
        borderColor: `${leanColour(lean)}40`,
        backgroundColor: `${leanColour(lean)}10`,
      }}
      title={`Political lean: ${leanLabel(lean)}`}
    >
      {name}
    </span>
  );
}

function StoryCard({ story }: { story: NewsStory }) {
  const highCoverage = story.coverage >= 3;
  const primarySource = story.sources[0];

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-2 mb-2">
        {/* Coverage badge */}
        <span
          className={[
            "label-mono text-[10px] px-2 py-0.5 rounded border shrink-0",
            highCoverage
              ? "text-amber border-amber/40 bg-amber/10"
              : "text-muted-foreground border-border bg-surface",
          ].join(" ")}
        >
          {story.coverage} {story.coverage === 1 ? "outlet" : "outlets"}
        </span>

        {/* Topic pill */}
        {story.topic && (
          <FlagPill variant="neutral">{story.topic}</FlagPill>
        )}

        {/* Date */}
        <span className="label-mono text-[10px] text-muted-foreground ml-auto shrink-0">
          {relTime(story.pubDate)}
        </span>
      </div>

      {/* Headline */}
      {primarySource?.url ? (
        <a
          href={primarySource.url}
          target="_blank"
          rel="noreferrer"
          className="block hover:text-amber transition-colors"
        >
          <h3 className="font-display text-lg font-bold leading-snug">{story.title}</h3>
        </a>
      ) : (
        <h3 className="font-display text-lg font-bold leading-snug">{story.title}</h3>
      )}

      {/* Description */}
      {story.description && (
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
          {story.description}
        </p>
      )}

      {/* Sources */}
      {story.sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {story.sources.map((src) => (
            <SourcePill key={src.name} name={src.name} lean={src.lean} />
          ))}
        </div>
      )}
    </Card>
  );
}

function NewsPage() {
  const [activeIssue, setActiveIssue] = useState<Issue | "All">("All");

  const q = useQuery({
    queryKey: ["news-uk"],
    queryFn: () => getJSON<NewsStory[]>("/api/news"),
    staleTime: 60 * 60_000,
  });

  const stories: NewsStory[] = q.data?.data ?? [];
  const filtered =
    activeIssue === "All" ? stories : stories.filter((s) => s.topic === activeIssue);

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Impartial Coverage"
          title="UK News"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          Stories ranked by multi-outlet coverage. More outlets = broader consensus. Filter by
          topic to see what's dominating each area of public life.
        </p>
      </div>

      {/* Outlet legend */}
      <Card>
        <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
          Outlets &amp; political lean
        </div>
        <OutletLegend />
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          Political lean assessed editorially. L = Left, CL = Centre-Left, C = Centre, CR = Centre-Right, R = Right.
          Lean colouring: blue (left), grey (centre), red (right).
        </p>
      </Card>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["All", ...ISSUES] as (Issue | "All")[]).map((issue) => (
          <button
            key={issue}
            onClick={() => setActiveIssue(issue)}
            className={[
              "px-3 py-1.5 rounded text-[11px] label-mono uppercase tracking-wider border transition-colors",
              activeIssue === issue
                ? "bg-amber/10 border-amber/40 text-amber"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 bg-surface",
            ].join(" ")}
          >
            {issue}
          </button>
        ))}
      </div>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {/* Stories */}
      <div className="grid gap-3">
        {q.isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <div className="flex gap-2 mb-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}

        {!q.isLoading && filtered.length === 0 && !q.error && (
          <Card>
            <p className="text-muted-foreground text-sm">
              No stories found{activeIssue !== "All" ? ` for topic "${activeIssue}"` : ""}.
              {q.data ? " The RSS feeds may not have returned any matching items." : ""}
            </p>
          </Card>
        )}

        {!q.isLoading && filtered.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      <DataProvenance
        source="BBC News · The Guardian · Sky News · The Independent — RSS feeds"
        url="https://www.bbc.co.uk/news"
        licence="Aggregated news feed data. Stories link to original sources."
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}
