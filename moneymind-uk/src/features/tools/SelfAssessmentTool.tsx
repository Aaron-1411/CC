import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { UK_FIGURES } from "../../content/constants";
import { gbp, ToggleRow, Assumptions, useFireOnce } from "./shared";

interface Q {
  id: string;
  label: string;
  reason: string;
}

export function SelfAssessmentTool({ onUse }: { onUse: () => void }) {
  const fire = useFireOnce(onUse);
  const { tax, benefits, incomeTax } = UK_FIGURES;

  const fileQs: Q[] = [
    {
      id: "selfemployed",
      label: `Self-employed with turnover over ${gbp(tax.selfAssessmentUntaxedIncomeThreshold)}`,
      reason: `Self-employment income above the ${gbp(tax.tradingAllowance)} trading allowance must be reported.`,
    },
    {
      id: "property",
      label: `Rental income over ${gbp(tax.propertyAllowance)} a year`,
      reason: `Property income above the ${gbp(tax.propertyAllowance)} property allowance is taxable and reported here.`,
    },
    {
      id: "hicbc",
      label: `You or your partner earn over ${gbp(benefits.highIncomeChildBenefitChargeThreshold)} and get Child Benefit`,
      reason: `The High Income Child Benefit Charge applies above ${gbp(benefits.highIncomeChildBenefitChargeThreshold)} and is collected through Self Assessment.`,
    },
    {
      id: "untaxed",
      label: "Untaxed income — tips, commission, or large savings/dividend income",
      reason: "Income that isn't taxed at source may need declaring once it passes the tax-free allowances.",
    },
    {
      id: "cgt",
      label: `Sold assets (shares, a second property) with gains over ${gbp(tax.capitalGainsAnnualExemption)}`,
      reason: `Gains above the ${gbp(tax.capitalGainsAnnualExemption)} Capital Gains Tax exemption must be reported.`,
    },
    {
      id: "other",
      label: "Foreign income, or you're a company director or business partner",
      reason: "Foreign income and most directors/partners are required to file a return.",
    },
  ];

  const reclaimQs: Q[] = [
    {
      id: "marriage",
      label: `Married/civil partners and one earns under the ${gbp(incomeTax.personalAllowance)} Personal Allowance`,
      reason: `Marriage Allowance lets the lower earner transfer ${gbp(tax.marriageAllowanceTransferable)} of allowance — and you can backdate claims up to 4 years.`,
    },
    {
      id: "expenses",
      label: "You pay for a work uniform, tools or professional fees yourself",
      reason: "You can usually claim tax relief on essential job costs your employer doesn't reimburse.",
    },
  ];

  const [ans, setAns] = useState<Record<string, boolean>>({});
  const set = (id: string, v: boolean) => {
    setAns((a) => ({ ...a, [id]: v }));
    fire();
  };

  const fileReasons = fileQs.filter((q) => ans[q.id]);
  const reclaimReasons = reclaimQs.filter((q) => ans[q.id]);
  const mustFile = fileReasons.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
          Do any of these apply to this tax year?
        </div>
        <div className="flex flex-col gap-2">
          {fileQs.map((q) => (
            <ToggleRow key={q.id} label={q.label} checked={!!ans[q.id]} onChange={(v) => set(q.id, v)} />
          ))}
        </div>
      </div>

      {mustFile ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
          <div className="font-semibold text-emerald-900">You likely need to file a Self Assessment</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800">
            {fileReasons.map((q) => (
              <li key={q.id}>{q.reason}</li>
            ))}
          </ul>
          <a
            href="https://www.gov.uk/register-for-self-assessment"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
          >
            Register for Self Assessment <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <p className="mt-2 text-xs text-emerald-700">
            Online returns and any tax owed are usually due by 31 January after the tax year ends.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-navy-100 bg-navy-50 p-4 text-sm text-navy-600">
          From these answers you probably <strong>don't</strong> need to file a Self Assessment — most
          employees are taxed automatically through PAYE. It's still worth confirming with the official
          checker below.
        </div>
      )}

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
          You might be owed tax back
        </div>
        <div className="flex flex-col gap-2">
          {reclaimQs.map((q) => (
            <ToggleRow key={q.id} label={q.label} checked={!!ans[q.id]} onChange={(v) => set(q.id, v)} />
          ))}
        </div>
        {reclaimReasons.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2">
            {reclaimReasons.map((q) => (
              <li key={q.id} className="rounded-xl border border-navy-100 p-3 text-sm text-navy-600">
                {q.reason}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-navy-100 p-3 text-sm">
        <a
          href="https://www.gov.uk/check-if-you-need-tax-return"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
        >
          Use the official "check if you need to send a tax return" tool <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <Assumptions>
        A general guide based on common {UK_FIGURES.taxYear} triggers, not a ruling from HMRC. Tax-free
        allowances, the {gbp(benefits.highIncomeChildBenefitChargeThreshold)} Child Benefit threshold and
        the {gbp(tax.capitalGainsAnnualExemption)} Capital Gains exemption are the current figures. Your
        own circumstances can change things — always confirm with HMRC's official checker. Not advice.
      </Assumptions>
    </div>
  );
}
