import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { UK_FIGURES } from "../../content/constants";
import { gbp, NumberField, SelectField, ToggleRow, useFireOnce } from "./shared";

type Household = "single" | "couple" | "singleParent";

interface Candidate {
  name: string;
  reason: string;
  estimate?: string;
  url: string;
}

export function BenefitsCheckerTool({ onUse }: { onUse: () => void }) {
  const fire = useFireOnce(onUse);
  const [household, setHousehold] = useState<Household>("single");
  const [children, setChildren] = useState(0);
  const [income, setIncome] = useState(22000);
  const [renting, setRenting] = useState(true);
  const [caring, setCaring] = useState(false);
  const [pensionAge, setPensionAge] = useState(false);

  const b = UK_FIGURES.benefits;
  const workingAge = !pensionAge;
  const hasKids = children > 0;
  const lowIncome = income < 35000;

  const candidates: Candidate[] = [];

  if (workingAge && (lowIncome || renting || hasKids)) {
    candidates.push({
      name: "Universal Credit",
      reason: "A monthly payment to help with living costs if you're on a low income or out of work. The amount depends on your income, savings, rent and household.",
      url: "https://www.gov.uk/universal-credit",
    });
  }

  if (hasKids) {
    const weekly = b.childBenefitFirstChildWeekly + b.childBenefitAdditionalChildWeekly * (children - 1);
    const overCharge = income > b.highIncomeChildBenefitChargeThreshold;
    candidates.push({
      name: "Child Benefit",
      reason: overCharge
        ? `Paid for each child, but the High Income Child Benefit Charge applies above ${gbp(b.highIncomeChildBenefitChargeThreshold)} and claws it all back by ${gbp(b.highIncomeChildBenefitChargeUpper)}.`
        : "A regular payment for anyone responsible for a child under 16 (or under 20 in approved education).",
      estimate: `~${gbp(weekly * 52)} a year`,
      url: "https://www.gov.uk/child-benefit",
    });
  }

  if (lowIncome || pensionAge) {
    candidates.push({
      name: "Council Tax Reduction",
      reason: "A discount on your Council Tax bill if you're on a low income or claim certain benefits. Run by your local council, so rules vary.",
      url: "https://www.gov.uk/apply-council-tax-reduction",
    });
  }

  if (pensionAge && income < 20000) {
    candidates.push({
      name: "Pension Credit",
      reason: "Tops up income for people over State Pension age on a low income — and can unlock help with rent, Council Tax and a free TV licence at 75+.",
      url: "https://www.gov.uk/pension-credit",
    });
  }

  if (caring) {
    candidates.push({
      name: "Carer's Allowance",
      reason: "For people who care at least 35 hours a week for someone who gets certain disability benefits. There's a cap on how much you can earn alongside it.",
      url: "https://www.gov.uk/carers-allowance",
    });
  }

  if (hasKids && lowIncome) {
    candidates.push({
      name: "Free School Meals",
      reason: "Free meals for school-age children if you receive Universal Credit or other qualifying benefits below an income threshold.",
      url: "https://www.gov.uk/apply-free-school-meals",
    });
    candidates.push({
      name: "Healthy Start",
      reason: "A prepaid card for free milk, fruit, vegetables and vitamins if you're more than 10 weeks pregnant or have a child under 4 and are on a low income.",
      url: "https://www.healthystart.nhs.uk/",
    });
  }

  if (household === "couple") {
    candidates.push({
      name: "Marriage Allowance",
      reason: `If one of you earns under the ${gbp(UK_FIGURES.incomeTax.personalAllowance)} Personal Allowance, you can transfer ${gbp(UK_FIGURES.tax.marriageAllowanceTransferable)} of it to the other to cut their tax bill.`,
      url: "https://www.gov.uk/marriage-allowance",
    });
  }

  const touch = () => fire();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField<Household>
          label="Your household"
          value={household}
          onChange={(v) => { setHousehold(v); touch(); }}
          options={[
            { value: "single", label: "Single, no children" },
            { value: "couple", label: "Couple" },
            { value: "singleParent", label: "Single parent" },
          ]}
        />
        <NumberField label="Number of children" value={children} prefix="" max={12} onChange={(n) => { setChildren(n); touch(); }} />
        <NumberField label="Household income a year" value={income} onChange={(n) => { setIncome(n); touch(); }} hint="Before tax, everyone in the home combined." />
      </div>

      <div className="flex flex-col gap-2">
        <ToggleRow label="We rent our home" checked={renting} onChange={(v) => { setRenting(v); touch(); }} />
        <ToggleRow label="I care 35+ hours a week for someone" checked={caring} onChange={(v) => { setCaring(v); touch(); }} />
        <ToggleRow label="I'm over State Pension age" checked={pensionAge} onChange={(v) => { setPensionAge(v); touch(); }} />
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
          You may be entitled to ({candidates.length})
        </div>
        {candidates.length === 0 ? (
          <div className="rounded-2xl border border-navy-100 bg-navy-50 p-4 text-sm text-navy-600">
            Nothing obvious flagged from these answers — but entitlements depend on your full situation.
            It's always worth running the free official checker below.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {candidates.map((c) => (
              <li key={c.name} className="rounded-2xl border border-navy-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-navy-900">{c.name}</span>
                  {c.estimate && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 tabular-nums">
                      {c.estimate}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-navy-600">{c.reason}</p>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
                >
                  Check on gov.uk <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        This is a rough guide, not a benefits decision. For an accurate, confidential estimate use a free
        official calculator:{" "}
        <a href="https://www.gov.uk/benefits-calculators" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
          gov.uk benefits calculators
        </a>
        .
      </div>
    </div>
  );
}
