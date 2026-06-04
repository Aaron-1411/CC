import { useState } from "react";
import { UK_FIGURES } from "../../content/constants";
import { gbp, NumberField, ResultStat, ResultRow, Assumptions, useFireOnce } from "./shared";

export function HolidayRedundancyTool({ onUse }: { onUse: () => void }) {
  const fire = useFireOnce(onUse);
  const [salary, setSalary] = useState(28000);
  const [age, setAge] = useState(35);
  const [years, setYears] = useState(6);
  const [daysPerWeek, setDaysPerWeek] = useState(5);

  const { statutoryHolidayWeeks, redundancyWeeklyPayCap, redundancyMaxYears } = UK_FIGURES.work;

  // Statutory holiday: 5.6 weeks, capped at 28 days for a 5-day+ week.
  const holidayDays = Math.min(Math.round(statutoryHolidayWeeks * daysPerWeek * 10) / 10, 28);

  // Statutory redundancy: age-banded weeks per year, service capped at 20 years,
  // a week's pay capped at the statutory limit. Needs 2+ years' service.
  const cappedYears = Math.min(Math.floor(years), redundancyMaxYears);
  let weeks = 0;
  for (let i = 0; i < cappedYears; i++) {
    const ageDuringYear = age - 1 - i;
    if (ageDuringYear >= 41) weeks += 1.5;
    else if (ageDuringYear >= 22) weeks += 1;
    else weeks += 0.5;
  }
  const weeklyPay = Math.min(salary / 52, redundancyWeeklyPayCap);
  const eligible = years >= 2;
  const redundancyPay = eligible ? weeks * weeklyPay : 0;

  const touch = () => fire();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Annual salary" value={salary} onChange={(n) => { setSalary(n); touch(); }} />
        <NumberField label="Your age" value={age} prefix="" onChange={(n) => { setAge(n); touch(); }} />
        <NumberField label="Full years of service" value={years} prefix="" onChange={(n) => { setYears(n); touch(); }} />
        <NumberField label="Days worked per week" value={daysPerWeek} prefix="" max={7} onChange={(n) => { setDaysPerWeek(n); touch(); }} />
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">Paid holiday</div>
        <ResultStat label="Statutory holiday entitlement" value={`${holidayDays} days / year`} sub={`Based on a ${daysPerWeek}-day week`} />
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">Statutory redundancy</div>
        {eligible ? (
          <>
            <ResultStat label="Estimated statutory redundancy pay" value={gbp(redundancyPay)} accent />
            <div className="mt-3 rounded-2xl border border-navy-100 p-4">
              <ResultRow label="Qualifying weeks' pay" value={`${weeks} weeks`} />
              <ResultRow label="A week's pay (capped)" value={gbp(weeklyPay)} />
              <ResultRow label="Service used (max 20 yrs)" value={`${cappedYears} years`} />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            You usually need at least <strong>2 years'</strong> continuous service to qualify for
            statutory redundancy pay. Your contract may offer more — check it.
          </div>
        )}
      </div>

      <Assumptions>
        Holiday is the legal minimum 5.6 weeks (28-day cap). Redundancy uses {UK_FIGURES.taxYear}{" "}
        rules: 0.5/1/1.5 weeks per year of service for ages under 22 / 22–40 / 41+, service capped at{" "}
        {redundancyMaxYears} years, and a week's pay capped at {gbp(redundancyWeeklyPayCap)}. Many
        employers pay more than the statutory minimum.
      </Assumptions>
    </div>
  );
}
