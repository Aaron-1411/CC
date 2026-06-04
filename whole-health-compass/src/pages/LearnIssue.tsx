import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, ShieldCheck, Users, Compass as CompassIcon } from "lucide-react";
import type { AudienceKey } from "@/data/types";
import { getConcern, getIssue, knowledgeBase } from "@/data/concerns";
import { clinicConfig } from "@/config/clinic";
import { Eyebrow, Card, Pill, buttonClasses } from "@/components/ui";
import { ComparativeLens } from "@/components/ComparativeLens";
import { RedFlags } from "@/components/SafetyPanel";
import { ContentGovernanceLine } from "@/components/ContentGovernance";
import { usePageMeta } from "@/lib/usePageMeta";
import { track } from "@/lib/analytics";

/* A single knowledge-base topic. Reuses the concern's comparative lens, common
   ground and red-flag safety content, then adds general + demographic education.
   Education only — it never diagnoses or recommends, and always routes to a human. */

export function LearnIssue() {
  const { id } = useParams<{ id: string }>();
  const issue = id ? getIssue(id) : undefined;

  usePageMeta(
    issue ? `${issue.label} — ${clinicConfig.name}` : `Knowledge base — ${clinicConfig.name}`,
    issue?.summary,
  );

  useEffect(() => {
    if (issue) track("knowledge_issue_view", { concernId: issue.concernId, meta: { issueId: issue.id } });
  }, [issue]);

  if (!issue) {
    return (
      <div className="bg-paper">
        <div className="container max-w-2xl py-16 text-center">
          <h1 className="font-serif text-3xl">We couldn't find that topic</h1>
          <p className="mt-3 text-muted-foreground">It may have moved. Browse all topics in the knowledge base.</p>
          <Link to="/learn" className={buttonClasses("primary", "md") + " mt-6"}>
            <ArrowLeft className="h-4 w-4" /> All topics
          </Link>
        </div>
      </div>
    );
  }

  const concern = getConcern(issue.concernId);
  const audienceLabel = (k: AudienceKey) => knowledgeBase?.audiences.find((a) => a.key === k)?.label ?? k;
  const tags = issue.commonFor.filter((a) => a !== "everyone");

  return (
    <div className="bg-paper">
      <div className="container max-w-4xl py-10 sm:py-14">
        <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All topics
        </Link>

        {/* Header */}
        <div className="mt-5">
          <Eyebrow>Knowledge base</Eyebrow>
          <h1 className="mt-2 font-serif text-4xl leading-[1.1]">{issue.label}</h1>
          <p className="measure mt-3 text-lg text-muted-foreground">{issue.summary}</p>
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">More often raised by:</span>
              {tags.map((t) => (
                <Pill key={t} tint="muted">{audienceLabel(t)}</Pill>
              ))}
            </div>
          )}
        </div>

        {/* The basics */}
        <Card className="mt-8 p-6">
          <h2 className="flex items-center gap-2 font-serif text-xl">
            <BookOpen className="h-5 w-5 text-primary" /> The basics
          </h2>
          <ul className="mt-4 space-y-3">
            {issue.general.map((g, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Demographic notes */}
        {issue.byAudience && issue.byAudience.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-2xl">Worth knowing for different people</h2>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Patterns more commonly raised by some groups — general context, never a diagnosis about you.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {issue.byAudience.map((n) => (
                <Card key={n.audience} className="p-5">
                  <div className="mb-2">
                    <Pill tint="accent">{audienceLabel(n.audience)}</Pill>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{n.note}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Comparative lens — reused engine */}
        <section className="mt-10">
          <h2 className="font-serif text-2xl">How each tradition understands this</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Different ways of seeing the same thing, presented as equals — none ranked above another.
          </p>
          <div className="mt-4">
            <ComparativeLens concern={concern} />
          </div>
        </section>

        {/* Red flags — reused safety content */}
        {concern.redFlags && concern.redFlags.length > 0 && (
          <section className="mt-8">
            <RedFlags items={concern.redFlags} />
          </section>
        )}

        {/* Routes to a human */}
        <Card className="mt-10 p-6 text-center sm:p-8">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-3 font-serif text-2xl">Ready to take this further?</h2>
          <p className="measure mx-auto mt-3 text-muted-foreground">
            This guide is general education. To explore what it means for you, the Compass helps you describe it in your
            own words and prepare a summary, then routes you to a qualified, registered practitioner.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/compass" className={buttonClasses("primary", "lg")}>
              <CompassIcon className="h-5 w-5" /> Prepare with the Compass
            </Link>
            <a href={clinicConfig.bookingUrl} className={buttonClasses("outline", "lg")}>
              Book a consultation
            </a>
          </div>
        </Card>

        {/* Related topics */}
        <RelatedTopics currentId={issue.id} />

        <div className="mt-10">
          <ContentGovernanceLine />
        </div>
      </div>
    </div>
  );
}

/** A light "keep browsing" rail — the other topics in the knowledge base. */
function RelatedTopics({ currentId }: { currentId: string }) {
  const others = (knowledgeBase?.issues ?? []).filter((i) => i.id !== currentId).slice(0, 3);
  if (others.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl">Keep exploring</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {others.map((o) => (
          <Link
            key={o.id}
            to={`/learn/${o.id}`}
            className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium shadow-soft transition-all hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="group-hover:text-primary">{o.label}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}
