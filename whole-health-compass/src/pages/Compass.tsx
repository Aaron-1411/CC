import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, Sparkles } from "lucide-react";
import { CompassFlow } from "@/flow/CompassFlow";
import { PractitionerSummary } from "@/components/PractitionerSummary";
import { ComparativeLens } from "@/components/ComparativeLens";
import { SafetyPanel, InteractionsReminder, RedFlags } from "@/components/SafetyPanel";
import { RedFlagInterrupt } from "@/components/RedFlagInterrupt";
import { ContentGovernanceLine } from "@/components/ContentGovernance";
import { PathwayNavigator } from "@/components/PathwayNavigator";
import { LeadForm } from "@/components/LeadForm";
import { Eyebrow, Button } from "@/components/ui";
import { getConcern } from "@/data/concerns";
import { hasTaking, type IntakeData } from "@/lib/summary";
import { track } from "@/lib/analytics";
import { screenText } from "@/lib/redflags";

const RESULT_KEY = "whc_result";

export function Compass() {
  const [result, setResult] = useState<IntakeData | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(RESULT_KEY);
      if (saved) setResult(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  const complete = (data: IntakeData) => {
    setResult(data);
    track("compass_summary_view", { concernId: data.concernId || "something-else" });
    try {
      sessionStorage.setItem(RESULT_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restart = () => {
    setResult(null);
    try {
      sessionStorage.removeItem(RESULT_KEY);
      sessionStorage.removeItem("whc_intake_progress");
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!result) {
    return (
      <div className="bg-paper">
        <div className="container py-10 sm:py-14">
          <CompassFlow onComplete={complete} />
        </div>
      </div>
    );
  }

  const concern = getConcern(result.concernId || "something-else");

  // Safety screen of everything the patient wrote, against the universal rules
  // plus this concern's extra audiences. Renders above the summary; never gates.
  const flags = useMemo(
    () =>
      screenText(
        [result.patientWords, result.betterWorse, result.tried, result.taking, result.duration, result.goal].join("  "),
        concern.sensitivity ?? [],
      ),
    [result, concern],
  );

  return (
    <div className="bg-paper">
      <div className="container max-w-4xl py-10 sm:py-14">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Eyebrow>
              <Sparkles className="h-3.5 w-3.5" /> Your Compass
            </Eyebrow>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Here's what you shared, from every angle</h1>
            <p className="measure mt-2 text-muted-foreground">
              Take what's useful to your practitioner. Remember: this is education to prepare you — the decisions happen
              with a qualified human.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={restart} className="shrink-0">
            <RotateCcw className="h-4 w-4" /> Start over
          </Button>
        </div>

        <div className="space-y-10">
          <RedFlagInterrupt rules={flags} />

          <PractitionerSummary data={result} />

          {hasTaking(result) && <InteractionsReminder />}

          <RedFlags items={concern.redFlags} />

          <div>
            <h2 className="mb-4 font-serif text-2xl">How different traditions understand this</h2>
            <ComparativeLens concern={concern} patientWords={result.patientWords} />
          </div>

          <SafetyPanel />

          <PathwayNavigator />

          <div id="contact" className="scroll-mt-20">
            <LeadForm summaryData={result} />
          </div>

          <ContentGovernanceLine />

          <p className="text-center text-sm text-muted-foreground">
            Want to look at something else?{" "}
            <button onClick={restart} className="font-medium text-primary hover:underline">
              Start a new Compass
            </button>{" "}
            or{" "}
            <Link to="/" className="font-medium text-primary hover:underline">
              return home
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
