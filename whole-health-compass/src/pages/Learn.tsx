import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, ArrowRight, ShieldCheck, Compass as CompassIcon } from "lucide-react";
import type { AudienceKey } from "@/data/types";
import { knowledgeBase } from "@/data/concerns";
import { clinicConfig } from "@/config/clinic";
import { Eyebrow, Card, Pill, buttonClasses } from "@/components/ui";
import { ContentGovernanceLine } from "@/components/ContentGovernance";
import { track, trackOnce } from "@/lib/analytics";
import { cn } from "@/lib/cn";

/* ────────────────────────────────────────────────────────────────────────────
   KNOWLEDGE BASE  —  browse high-frequency topics, filter by who you are.

   A second front door into the same curated content: instead of the guided
   journey, a reader picks a common issue and sees general education plus notes
   for their gender / life-stage. Compliance is identical to the rest of the
   product — education only, no remedy or efficacy claims, every topic routes to
   a qualified, registered human.
   ──────────────────────────────────────────────────────────────────────────── */

type StageKey = AudienceKey | "any";

export function Learn() {
  const [who, setWho] = useState<AudienceKey>("everyone");
  const [stage, setStage] = useState<StageKey>("any");

  useEffect(() => {
    trackOnce("knowledge_view");
  }, []);

  const whoOptions = useMemo<{ key: AudienceKey; label: string }[]>(
    () => [{ key: "everyone", label: "Everyone" }, ...(knowledgeBase?.audiences.filter((a) => a.facet === "who") ?? [])],
    [],
  );
  const stageOptions = useMemo<{ key: StageKey; label: string }[]>(
    () => [{ key: "any", label: "Any age" }, ...(knowledgeBase?.audiences.filter((a) => a.facet === "stage") ?? [])],
    [],
  );

  const audienceLabel = (k: AudienceKey) => knowledgeBase?.audiences.find((a) => a.key === k)?.label ?? k;

  // The single audience whose note we surface on a card, if a filter is active.
  const activeAudience: AudienceKey | null = who !== "everyone" ? who : stage !== "any" ? stage : null;

  const issues = knowledgeBase?.issues ?? [];
  const filtered = issues.filter((issue) => {
    const passesWho = who === "everyone" || issue.commonFor.includes(who) || issue.commonFor.includes("everyone");
    const passesStage = stage === "any" || issue.commonFor.includes(stage) || issue.commonFor.includes("everyone");
    return passesWho && passesStage;
  });

  function chooseWho(next: AudienceKey) {
    setWho(next);
    if (next !== "everyone") track("knowledge_filter", { meta: { who: next, stage } });
  }
  function chooseStage(next: StageKey) {
    setStage(next);
    if (next !== "any") track("knowledge_filter", { meta: { who, stage: next } });
  }

  return (
    <div className="bg-paper">
      {/* Hero */}
      <section className="container pt-12 pb-6 text-center sm:pt-20">
        <Eyebrow className="justify-center">Knowledge base</Eyebrow>
        <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl leading-[1.08] sm:text-5xl">
          Plain-English answers to the questions people ask most
        </h1>
        <p className="measure mx-auto mt-5 text-lg text-muted-foreground">
          Browse common health topics — from bloating to menopause — with general guidance plus what's more often raised
          at different life stages. It's education to help you feel prepared, never a diagnosis, and every topic points
          you to a qualified practitioner.
        </p>
        <div className="mt-6 flex justify-center">
          <Pill tint="primary"><BookOpen className="h-3.5 w-3.5" /> General education — not medical advice</Pill>
        </div>
      </section>

      {/* Filters */}
      <section className="container py-6">
        <Card className="mx-auto max-w-3xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Users className="h-4 w-4 text-primary" /> Tailor it to you
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional — pick what fits and we'll highlight what's most often raised. Everything here is general education.
          </p>

          <div className="mt-4">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">I'm looking for</div>
            <div className="flex flex-wrap gap-2">
              {whoOptions.map((o) => (
                <FilterChip key={o.key} selected={who === o.key} onClick={() => chooseWho(o.key)}>
                  {o.label}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Life stage</div>
            <div className="flex flex-wrap gap-2">
              {stageOptions.map((o) => (
                <FilterChip key={o.key} selected={stage === o.key} onClick={() => chooseStage(o.key)}>
                  {o.label}
                </FilterChip>
              ))}
            </div>
          </div>

          {(who !== "everyone" || stage !== "any") && (
            <button
              onClick={() => {
                setWho("everyone");
                setStage("any");
              }}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </Card>
      </section>

      {/* Issue grid */}
      <section className="container pb-10">
        <p className="mb-4 text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of {issues.length} topics
        </p>

        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No topics match that combination yet. Try clearing the filters.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((issue) => {
              const tags = issue.commonFor.filter((a) => a !== "everyone");
              const note = activeAudience ? issue.byAudience?.find((n) => n.audience === activeAudience) : undefined;
              return (
                <Link
                  key={issue.id}
                  to={`/learn/${issue.id}`}
                  className="group flex flex-col rounded-xl border border-border bg-card p-5 text-left shadow-soft transition-all hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <h2 className="font-serif text-xl leading-tight group-hover:text-primary">{issue.label}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{issue.summary}</p>

                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <Pill key={t} tint="muted">{audienceLabel(t)}</Pill>
                      ))}
                    </div>
                  )}

                  {note && (
                    <p className="mt-3 rounded-lg bg-primary-soft/60 px-3 py-2 text-xs leading-relaxed text-foreground/85">
                      <span className="font-semibold">For {audienceLabel(note.audience).toLowerCase()}: </span>
                      {note.note}
                    </p>
                  )}

                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    Read the guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Routes to a human */}
      <section className="container py-10">
        <Card className="mx-auto max-w-3xl p-6 text-center sm:p-8">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-3 font-serif text-2xl sm:text-3xl">Reading is a great start — the next step is a person</h2>
          <p className="measure mx-auto mt-3 text-muted-foreground">
            None of this is a diagnosis or a recommendation. If something here resonates, the Compass helps you put it
            into words and prepare, then routes you to a qualified, registered practitioner.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/compass" className={buttonClasses("primary", "lg")}>
              <CompassIcon className="h-5 w-5" /> Try the guided journey
            </Link>
            <a href={clinicConfig.bookingUrl} className={buttonClasses("outline", "lg")}>
              Book a consultation
            </a>
          </div>
          <div className="mt-6">
            <ContentGovernanceLine />
          </div>
        </Card>
      </section>
    </div>
  );
}

function FilterChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "bg-primary text-primary-foreground shadow-soft"
          : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
