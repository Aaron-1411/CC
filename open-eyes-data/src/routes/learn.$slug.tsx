import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/primitives";
import { getLearnModule, LEARN_MODULES, type QuizQuestion } from "@/data/learn";

export const Route = createFileRoute("/learn/$slug")({
  head: ({ params }) => {
    const m = getLearnModule(params.slug);
    return {
      meta: [
        { title: m ? `${m.title} — Learn | transparenC` : "Lesson — transparenC" },
        { name: "description", content: m?.summary ?? "Political education on transparenC." },
        { property: "og:title", content: m ? `${m.title} — transparenC` : "Lesson" },
      ],
    };
  },
  loader: ({ params }) => {
    if (!getLearnModule(params.slug)) throw notFound();
    return {};
  },
  component: LessonPage,
  notFoundComponent: () => (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-bold">Lesson not found</h1>
      <Link to="/learn" className="text-amber hover:underline label-mono text-xs uppercase">
        ← All lessons
      </Link>
    </div>
  ),
});

const CALLOUT_STYLE: Record<string, { label: string; cls: string }> = {
  key: { label: "Key point", cls: "border-amber/30 bg-amber/5 text-foreground" },
  tip: { label: "Tip", cls: "border-ok/30 bg-ok/5 text-foreground" },
  example: { label: "Example", cls: "border-border bg-surface-2 text-foreground" },
};

function LessonPage() {
  const { slug } = Route.useParams();
  const m = getLearnModule(slug);
  if (!m) return null;

  const idx = LEARN_MODULES.findIndex((x) => x.slug === slug);
  const next = LEARN_MODULES[idx + 1];

  return (
    <article className="max-w-2xl space-y-8">
      <div className="space-y-3">
        <Link
          to="/learn"
          className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-amber"
        >
          ← All lessons
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-3xl" aria-hidden="true">
            {m.icon}
          </span>
          <span className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Lesson {idx + 1} of {LEARN_MODULES.length} · {m.estMinutes} min read
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black leading-tight">{m.title}</h1>
      </div>

      {/* TL;DR */}
      <Card className="bg-amber/5 border-amber/20 space-y-1">
        <div className="label-mono text-[10px] uppercase tracking-wider text-amber">In short</div>
        <p className="text-sm text-muted-foreground leading-relaxed">{m.tldr}</p>
      </Card>

      {/* Lesson sections */}
      <div className="space-y-7">
        {m.lesson.map((s) => {
          const callout = s.callout ? CALLOUT_STYLE[s.callout.type] : null;
          return (
            <section key={s.heading} className="space-y-2">
              <h2 className="font-display text-lg font-bold">{s.heading}</h2>
              <p className="text-[15px] text-muted-foreground leading-7">{s.body}</p>
              {s.callout && callout && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${callout.cls}`}
                >
                  <span className="label-mono text-[9px] uppercase tracking-wider text-amber mr-2">
                    {callout.label}
                  </span>
                  {s.callout.text}
                </div>
              )}
              {s.sourceUrl &&
                (s.sourceUrl.startsWith("/") ? (
                  <Link
                    to={s.sourceUrl}
                    className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline inline-block"
                  >
                    {s.sourceLabel ?? "Source"} →
                  </Link>
                ) : (
                  <a
                    href={s.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline inline-block"
                  >
                    {s.sourceLabel ?? "Source"} ↗
                  </a>
                ))}
            </section>
          );
        })}
      </div>

      {/* Quiz */}
      {m.quiz && m.quiz.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">Check yourself</h2>
          {m.quiz.map((q, i) => (
            <QuizCard key={i} q={q} />
          ))}
        </section>
      )}

      {/* Related tools */}
      {m.relatedTools && m.relatedTools.length > 0 && (
        <section className="space-y-2">
          <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Put it into practice
          </div>
          <div className="flex flex-wrap gap-2">
            {m.relatedTools.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className="px-3 py-1.5 rounded border border-border bg-surface label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-amber hover:border-amber/40 transition-colors"
              >
                {t.label} →
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Next lesson */}
      <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/learn"
          className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-amber"
        >
          ← All lessons
        </Link>
        {next && (
          <Link
            to="/learn/$slug"
            params={{ slug: next.slug }}
            className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
          >
            Next: {next.title} →
          </Link>
        )}
      </div>
    </article>
  );
}

function QuizCard({ q }: { q: QuizQuestion }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <Card className="space-y-2">
      <p className="text-sm font-medium">{q.question}</p>
      <div className="grid gap-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const isPicked = i === picked;
          const cls = !answered
            ? "border-border bg-surface hover:border-amber/40"
            : isCorrect
              ? "border-ok/50 bg-ok/10 text-foreground"
              : isPicked
                ? "border-flag/50 bg-flag/10 text-muted-foreground"
                : "border-border bg-surface text-muted-foreground/60";
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setPicked(i)}
              className={`text-left text-sm px-3 py-2 rounded border transition-colors ${cls}`}
            >
              <span
                aria-hidden="true"
                className="label-mono text-[10px] text-muted-foreground mr-2"
              >
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
              {answered && isCorrect && <span className="float-right text-ok">✓</span>}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
          <span className="label-mono uppercase tracking-wider text-amber mr-1">Why:</span>
          {q.explanation}
        </p>
      )}
    </Card>
  );
}
