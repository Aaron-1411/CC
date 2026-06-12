import { createFileRoute, Link } from "@tanstack/react-router";
import { ISSUES, ISSUE_KEYS } from "@/data/issues";
import { formatStatValue } from "@/contract/stats";
import { getSource } from "@/contract/sources";

export const Route = createFileRoute("/issues/")({
  head: () => ({
    meta: [
      { title: "Issues — transparenC" },
      {
        name: "description",
        content:
          "Explore UK government accountability by issue — NHS, housing, economy, crime, environment, immigration and education.",
      },
      { property: "og:title", content: "Issues — transparenC" },
    ],
  }),
  component: IssuesIndexPage,
});

function IssuesIndexPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          What matters to you
        </div>
        <h1 className="font-display text-4xl font-black leading-tight">Explore by issue</h1>
        <p className="mt-3 text-muted-foreground text-base leading-relaxed max-w-2xl">
          Pick an issue to see the key facts, what every party promised, the latest news, and links
          to the raw data — all in one place.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ISSUE_KEYS.map((key) => {
          const def = ISSUES[key];
          return (
            <Link
              key={key}
              to="/issues/$issue"
              params={{ issue: key }}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 hover:border-amber/50 hover:bg-surface-2 transition-colors"
            >
              {/* Icon + title */}
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">
                  {def.icon}
                </span>
                <div>
                  <div className="font-display text-xl font-bold group-hover:text-amber transition-colors leading-tight">
                    {def.title}
                  </div>
                  <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    {def.question}
                  </div>
                </div>
              </div>

              {/* Headline stat (sourced) */}
              <div className="rounded-lg bg-surface-2 border border-border px-3 py-2">
                <div className="text-lg font-display font-black text-amber leading-none">
                  {formatStatValue(def.headlineStat)}
                </div>
                <div className="text-xs text-muted-foreground leading-snug mt-1">
                  {def.headlineStat.label}
                </div>
                <div className="label-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 mt-1">
                  {getSource(def.headlineStat.sourceId).name} ·{" "}
                  {new Date(def.headlineStat.asOf).toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* Description teaser */}
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">
                {def.description}
              </p>

              <div className="label-mono text-[10px] uppercase tracking-wider text-amber group-hover:underline">
                Explore {def.title} →
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
