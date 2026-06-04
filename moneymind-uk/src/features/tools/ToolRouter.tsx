import type { ToolSpec } from "../../lib/types";
import { PayslipTool } from "./PayslipTool";
import { BenefitsCheckerTool } from "./BenefitsCheckerTool";
import { HolidayRedundancyTool } from "./HolidayRedundancyTool";
import { DebtStrategyTool } from "./DebtStrategyTool";
import { IsaGrowthTool } from "./IsaGrowthTool";
import { RentVsBuyTool } from "./RentVsBuyTool";
import { PensionProjectorTool } from "./PensionProjectorTool";
import { SelfAssessmentTool } from "./SelfAssessmentTool";

/** Renders the interactive tool for a module, picked by its ToolSpec.kind. */
export function ToolRouter({ tool, onUse }: { tool: ToolSpec; onUse: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold text-navy-900">{tool.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-navy-500">{tool.description}</p>
      </div>
      <ToolBody kind={tool.kind} onUse={onUse} />
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
