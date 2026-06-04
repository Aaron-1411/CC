import { useState } from "react";
import { UK_FIGURES } from "../../content/constants";
import { incomeTax, employeeNI, employerNI, personalAllowance } from "./calc";
import { gbp, NumberField, ResultStat, ResultRow, Assumptions, useFireOnce } from "./shared";

export function PayslipTool({ onUse }: { onUse: () => void }) {
  const fire = useFireOnce(onUse);
  const [salary, setSalary] = useState(28000);

  const tax = incomeTax(salary);
  const ni = employeeNI(salary);
  const net = Math.max(0, salary - tax - ni);
  const erNI = employerNI(salary);
  const pa = personalAllowance(salary);

  return (
    <div className="flex flex-col gap-5">
      <NumberField
        label="Your gross annual salary"
        value={salary}
        onChange={(n) => {
          setSalary(n);
          if (n > 0) fire();
        }}
        hint="The full, pre-deduction figure in your contract."
      />

      {salary > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <ResultStat label="Take-home / year" value={gbp(net)} accent />
            <ResultStat label="Take-home / month" value={gbp(net / 12)} sub="Roughly, before pension" />
          </div>

          <div className="rounded-2xl border border-navy-100 p-4">
            <ResultRow label="Gross salary" value={gbp(salary)} />
            <ResultRow label="Personal Allowance (tax-free)" value={gbp(pa)} />
            <ResultRow label="Income Tax" value={`− ${gbp(tax)}`} />
            <ResultRow label="National Insurance" value={`− ${gbp(ni)}`} />
            <div className="my-1 border-t border-navy-100" />
            <ResultRow label="Take-home pay" value={gbp(net)} strong />
          </div>

          <div className="rounded-2xl border border-navy-100 bg-navy-50/50 p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-navy-500">
              What your employer pays on top
            </div>
            <ResultRow label="Employer's National Insurance" value={gbp(erNI)} />
            <ResultRow label="Total cost to employer" value={gbp(salary + erNI)} strong />
          </div>
        </>
      )}

      <Assumptions>
        Uses {UK_FIGURES.taxYear} Income Tax and National Insurance figures for England, Wales &
        Northern Ireland. Excludes pension contributions, student-loan repayments and any
        salary-sacrifice arrangements. Scotland has different Income Tax bands.
      </Assumptions>
    </div>
  );
}
