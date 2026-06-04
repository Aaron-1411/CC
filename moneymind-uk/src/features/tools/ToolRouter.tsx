import { lazy, Suspense } from "react";
import type { ToolSpec } from "../../lib/types";

// The 8 calculators are heavy (each pulls calc.ts + shared form UI) and only
// ever render on the "tool" step, after a user has worked through a lesson and
// quiz. Code-split them so none of this ships in the initial bundle — the
// dashboard and lessons load lighter, and a tool's chunk fetches on demand.
const PayslipTool = lazy(() => import("./PayslipTool").then((m) => ({ default: m.PayslipTool })));
const BenefitsCheckerTool = lazy(() => import("./BenefitsCheckerTool").then((m) => ({ default: m.BenefitsCheckerTool })));
const HolidayRedundancyTool = lazy(() => import("./HolidayRedundancyTool").then((m) => ({ default: m.HolidayRedundancyTool })));
const DebtStrategyTool = lazy(() => import("./DebtStrategyTool").then((m) => ({ default: m.DebtStrategyTool })));
const IsaGrowthTool = lazy(() => import("./IsaGrowthTool").then((m) => ({ default: m.IsaGrowthTool })));
const RentVsBuyTool = lazy(() => import("./RentVsBuyTool").then((m) => ({ default: m.RentVsBuyTool })));
const PensionProjectorTool = lazy(() => import("./PensionProjectorTool").then((m) => ({ default: m.PensionProjectorTool })));
const SelfAssessmentTool = lazy(() => import("./SelfAssessmentTool").then((m) => ({ default: m.SelfAssessmentTool })));

/** Renders the interactive tool for a module, picked by its ToolSpec.kind. */
export function ToolRouter({ tool, onUse }: { tool: ToolSpec; onUse: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold text-navy-900">{tool.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-navy-500">{tool.description}</p>
      </div>
      <Suspense fallback={<ToolSkeleton />}>
        <ToolBody kind={tool.kind} onUse={onUse} />
      </Suspense>
    </div>
  );
}

function ToolBody({ kind, onUse }: { kind: ToolSpec["kind"]; onUse: () => void }) {
  switch (kind) {
    case "payslip":
      return <PayslipTool onUse={onUse} />;
    case "benefitsChecker":
      return <BenefitsCheckerTool onUse={onUse} />;
    case "holidayRedundancy":
      return <HolidayRedundancyTool onUse={onUse} />;
    case "debtStrategy":
      return <DebtStrategyTool onUse={onUse} />;
    case "isaGrowth":
      return <IsaGrowthTool onUse={onUse} />;
    case "rentVsBuy":
      return <RentVsBuyTool onUse={onUse} />;
    case "pensionProjector":
      return <PensionProjectorTool onUse={onUse} />;
    case "selfAssessmentChecker":
      return <SelfAssessmentTool onUse={onUse} />;
    default:
      return null;
  }
}

// A calm placeholder while the tool chunk loads — matches the card rhythm so
// there's no layout jump when the real calculator swaps in.
function ToolSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-navy-100 bg-white p-6 shadow-card" aria-hidden>
      <div className="h-4 w-1/3 rounded bg-navy-100" />
      <div className="mt-4 space-y-3">
        <div className="h-10 rounded-xl bg-navy-50" />
        <div className="h-10 rounded-xl bg-navy-50" />
        <div className="h-10 w-2/3 rounded-xl bg-navy-50" />
      </div>
    </div>
  );
}
