import { useState } from "react";
import { UK_FIGURES } from "../../content/constants";
import { gbp, NumberField, ResultStat, ResultRow, Assumptions, useFireOnce } from "./shared";

export function PensionProjectorTool({ onUse }: { onUse: () => void }) {
  const fire = useFireOnce(onUse);
  const [age, setAge] = useState(35);
  const [retireAge, setRetireAge] = useState(68);
  const [pot, setPot] = useState(15000);
  const [yourMonthly, setYourMonthly] = useState(150);
  const [employerMonthly, setEmployerMonthly] = useState(90);
  const [growth, setGrowth] = useState(5);

  const { fullNewWeekly } = UK_FIGURES.statePension;

  // Monthly compounding: pay in, then grow, each month until retirement.
  const months = Math.max(0, Math.floor(retireAge - age)) * 12;
  const monthlyIn = Math.max(0, yourMonthly) + Math.max(0, employerMonthly);
  const r = growth / 100 / 12;
  let projected = Math.max(0, pot);
  for (let m = 0; m < months; m++) {
    projected += monthlyIn;
    projected *= 1 + r;
  }
  const contributed = Math.max(0, pot) + monthlyIn * months;
  const growthAmount = Math.max(0, projected - contributed);

  // Rough retirement income: 4% "rule of thumb" drawdown + full new State Pension.
  const statePensionYear = fullNewWeekly * 52;
  const drawdownYear = projected * 0.04;
  const totalYear = drawdownYear + statePensionYear;

  const touch = () => fire();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Your age now" value={age} prefix="" max={80} onChange={(n) => { setAge(n); touch(); }} />
        <NumberField label="Planned retirement age" value={retireAge} prefix="" max={80} onChange={(n) => { setRetireAge(n); touch(); }} />
        <NumberField label="Pension pot so far" value={pot} onChange={(n) => { setPot(n); touch(); }} />
        <NumberField label="Assumed growth a year" value={growth} prefix="" suffix="%" max={20} onChange={(n) => { setGrowth(n); touch(); }} />
        <NumberField label="You pay in monthly" value={yourMonthly} onChange={(n) => { setYourMonthly(n); touch(); }} />
        <NumberField label="Employer pays in monthly" value={employerMonthly} onChange={(n) => { setEmployerMonthly(n); touch(); }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ResultStat label={`Pot at age ${Math.max(age, Math.floor(retireAge))}`} value={gbp(projected)} accent />
        <ResultStat label="Est. yearly income" value={gbp(totalYear)} sub="Pension drawdown + State Pension" />
      </div>

      <div className="rounded-2xl border border-navy-100 p-4">
        <ResultRow label="Paid in (you + employer + start)" value={gbp(contributed)} />
        <ResultRow label="Investment growth" value={`+ ${gbp(growthAmount)}`} />
        <div className="my-1 border-t border-navy-100" />
        <ResultRow label="Projected pot" value={gbp(projected)} strong />
      </div>

      <div className="rounded-2xl border border-navy-100 bg-navy-50/50 p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-navy-500">
          Rough yearly retirement income
        </div>
        <ResultRow label="From your pot (4% a year)" value={gbp(drawdownYear)} />
        <ResultRow label="Full new State Pension" value={gbp(statePensionYear)} />
        <ResultRow label="Total a year" value={gbp(totalYear)} strong />
      </div>

      <Assumptions>
        A simple projection: contributions are added monthly and the pot grows a steady {growth}% a year
        — real investments rise and fall. The income estimate uses the "4% rule" rule of thumb plus the
        full new State Pension ({gbp(fullNewWeekly)}/week, {UK_FIGURES.taxYear}), which needs 35 qualifying
        years. Your contributions normally get tax relief, and many employers match more if you pay in more.
        Figures aren't adjusted for inflation. Not advice — for a personal forecast, check your provider or
        a State Pension forecast on gov.uk.
      </Assumptions>
    </div>
  );
}
