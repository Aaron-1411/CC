import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Section, StatCard } from "@/components/ui-bits";
import { DetailTable, TypePill } from "@/components/DetailTable";
import { computeTakeHome, fmtGBP, fmtPct, projectGrowth, UK } from "@/lib/uk-tax";
import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Banknote, TrendingUp, Target } from "lucide-react";

export const Route = createFileRoute("/income")({
  head: () => ({
    meta: [
      { title: "Income & passive income — Sterling" },
      { name: "description", content: "Total earnings, passive income and savings goal targets in one view." },
    ],
  }),
  component: IncomePage,
});

function IncomePage() {
  const [s, set] = useStore();
  const sa = s.selfAssessment;

  const th = computeTakeHome({ grossSalary: s.profile.grossSalary, studentLoan: s.profile.studentLoanPlan });
  const sumEntries = (e: { amount: number }[]) => e.reduce((a, x) => a + x.amount, 0);

  // Active income (earned)
  const employment = s.profile.grossSalary + sumEntries(sa.employmentIncome);
  const selfEmpNet = sumEntries(sa.selfEmployment) - sumEntries(sa.selfEmploymentExpenses);

  // Passive income — annualised
  const savingsInterest = s.savings.reduce((a, x) => a + x.balance * x.rate, 0) + sumEntries(sa.savingsInterest);
  const dividends = sumEntries(sa.dividends);
  const rentalNet = sumEntries(sa.rentalIncome) - sumEntries(sa.rentalExpenses);
  const otherPassive = sumEntries(sa.otherIncome);

  // Implied investment growth income (not cashflow but tracks wealth-building)
  const isaMonthly = s.isas.reduce((a, i) => a + i.monthlyContribution, 0);
  const pensionMonthly = s.pensions.reduce((a, p) => a + p.monthlyOwn + p.monthlyEmployer, 0);
  const customMonthly = s.customAssets.reduce((a, c) => a + c.monthlyContribution, 0);
  const investedAnnually = (isaMonthly + pensionMonthly + customMonthly) * 12;

  const totalActive = employment + selfEmpNet;
  const totalPassive = savingsInterest + dividends + rentalNet + otherPassive;
  const totalIncome = totalActive + totalPassive;
  const passivePct = totalIncome > 0 ? totalPassive / totalIncome : 0;

  // Savings rate
  const savingsRate = th.takeHome > 0 ? (investedAnnually / 12) / th.takeHome : 0;

  // Future passive income at retirement (4% rule applied to total invested wealth)
  const retireAge = s.goals.retirementAge;
  const yearsToRet = Math.max(1, retireAge - s.profile.age);

  // Scenario: target passive income
  const [targetPassive, setTargetPassive] = useState(s.goals.retirementIncome);
  const [withdrawalRate, setWithdrawalRate] = useState(4);
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [returnPct, setReturnPct] = useState(6);

  const scenario = useMemo(() => {
    const startInvested = s.pensions.reduce((a, p) => a + p.currentValue, 0)
      + s.isas.reduce((a, i) => a + i.currentValue, 0)
      + s.customAssets.reduce((a, c) => a + c.currentValue, 0);
    const m = isaMonthly + pensionMonthly + customMonthly + extraMonthly;
    const data: any[] = [];
    for (let y = 0; y <= yearsToRet; y++) {
      const pot = projectGrowth(startInvested, m, returnPct / 100, y).slice(-1)[0]?.value ?? startInvested;
      data.push({ year: y, pot, income: pot * (withdrawalRate / 100) });
    }
    return data;
  }, [extraMonthly, returnPct, withdrawalRate, yearsToRet, isaMonthly, pensionMonthly, customMonthly, s.pensions, s.isas, s.customAssets]);

  const finalIncome = scenario[scenario.length - 1]?.income ?? 0;
  const targetPotNeeded = targetPassive / (withdrawalRate / 100);
  const finalPot = scenario[scenario.length - 1]?.pot ?? 0;
  const onTrack = finalIncome >= targetPassive;

  // Update goal when target slider changes
  const setRetirementIncome = (v: number) => {
    setTargetPassive(v);
    set((st) => ({ ...st, goals: { ...st.goals, retirementIncome: v } }));
  };

  const incomeRows = [
    { id: "salary", label: "Salary (PAYE)", type: "Active", amount: s.profile.grossSalary, note: "Your gross annual salary" },
    ...(sumEntries(sa.employmentIncome) > 0 ? [{ id: "ei", label: "Other employment income", type: "Active", amount: sumEntries(sa.employmentIncome), note: "Other PAYE income from Self Assessment" }] : []),
    ...(selfEmpNet !== 0 ? [{ id: "se", label: "Self-employment (net)", type: "Active", amount: selfEmpNet, note: "Income minus allowable expenses" }] : []),
    { id: "int", label: "Savings interest", type: "Passive", amount: savingsInterest, note: `Allowance: £${th.bands.higher > 0 ? UK.savingsAllowanceHigher : UK.savingsAllowanceBasic} tax-free` },
    ...(dividends > 0 ? [{ id: "div", label: "Dividends", type: "Passive", amount: dividends, note: `£${UK.dividendAllowance} tax-free allowance` }] : []),
    ...(rentalNet !== 0 ? [{ id: "rent", label: "Rental (net)", type: "Passive", amount: rentalNet, note: "After expenses" }] : []),
    ...(otherPassive > 0 ? [{ id: "oth", label: "Other income", type: "Passive", amount: otherPassive, note: "Royalties, trusts, etc." }] : []),
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Earnings"
        title="Income & passive income"
        description="Everything you earn — active and passive — and the path to financial independence."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total income / yr" value={fmtGBP(totalIncome)} hint="Active + passive" tone="primary" />
        <StatCard label="Active (earned)" value={fmtGBP(totalActive)} hint="Salary + freelance" />
        <StatCard label="Passive" value={fmtGBP(totalPassive)} hint={`${(passivePct * 100).toFixed(0)}% of total`} tone="gold" />
        <StatCard label="Savings rate" value={fmtPct(savingsRate, 0)} hint={`${fmtGBP(investedAnnually/12)}/mo invested`} tone={savingsRate >= 0.20 ? "success" : savingsRate >= 0.10 ? "default" : "warning"} />
      </div>

      <Section title="Income breakdown" description="Every income stream the app knows about. Add more on the Self Assessment tab.">
        <DetailTable
          empty="Add a salary on Profile to start."
          columns={[
            { key: "label", header: "Source", render: (r: any) => <span className="font-medium">{r.label}</span> },
            { key: "type", header: "Type", hint: "Active = your time. Passive = money working for you.", render: (r: any) => <TypePill tone={r.type === "Passive" ? "gold" : "primary"}>{r.type}</TypePill> },
            { key: "amount", header: "Annual (£)", align: "right", render: (r: any) => <span className="font-semibold">{fmtGBP(r.amount)}</span> },
            { key: "monthly", header: "Monthly (£)", align: "right", render: (r: any) => <span>{fmtGBP(r.amount / 12)}</span> },
            { key: "note", header: "Note", render: (r: any) => <span className="text-xs text-muted-foreground">{r.note}</span> },
          ]}
          rows={incomeRows}
          footer={
            <tr>
              <td className="px-3 py-2.5" colSpan={2}>Total</td>
              <td className="px-3 py-2.5 text-right num font-semibold text-primary">{fmtGBP(totalIncome)}</td>
              <td className="px-3 py-2.5 text-right num">{fmtGBP(totalIncome / 12)}</td>
              <td></td>
            </tr>
          }
        />
      </Section>

      <Section
        title="Passive income goal"
        description="Set the passive income you want to live on, then plan how to get there. Common rules: the 4% safe withdrawal rate suggests you need ~25× your annual spending in invested assets."
      >
        <Card>
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <SliderRow label="Target passive income / yr" value={fmtGBP(targetPassive)} sub="In today's money — what you'd want to live on without working">
              <Slider min={5000} max={150000} step={1000} value={[targetPassive]} onValueChange={(v) => setRetirementIncome(v[0])} />
            </SliderRow>
            <SliderRow label="Safe withdrawal rate" value={`${withdrawalRate}%`} sub="3% = very cautious · 4% = classic rule · 5% = optimistic">
              <Slider min={3} max={6} step={0.25} value={[withdrawalRate]} onValueChange={(v) => setWithdrawalRate(v[0])} />
            </SliderRow>
            <SliderRow label="Extra monthly to invest" value={fmtGBP(extraMonthly)} sub="Above what you already invest">
              <Slider min={0} max={3000} step={50} value={[extraMonthly]} onValueChange={(v) => setExtraMonthly(v[0])} />
            </SliderRow>
            <SliderRow label="Expected return / yr" value={`${returnPct}%`} sub="Diversified equities historically ~6–8% real">
              <Slider min={2} max={12} step={1} value={[returnPct]} onValueChange={(v) => setReturnPct(v[0])} />
            </SliderRow>
          </div>

          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <StatCard label="Pot needed" value={fmtGBP(targetPotNeeded)} hint={`= ${fmtGBP(targetPassive)} ÷ ${withdrawalRate}%`} />
            <StatCard label={`Projected pot at ${retireAge}`} value={fmtGBP(finalPot)} hint={`${(Math.min(1, finalPot/Math.max(1,targetPotNeeded))*100).toFixed(0)}% of target`} tone={onTrack ? "success" : "warning"} />
            <StatCard label="Projected passive income" value={fmtGBP(finalIncome)} hint={onTrack ? "Hits your goal ✓" : `${fmtGBP(targetPassive - finalIncome)} short / yr`} tone={onTrack ? "success" : "warning"} />
          </div>

          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={scenario.filter((_, i) => i % Math.max(1, Math.ceil(scenario.length / 12)) === 0 || i === scenario.length - 1)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `+${v}y`} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: number) => fmtGBP(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" fill="var(--gold)" name={`Annual passive income at ${withdrawalRate}%`} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Section>

      <Section title="Savings goal targets" description="Common milestones — see where you stand against each.">
        <div className="grid md:grid-cols-3 gap-3">
          <Milestone icon={<Banknote className="h-4 w-4" />} label="Save 10% of take-home" achieved={savingsRate >= 0.10} sub={`You're saving ${(savingsRate*100).toFixed(0)}% — minimum recommended baseline.`} />
          <Milestone icon={<TrendingUp className="h-4 w-4" />} label="Save 20% of take-home" achieved={savingsRate >= 0.20} sub="Strong saver territory — most pension calculators assume this." />
          <Milestone icon={<Target className="h-4 w-4" />} label="Reach FI number" achieved={finalPot >= targetPotNeeded} sub={`Need ${fmtGBP(targetPotNeeded)} invested for ${fmtGBP(targetPassive)}/yr.`} />
        </div>
      </Section>

      <div className="rounded-lg bg-muted/40 border border-dashed p-3 text-xs text-muted-foreground">
        Passive income excludes capital growth — only cash-yielding sources are counted. The "savings goal" assumes today's money (no inflation adjustment).
      </div>
    </div>
  );
}

function SliderRow({ label, value, sub, children }: { label: string; value: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-display text-sm font-semibold num">{value}</span>
      </div>
      {children}
      {sub && <div className="text-[10px] text-muted-foreground mt-1.5">{sub}</div>}
    </div>
  );
}

function Milestone({ icon, label, achieved, sub }: { icon: React.ReactNode; label: string; achieved: boolean; sub: string }) {
  return (
    <Card>
      <div className="flex items-start gap-2">
        <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${achieved ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm flex items-center gap-1.5">
            {label}
            {achieved && <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/15 text-success">Done</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
      </div>
    </Card>
  );
}
