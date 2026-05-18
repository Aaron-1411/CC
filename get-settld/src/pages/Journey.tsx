import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight, FileText, CalendarDays, Sparkles } from "lucide-react";
import {
  JOURNEY_PHASES as PHASES,
  JOURNEY_STORAGE_KEY as STORAGE_KEY,
  JOURNEY_DOCS_KEY,
  JOURNEY_DATES_KEY,
  loadJourneyDone, loadJourneyDocs, loadJourneyDates,
} from "@/data/journey";
import { buildJourneyICS, downloadICS } from "@/lib/journeyCalendar";
import { toast } from "@/hooks/use-toast";

export default function Journey() {
  const [done, setDone] = useState<Set<string>>(() => loadJourneyDone());
  const [docs, setDocs] = useState<Record<string, boolean>>(() => loadJourneyDocs());
  const [dates, setDates] = useState<Record<string, string>>(() => loadJourneyDates());

  const persistDone = (next: Set<string>) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
  };
  const persistDocs = (next: Record<string, boolean>) => {
    try { localStorage.setItem(JOURNEY_DOCS_KEY, JSON.stringify(next)); } catch {}
  };
  const persistDates = (next: Record<string, string>) => {
    try { localStorage.setItem(JOURNEY_DATES_KEY, JSON.stringify(next)); } catch {}
  };

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      persistDone(next);
      if (!prev.has(id) && !dates[id]) {
        const nd = { ...dates, [id]: new Date().toISOString().slice(0, 10) };
        setDates(nd); persistDates(nd);
      }
      return next;
    });
  };

  const toggleDoc = (key: string) => {
    setDocs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      persistDocs(next);
      return next;
    });
  };

  const setDate = (id: string, value: string) => {
    const next = { ...dates, [id]: value };
    setDates(next); persistDates(next);
  };

  const total = PHASES.reduce((s, p) => s + p.steps.length, 0);
  const pct = Math.round((done.size / total) * 100);

  // Doc rollup
  const allDocs: { key: string; label: string; stepLabel: string }[] = [];
  PHASES.forEach((p) => p.steps.forEach((s) => s.docs?.forEach((d) => allDocs.push({ key: `${s.id}::${d}`, label: d, stepLabel: s.label }))));
  const docsDone = allDocs.filter((d) => docs[d.key]).length;

  // Smart "next 3 actions" — first three undone steps in journey order.
  const nextThree = useMemo(() => {
    const out: { phase: string; step: typeof PHASES[0]["steps"][0] }[] = [];
    for (const p of PHASES) for (const s of p.steps) {
      if (!done.has(s.id)) { out.push({ phase: p.name, step: s }); if (out.length >= 3) return out; }
    }
    return out;
  }, [done]);

  // Target completion date for ICS export (default: ~22 weeks out).
  const defaultTarget = new Date(Date.now() + 22 * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [targetDate, setTargetDate] = useState<string>(defaultTarget);

  const handleExportICS = () => {
    try {
      const ics = buildJourneyICS({
        phases: PHASES, done, dates,
        targetDate: new Date(targetDate),
      });
      downloadICS(`buying-journey-${Date.now()}.ics`, ics);
      toast({ title: "Calendar downloaded", description: "Open the .ics file to add to Google, Apple or Outlook calendar." });
    } catch {
      toast({ title: "Export failed", description: "Please try again.", variant: "destructive" });
    }
  };


  return (
    <div>
      <PageHeader
        eyebrow="Tool · Journey"
        title="Your buying journey, one step at a time."
        description="Stateful checklist, deep-links to the right tool for each step, and a document vault that travels with you."
      />

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6 shadow-soft">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Steps progress</p>
                <p className="font-serif text-3xl font-bold text-brand mt-1">{done.size} <span className="text-base text-muted-foreground font-sans">of {total}</span></p>
              </div>
              <Badge className="bg-brand text-brand-foreground hover:bg-brand border-0 font-mono text-base px-3 py-1">{pct}%</Badge>
            </div>
            <Progress value={pct} className="h-2" />
          </Card>
          <Card className="p-6 shadow-soft">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><FileText className="w-3 h-3" /> Document vault</p>
                <p className="font-serif text-3xl font-bold text-brand mt-1">{docsDone} <span className="text-base text-muted-foreground font-sans">of {allDocs.length}</span></p>
              </div>
              <Badge className="bg-accent text-accent-foreground border-0 font-mono text-base px-3 py-1">{Math.round((docsDone / Math.max(allDocs.length, 1)) * 100)}%</Badge>
            </div>
            <Progress value={(docsDone / Math.max(allDocs.length, 1)) * 100} className="h-2" />
          </Card>
        </div>

        {nextThree.length > 0 && (
          <Card className="p-5 border-brand/30 bg-gradient-warm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-brand" />
              <p className="font-serif text-base font-bold text-brand">Your next 3 actions</p>
            </div>
            <ol className="space-y-2">
              {nextThree.map(({ phase, step }, i) => (
                <li key={step.id} className="flex items-start gap-3 bg-card/70 rounded-md p-3">
                  <span className="font-mono text-xs text-muted-foreground mt-0.5">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{phase} · {step.detail}</p>
                  </div>
                  {step.toolHref && (
                    <Link to={step.toolHref} className="text-xs text-brand font-semibold whitespace-nowrap inline-flex items-center gap-1 hover:underline">
                      Open <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </Card>
        )}

        <Card className="p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-serif text-base font-bold text-brand flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Add to your calendar</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">Download an .ics file with every milestone. Pending steps are spaced between today and your target completion date.</p>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <Label className="text-xs">Target completion</Label>
                <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="h-9 w-40" />
              </div>
              <Button onClick={handleExportICS} className="bg-brand text-brand-foreground hover:bg-brand/90 h-9">
                <CalendarDays className="h-4 w-4 mr-1.5" /> Download .ics
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {PHASES.map((phase) => {
            const phaseDone = phase.steps.filter((s) => done.has(s.id)).length;
            const phasePct = Math.round((phaseDone / phase.steps.length) * 100);
            return (
              <Card key={phase.name} className="p-6 shadow-soft">
                <div className="flex items-start gap-4 pb-4 border-b">
                  <span className="font-serif text-3xl text-accent font-bold">{phase.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <h3 className="font-serif text-xl font-bold text-brand">{phase.name}</h3>
                      <span className="text-xs text-muted-foreground uppercase tracking-widest">{phase.weeks}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-success transition-all" style={{ width: `${phasePct}%` }} />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{phaseDone}/{phase.steps.length}</span>
                    </div>
                  </div>
                </div>

                <ul className="mt-4 space-y-1">
                  {phase.steps.map((step) => {
                    const isDone = done.has(step.id);
                    return (
                      <li key={step.id} className="rounded-lg p-3 hover:bg-muted/40">
                        <div className="flex items-start gap-3">
                          <Checkbox checked={isDone} onCheckedChange={() => toggle(step.id)} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between flex-wrap gap-2">
                              <p className={`font-medium ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>{step.label}</p>
                              <div className="flex items-center gap-2">
                                {isDone && (
                                  <Input
                                    type="date"
                                    value={dates[step.id] || ""}
                                    onChange={(e) => setDate(step.id, e.target.value)}
                                    className="h-7 text-xs w-36"
                                  />
                                )}
                                {step.toolHref && (
                                  <Link to={step.toolHref} className="text-xs text-brand font-semibold flex items-center gap-1 hover:underline">
                                    Open tool <ArrowRight className="w-3 h-3" />
                                  </Link>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{step.detail}</p>

                            {step.docs && step.docs.length > 0 && (
                              <div className="mt-2 pl-1 border-l-2 border-accent/30 ml-1">
                                {step.docs.map((d) => {
                                  const k = `${step.id}::${d}`;
                                  return (
                                    <label key={k} className="flex items-center gap-2 text-xs py-0.5 cursor-pointer">
                                      <Checkbox checked={!!docs[k]} onCheckedChange={() => toggleDoc(k)} />
                                      <span className={docs[k] ? "line-through text-muted-foreground" : ""}>{d}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
