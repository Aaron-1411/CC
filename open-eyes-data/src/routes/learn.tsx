import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/primitives";
import { LEARN_MODULES, DEMOCRATIC_RIGHTS, type DemocraticRight } from "@/data/learn";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn — Political education | transparenC" },
      {
        name: "description",
        content:
          "Plain-English political education: how the UK is governed, how a law is made, how voting works, how to make your voice heard, and your democratic rights — each linked to an official source.",
      },
      { property: "og:title", content: "Learn — Political education | transparenC" },
    ],
  }),
  component: LearnPage,
});

const RIGHT_CATEGORIES: DemocraticRight["category"][] = [
  "Vote",
  "Be heard",
  "Find out",
  "Stand & act",
];

function LearnPage() {
  return (
    <div className="max-w-4xl space-y-14">
      {/* Hero */}
      <section className="pt-2 space-y-4">
        <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">
          Political education
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black leading-[1.08] tracking-tight">
          Understand the system, <span className="text-amber">then change it</span>.
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
          Short, plain-English lessons on how UK democracy actually works — and how you fit into it.
          No jargon, no spin, and every fact links to its official source. Pair it with the data
          tools to go from understanding to action.
        </p>
      </section>

      {/* Modules */}
      <section className="space-y-5">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            {LEARN_MODULES.length} lessons
          </div>
          <h2 className="font-display text-2xl font-bold">Start learning</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Read them in order or dip into whatever you need. Each takes under ten minutes.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {LEARN_MODULES.map((m, i) => (
            <Link
              key={m.slug}
              to="/learn/$slug"
              params={{ slug: m.slug }}
              className="group flex flex-col gap-2 rounded-lg border border-border bg-surface p-5 hover:border-amber/40 hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">
                  {m.icon}
                </span>
                <span className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Lesson {i + 1} · {m.estMinutes} min
                </span>
              </div>
              <h3 className="font-display text-base font-bold group-hover:text-amber transition-colors leading-snug">
                {m.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{m.summary}</p>
              <span className="label-mono text-[10px] uppercase tracking-wider text-amber group-hover:underline">
                Read lesson →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Rights quick-reference */}
      <section className="space-y-5">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Quick reference
          </div>
          <h2 className="font-display text-2xl font-bold">Your democratic rights</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            What you're entitled to do as a citizen — each one links to the official source so you
            can act on it today.
          </p>
        </div>
        <div className="space-y-5">
          {RIGHT_CATEGORIES.map((cat) => {
            const items = DEMOCRATIC_RIGHTS.filter((r) => r.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  {cat}
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {items.map((r) => (
                    <a
                      key={r.title}
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3 hover:border-amber/40 hover:bg-surface-2 transition-colors"
                    >
                      <span className="font-display text-sm font-semibold group-hover:text-amber transition-colors">
                        {r.title}
                      </span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        {r.summary}
                      </span>
                      <span className="label-mono text-[9px] uppercase tracking-wider text-amber/70 group-hover:text-amber transition-colors mt-0.5">
                        {r.sourceLabel} ↗
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-lg border border-amber/20 bg-amber/5 p-6 space-y-3">
        <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">
          Next step
        </div>
        <h2 className="font-display text-xl font-bold">Now put it into practice</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          Understanding is the first half. The Take Action guide shows how people at every age can
          participate — and the data tools let you check the record for yourself.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            to="/take-action"
            className="px-4 py-2 bg-amber text-amber-foreground rounded label-mono text-xs uppercase tracking-wider"
          >
            Take action →
          </Link>
          <Link
            to="/issues"
            className="px-4 py-2 border border-amber/30 rounded label-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/10 transition-colors"
          >
            Explore the data
          </Link>
        </div>
      </section>
    </div>
  );
}
