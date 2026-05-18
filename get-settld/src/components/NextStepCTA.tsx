// "Next step" suggestion shown at the bottom of any tool page. Pass the current
// route — we look up the pillar and propose the next sibling tool, plus a nudge
// based on which scenario fields are still missing (MIP if no deposit, etc.).
import { Link, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { PILLARS } from "@/lib/pillars";
import { useScenario } from "@/context/ScenarioContext";

interface Suggestion { title: string; to: string; why: string }

function nudge(scenario: ReturnType<typeof useScenario>["scenario"]): Suggestion | null {
  if (!scenario.deposit || scenario.deposit < 1000) {
    return { title: "Plan your deposit", to: "/deposit", why: "We don't have a deposit yet — let's set a target." };
  }
  if (!scenario.income || scenario.income < 10000) {
    return { title: "Get a Mortgage in Principle", to: "/mip", why: "Add your income and run a soft credit check." };
  }
  return null;
}

export default function NextStepCTA() {
  const { pathname } = useLocation();
  const { scenario } = useScenario();

  // Skip on home, journey, decide etc. where there's already a CTA pattern.
  if (["/", "/decide", "/journey"].includes(pathname) || pathname.startsWith("/start/")) return null;

  const pillar = PILLARS.find((p) => p.to === pathname || p.more.some((m) => m.to === pathname));
  if (!pillar) return null;

  const all = [{ title: pillar.title, to: pillar.to }, ...pillar.more];
  const idx = all.findIndex((t) => t.to === pathname);
  const next = all[idx + 1] ?? all[0];

  const suggestion = nudge(scenario) ?? {
    title: next.title,
    to: next.to,
    why: `Continue exploring "${pillar.title}" with ${next.title}.`,
  };

  if (suggestion.to === pathname) return null;

  return (
    <Card className="mt-8 p-5 border-brand/30 bg-brand-muted/30">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-brand font-semibold">Suggested next step</p>
          <p className="font-serif text-lg font-bold text-brand mt-0.5">{suggestion.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{suggestion.why}</p>
        </div>
        <Link
          to={suggestion.to}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand text-brand-foreground px-3 py-2 text-sm font-semibold hover:bg-brand/90"
        >
          Open <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
