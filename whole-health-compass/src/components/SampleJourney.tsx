import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { clinicConfig } from "@/config/clinic";
import { getConcern, traditions } from "@/data/concerns";
import { PractitionerSummary } from "@/components/PractitionerSummary";
import { ComparativeLens } from "@/components/ComparativeLens";
import { Eyebrow, Pill, buttonClasses } from "@/components/ui";
import type { IntakeData } from "@/lib/summary";

// A realistic, pre-filled example shown instantly with no interaction.
// Re-skin per prospect by changing clinicConfig.sampleConcernId.
const SAMPLES: Record<string, Partial<IntakeData>> = {
  "low-energy-sleep": {
    patientWords: "I'm wiped out by mid-afternoon, then I can't switch off and I sleep badly.",
    duration: "About three months",
    betterWorse: "Worse during busy weeks at work; a little better on holiday.",
    tried: "Earlier nights and cutting back on caffeine.",
    taking: "A daily vitamin D supplement.",
    goal: "To understand what's going on and get a clear, calm plan.",
  },
  "stress-anxiety": {
    patientWords: "My mind races and I feel wound up most of the day, even when nothing's wrong.",
    duration: "Six months or so",
    betterWorse: "Worse in the mornings and before deadlines; better after exercise.",
    tried: "Breathing apps and trying to log off earlier.",
    goal: "To feel calmer and understand why this is happening.",
  },
  digestion: {
    patientWords: "I get bloated and uncomfortable after most meals and feel unpredictable.",
    duration: "On and off for a year",
    betterWorse: "Worse when I'm stressed or eating on the go; better on quiet weekends.",
    tried: "Keeping a rough food diary.",
    goal: "To understand the pattern and what to try first.",
  },
};

function buildSample(): IntakeData {
  const concern = getConcern(clinicConfig.sampleConcernId);
  const fill = SAMPLES[concern.id] ?? SAMPLES["low-energy-sleep"];
  return {
    concernId: concern.id,
    concernLabel: concern.label,
    patientWords: fill.patientWords || concern.patientPhrase,
    duration: fill.duration || "",
    betterWorse: fill.betterWorse || "",
    tried: fill.tried || "",
    taking: fill.taking || "",
    goal: fill.goal || "",
  };
}

export function SampleJourney() {
  const concern = getConcern(clinicConfig.sampleConcernId);
  const data = buildSample();

  return (
    <section aria-labelledby="sample-heading" className="container py-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        {/* Faux app chrome to signal "this is the real, live tool" */}
        <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
          {/* Faux traffic-light dots tinted from the active pack's traditions,
              so the chrome re-skins with the pack instead of hard-coding hues. */}
          <span className="flex gap-1.5">
            {traditions.map((t) => (
              <span
                key={t.key}
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: `hsl(${t.tint} / 0.5)` }}
              />
            ))}
          </span>
          <span className="ml-2 truncate text-xs text-muted-foreground">A real example — no sign-up needed</span>
        </div>

        <div className="space-y-8 p-5 sm:p-8">
          <div>
            <Eyebrow>
              <Sparkles className="h-3.5 w-3.5" /> See it in action
            </Eyebrow>
            <h2 id="sample-heading" className="mt-2 font-serif text-2xl sm:text-3xl">
              Someone arrives with a concern…
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tint="primary">{concern.category}</Pill>
              <span className="text-sm text-muted-foreground">
                In their words: <span className="text-foreground">“{data.patientWords}”</span>
              </span>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">…and instantly has a clear summary for their practitioner:</p>
            <PractitionerSummary data={data} />
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">…plus how each tradition understands it:</p>
            <ComparativeLens concern={concern} patientWords={data.patientWords} />
          </div>

          <div className="flex flex-col items-start gap-3 rounded-xl bg-primary-soft/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-serif text-lg text-foreground">That took no sign-up. Now try it with your own concern.</p>
            <Link to="/compass" className={buttonClasses("primary", "md")}>
              Start my Compass <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
