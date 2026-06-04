import { useState } from "react";
import { UK_FIGURES } from "../../content/constants";
import { gbp, NumberField, SelectField, ResultStat, ResultRow, Assumptions, useFireOnce } from "./shared";

type IsaType = "cash" | "stocks" | "lisa";

export function IsaGrowthTool({ onUse }: { onUse: () => void }) {
  const fire = useFireOnce(onUse);
  const [type, setType] = useState<IsaType>("stocks");
  const [annual, setAnnual] = useState(2400);
  const [years, setYears] = useState(10);
  const [growth, setGrowth] = useState(5);

  const { isaAllowance, lisaAllowance, lisaBonusRate } = UK_FIGURES.savings;
  const cap = type === "lisa" ? lisaAllowance : isaAllowance;
  const contribution = Math.min(annual, cap);
  const capped = annual > cap;

  // Year-by-year: pay in (plus the LISA bonus, max £1,000), then grow.
  const yrs = Math.min(Math.max(Math.floor(years), 0), 60);
  let pot = 0;
  let contributed = 0;
  let bonus = 0;
  for (let y = 0; y < yrs; y++) {
    contributed += contribution;
    pot += contribution;
    if (type === "lisa") {
      const b = Math.min(contribution * lisaBonusRate, lisaAllowance * lisaBonusRate);
      bonus += b;
      pot += b;
    }
    pot *= 1 + growth / 100;
  }
  const growthAmount = Math.max(0, pot - contributed - bonus);

  const touch = () => fire();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField<IsaType>
          label="Account type"
          value={type}
          onChange={(v) => { setType(v); touch(); }}
          options={[
            { value: "stocks", label: "Stocks & Shares ISA" },
            { value: "cash", label: "Cash ISA" },
            { value: "lisa", label: "Lifetime ISA (LISA)" },
          ]}
        />
        <NumberField
          label="You pay in each year"
          value={annual}
          onChange={(n) => { setAnnual(n); touch(); }}
          hint={capped ? `Capped at the ${gbp(cap)} annual limit.` : undefined}
        />
        <NumberField label="Years invested" value={years} prefix="" max={60} onChange={(n) => { setYears(n); touch(); }} />
        <NumberField label="Assumed growth a year" value={growth} prefix="" suffix="%" max={20} onChange={(n) => { setGrowth(n); touch(); }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ResultStat label={`Pot after ${yrs} years`} value={gbp(pot)} accent />
        <ResultStat label="You paid in" value={gbp(contributed)} sub={capped ? `Limited to ${gbp(contribution)}/yr` : undefined} />
      </div>

      <div className="rounded-2xl border border-navy-100 p-4">
        <ResultRow label="Your contributions" value={gbp(contributed)} />
        {type === "lisa" && <ResultRow label="Government bonus (25%)" value={`+ ${gbp(bonus)}`} />}
        <ResultRow label="Investment growth" value={`+ ${gbp(growthAmount)}`} />
        <div className="my-1 border-t border-navy-100" />
        <ResultRow label="Projected pot" value={gbp(pot)} strong />
      </div>

      <Assumptions>
        Growth is assumed steady at {growth}% a year and compounded annually — real returns go up and
        down, and a Cash ISA usually grows more slowly than Stocks & Shares. All ISAs share one{" "}
        {gbp(isaAllowance)} annual allowance ({UK_FIGURES.taxYear}); the LISA limit is {gbp(lisaAllowance)} and
        adds a 25% government bonus (up to {gbp(lisaAllowance * lisaBonusRate)} a year). LISA savings are
        for a first home or age 60+ — other withdrawals carry a 25% charge. ISA returns are tax-free.
        Not advice.
      </Assumptions>
    </div>
  );
}
