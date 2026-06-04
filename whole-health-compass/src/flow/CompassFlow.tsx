import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { concerns, getConcern } from "@/data/concerns";
import { Button, Card, Progress, Input, Textarea, Label, buttonClasses } from "@/components/ui";
import { emptyIntake, type IntakeData } from "@/lib/summary";
import { track, trackOnce } from "@/lib/analytics";
import { cn } from "@/lib/cn";

const DURATIONS = ["A few days", "A few weeks", "A few months", "Longer than that", "It comes and goes"];
const GOALS = ["Understand what's going on", "A clear, calm plan", "Some reassurance", "To feel more like myself", "Know who to see"];

const TOTAL_STEPS = 5;
const STORAGE_KEY = "whc_intake_progress";

function Chips({ options, value, onSelect }: { options: string[]; value: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(active ? "" : opt)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-soft"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function CompassFlow({ onComplete }: { onComplete: (data: IntakeData) => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeData>(emptyIntake);

  useEffect(() => {
    trackOnce("compass_start");
  }, []);

  // Restore in-progress answers (UX: a refresh or back-navigation never loses work).
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.data) setData(parsed.data);
        if (typeof parsed?.step === "number") setStep(parsed.step);
      }
    } catch {
      /* ignore corrupt state */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
    } catch {
      /* storage may be unavailable */
    }
  }, [step, data]);

  const set = (patch: Partial<IntakeData>) => setData((d) => ({ ...d, ...patch }));
  const concern = data.concernId ? getConcern(data.concernId) : null;
  const canContinue = step > 0 || Boolean(data.concernId);

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onComplete(data);
    }
  };
  const goBack = () => {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <Progress value={((step + 1) / TOTAL_STEPS) * 100} label={`Step ${step + 1} of ${TOTAL_STEPS}`} />
      </div>

      <Card className="p-6 sm:p-8">
        <div key={step} className="animate-fade-up">
          {step === 0 && (
            <Step title="What's the main thing on your mind?" subtitle="Pick the closest — you can add detail next. There are no wrong answers.">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {concerns.map((c) => {
                  const active = data.concernId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        set({ concernId: c.id, concernLabel: c.label });
                        track("compass_concern_select", { concernId: c.id });
                      }}
                      aria-pressed={active}
                      className={cn(
                        "flex flex-col gap-1 rounded-xl border p-4 text-left transition-all",
                        active
                          ? "border-primary bg-primary-soft/60 ring-2 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/60",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2 font-medium text-foreground">
                        {c.label}
                        {active && <Check className="h-4 w-4 text-primary" />}
                      </span>
                      <span className="text-sm leading-snug text-muted-foreground">{c.blurb}</span>
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step title="Tell us a bit more, in your own words" subtitle="Plain English is perfect. This becomes the summary you can hand to your practitioner.">
              <div className="space-y-5">
                <div>
                  <Label htmlFor="words">What's going on?</Label>
                  <Textarea
                    id="words"
                    value={data.patientWords}
                    onChange={(e) => set({ patientWords: e.target.value })}
                    placeholder={concern ? `e.g. ${concern.patientPhrase}…` : "Describe what you're experiencing…"}
                  />
                </div>
                <div>
                  <Label htmlFor="duration" hint="optional">How long has this been going on?</Label>
                  <Chips options={DURATIONS} value={data.duration} onSelect={(v) => set({ duration: v })} />
                </div>
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step title="What affects it — and what have you tried?" subtitle="Anything you've noticed helps. Skip whatever doesn't apply.">
              <div className="space-y-5">
                <div>
                  <Label htmlFor="bw" hint="optional">What makes it better or worse?</Label>
                  <Textarea
                    id="bw"
                    value={data.betterWorse}
                    onChange={(e) => set({ betterWorse: e.target.value })}
                    placeholder="e.g. worse when I'm stressed, better after a good sleep…"
                  />
                </div>
                <div>
                  <Label htmlFor="tried" hint="optional">What have you already tried?</Label>
                  <Textarea
                    id="tried"
                    value={data.tried}
                    onChange={(e) => set({ tried: e.target.value })}
                    placeholder="e.g. earlier nights, changing my diet, seeing my GP…"
                  />
                </div>
              </div>
            </Step>
          )}

          {step === 3 && (
            <Step title="Anything you're currently taking?" subtitle="Medicines, supplements, herbal or traditional products — just list what you can remember.">
              <div>
                <Label htmlFor="taking" hint="optional">In your own words</Label>
                <Textarea
                  id="taking"
                  value={data.taking}
                  onChange={(e) => set({ taking: e.target.value })}
                  placeholder="e.g. a daily multivitamin, a herbal tea, a prescribed medicine…"
                />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  We don't check interactions here — listing it just means your practitioner and pharmacist can make sure
                  everything's safe together.
                </p>
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step title="What are you hoping to get from your visit?" subtitle="This helps your practitioner focus on what matters to you.">
              <div className="space-y-4">
                <Chips options={GOALS} value={data.goal} onSelect={(v) => set({ goal: v })} />
                <div>
                  <Label htmlFor="goal-text" hint="optional">Or say it your way</Label>
                  <Input
                    id="goal-text"
                    value={GOALS.includes(data.goal) ? "" : data.goal}
                    onChange={(e) => set({ goal: e.target.value })}
                    placeholder="In a sentence…"
                  />
                </div>
              </div>
            </Step>
          )}
        </div>

        {/* Persistent, woven-in safety line — never buried */}
        <p className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Educational only · never diagnoses · always routes you to a qualified practitioner.
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="ghost" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            {step > 0 && step < TOTAL_STEPS - 1 && (
              <button onClick={goNext} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Skip
              </button>
            )}
            <Button onClick={goNext} disabled={!canContinue}>
              {step === TOTAL_STEPS - 1 ? "See my Compass" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Prefer to skip ahead?{" "}
        <a href="#" onClick={(e) => { e.preventDefault(); onComplete(data.concernId ? data : { ...data, concernId: "something-else", concernLabel: "Something else" }); }} className="font-medium text-primary hover:underline">
          Jump to results
        </a>
      </p>
    </div>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-serif text-2xl leading-tight sm:text-[1.75rem]">{title}</h1>
      <p className="measure mt-2 mb-6 text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  );
}
