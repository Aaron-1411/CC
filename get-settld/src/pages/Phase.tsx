import { Link, useParams, Navigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check, Circle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  getPhase, phases, phaseProgress, nextStepInPhase,
  setCurrentPhase, toggleStep,
} from "@/lib/journey";
import { useJourneyProgress } from "@/hooks/use-journey-progress";

export default function Phase() {
  const { phase: phaseId } = useParams<{ phase: string }>();
  const phase = phaseId ? getPhase(phaseId) : undefined;
  const { done } = useJourneyProgress();

  useEffect(() => {
    if (phase) setCurrentPhase(phase.id);
  }, [phase]);

  if (!phase) return <Navigate to="/" replace />;

  const stats = phaseProgress(phase, done);
  const next = nextStepInPhase(phase, done);
  const idx = phases.findIndex((p) => p.id === phase.id);
  const prev = phases[idx - 1];
  const after = phases[idx + 1];

  const requiredCount = useMemo(
    () => phase.steps.filter((s) => !s.optional).length,
    [phase]
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-brand transition-colors">Journey</Link>
        <span>/</span>
        <span className="text-foreground">Phase {phase.number} · {phase.title}</span>
      </div>

      {/* Phase header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Badge className="bg-brand-muted text-brand hover:bg-brand-muted border-0">
            Phase {phase.number} of {phases.length}
          </Badge>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {phase.estimate}
          </span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-brand leading-tight">
          {phase.tagline}.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl leading-relaxed">
          {phase.description}
        </p>

        <div className="mt-6 flex items-center gap-4 max-w-md">
          <Progress value={stats.pct} className="h-2" />
          <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
            {stats.completed}/{stats.total} done
          </span>
        </div>
      </header>

      {/* Next step CTA */}
      {next && (
        <Card className="p-6 mb-8 border-brand/30 bg-gradient-warm shadow-card">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-brand text-brand-foreground flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-brand font-semibold mb-1">
                Your next step
              </p>
              <h2 className="font-serif text-2xl font-bold text-brand">{next.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{next.blurb}</p>
            </div>
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90 shrink-0">
              <Link to={next.to}>
                Start <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Steps */}
      <ol className="space-y-3">
        {phase.steps.map((step, i) => {
          const isDone = done.includes(step.id);
          return (
            <li key={step.id}>
              <Card className={`p-5 transition-all ${isDone ? "bg-muted/40 border-success/30" : "hover:border-brand/30 hover:shadow-card"}`}>
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={(v) => toggleStep(step.id, !!v)}
                    aria-label={`Mark ${step.title} as done`}
                    className="mt-0.5"
                  />
                  <div className="hidden sm:flex h-10 w-10 shrink-0 rounded-xl bg-brand-muted text-brand items-center justify-center">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className={`font-serif text-lg font-bold ${isDone ? "text-muted-foreground line-through" : "text-brand"}`}>
                        {step.title}
                      </h3>
                      {step.optional && (
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground border-0 text-[10px]">
                          Optional
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{step.blurb}</p>
                  </div>
                  <Button asChild variant={isDone ? "outline" : "default"} size="sm"
                    className={isDone ? "" : "bg-brand text-brand-foreground hover:bg-brand/90"}>
                    <Link to={step.to}>
                      {isDone ? "Revisit" : "Open"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {/* Outcome */}
      <Card className="mt-10 p-6 bg-card border-border/70">
        <div className="flex items-start gap-3">
          <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
              By the end of this phase
            </p>
            <p className="font-serif text-lg text-brand mt-1">{phase.outcome}</p>
          </div>
        </div>
      </Card>

      {/* Phase navigation */}
      <nav className="mt-8 flex items-center justify-between gap-3">
        {prev ? (
          <Button asChild variant="ghost">
            <Link to={`/start/${prev.id}`}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Phase {prev.number}: {prev.title}
            </Link>
          </Button>
        ) : <span />}
        {after ? (
          <Button asChild variant="outline" className="border-brand/30 text-brand hover:bg-brand-muted">
            <Link to={`/start/${after.id}`}>
              Next: Phase {after.number} - {after.title} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="border-brand/30 text-brand hover:bg-brand-muted">
            <Link to="/">Back to journey overview</Link>
          </Button>
        )}
      </nav>
    </div>
  );
}
