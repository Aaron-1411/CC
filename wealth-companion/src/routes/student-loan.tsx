import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Section, StatCard } from "@/components/ui-bits";
import { studentLoanPayoff, fmtGBP, UK } from "@/lib/uk-tax";
import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { GraduationCap, AlertTriangle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/student-loan")({
  head: () => ({
    meta: [
      { title: "Student loan — Sterling" },
      { name: "description", content: "See whether overpaying your UK student loan saves money or wastes it." },
    ],
  }),
  component: StudentLoanPage,
});

const PLAN_INTEREST: Record<string, number> = {
  none: 0, plan1: 0.043, plan2: 0.043, plan4: 0.043, plan5: 0.043, postgrad: 0.077,
};

function StudentLoanPage() {
  const [s, set] = useStore();
  const p = s.profile;
  const plan = p.studentLoanPlan;

  const interestRate = PLAN_INTEREST[plan] ?? 0.043;
  const balance = p.studentLoanBalance;

  const [extraMonthly, setExtraMonthly] = useState(0);
  const [salaryGrowth, setSalaryGrowth] = useState(2);

  const baseline = useMemo(() => studentLoanPayoff(balance, p.grossSalary, plan, interestRate, 0), [balance, p.grossSalary, plan, interestRate]);
  const overpay = useMemo(() => studentLoanPayoff(balance, p.grossSalary, plan, interestRate, extraMonthly), [balance, p.grossSalary, plan, interestRate, extraMonthly]);

  // Combined chart
  const chartData = useMemo(() => {
    const len = Math.max(baseline.schedule.length, overpay.schedule.length);
    const data: any[] = [];
    for (let i = 0; i < len; i++) {
      data.push({
        year: baseline.schedule[i]?.year ?? overpay.schedule[i]?.year ?? i,
        baseline: baseline.schedule[i]?.balance,
        overpay: overpay.schedule[i]?.balance,
      });
    }
    return data;
  }, [baseline, overpay]);

  const yearsBaseline = baseline.monthsToClear / 12;
  const yearsOverpay = overpay.monthsToClear / 12;
  const yearsSaved = yearsBaseline - yearsOverpay;
  const interestSaved = baseline.interestPaid - overpay.interestPaid;
  const totalExtraPaid = extraMonthly * overpay.monthsToClear;

  // Opportunity cost: what would £extraMonthly be if invested instead at 6%?
  const investReturn = 0.06;
  const r = investReturn / 12;
  const months = baseline.monthsToClear;
  const futureValueIfInvested = months > 0 && r > 0 && extraMonthly > 0
    ? extraMonthly * ((Math.pow(1 + r, months) - 1) / r)
    : 0;

  // Plan 2/4/5 wipe after 30 years; Plan 1 after 25; postgrad after 30
  const wipeYears = plan === "plan1" ? 25 : 30;
  const willBeWiped = baseline.monthsToClear / 12 >= wipeYears;

  return (
    <div>
      <PageHeader
        eyebrow="Debt"
        title="Student loan strategy"
        description="UK student loans are unusual — for many, they get written off before being repaid. See if extra payments help or hurt."
      />

      {plan === "none" || balance === 0 ? (
        <Card>
          <div className="flex items-start gap-3">
            <GraduationCap className="h-6 w-6 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">No student loan tracked</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Set your plan and outstanding balance on the <a href="/profile" className="text-primary font-semibold">Profile</a> page to see strategy options.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatCard label="Outstanding balance" value={fmtGBP(balance)} hint={`Plan ${plan.replace("plan", "")}`} tone="primary" />
            <StatCard label="Interest rate" value={`${(interestRate * 100).toFixed(2)}%`} hint="Indicative — varies with RPI" />
            <StatCard label="Required monthly" value={fmtGBP(baseline.monthlyRequired)} hint={`9% of salary above £${UK[plan === "postgrad" ? "personalAllowance" : "personalAllowance"].toLocaleString()}`} />
            <StatCard label="Years to clear" value={yearsBaseline.toFixed(1)} hint={willBeWiped ? `Wipes at year ${wipeYears}` : "Paid off normally"} tone={willBeWiped ? "warning" : "default"} />
          </div>

          {willBeWiped && (
            <Card className="!border-warning/50 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning-foreground shrink-0" />
                <div className="text-sm">
                  <strong>Heads up:</strong> at your current income & balance, the loan is on track to be <strong>written off at year {wipeYears}</strong> before you fully repay it.
                  Overpaying means giving HMRC money you'd otherwise never have paid. The classic advice: <strong>do NOT overpay</strong> in this scenario.
                </div>
              </div>
            </Card>
          )}

          <Section
            title="Should you pay it off early?"
            description="Slide an extra monthly amount and compare. Compare against investing the same money at 6% — the real opportunity cost."
          >
            <Card>
              <div className="grid md:grid-cols-2 gap-5 mb-5">
                <SliderRow label="Extra monthly payment" value={fmtGBP(extraMonthly)} sub="On top of the automatic 9% deduction">
                  <Slider min={0} max={1000} step={25} value={[extraMonthly]} onValueChange={(v) => setExtraMonthly(v[0])} />
                </SliderRow>
                <SliderRow label="Annual salary growth" value={`${salaryGrowth}%`} sub="Higher growth = you'd repay anyway, so overpaying matters less">
                  <Slider min={0} max={8} step={0.5} value={[salaryGrowth]} onValueChange={(v) => setSalaryGrowth(v[0])} />
                </SliderRow>
              </div>

              <div className="grid md:grid-cols-4 gap-3 mb-5">
                <StatCard label="Years saved" value={`${Math.max(0, yearsSaved).toFixed(1)} yrs`} hint={`Cleared at year ${yearsOverpay.toFixed(1)}`} tone="primary" />
                <StatCard label="Interest avoided" value={fmtGBP(interestSaved)} hint="Less interest the loan accrues" tone="success" />
                <StatCard label="Total extra you'd pay" value={fmtGBP(totalExtraPaid)} hint="Out of pocket" />
                <StatCard
                  label="If invested instead"
                  value={fmtGBP(futureValueIfInvested)}
                  hint={`At 6%/yr over ${yearsBaseline.toFixed(0)} yrs`}
                  tone={futureValueIfInvested > interestSaved ? "warning" : "default"}
                />
              </div>

              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `Yr ${v.toFixed(0)}`} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: number) => fmtGBP(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="baseline" stroke="var(--muted-foreground)" strokeWidth={2} dot={false} name="Required payments only" />
                    <Line type="monotone" dataKey="overpay" stroke="var(--primary)" strokeWidth={2.5} dot={false} name={`+ ${fmtGBP(extraMonthly)}/mo extra`} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className={`mt-4 rounded-lg p-3 text-sm ${futureValueIfInvested > interestSaved ? "bg-warning/15 text-warning-foreground" : "bg-success/10 text-foreground border border-success/30"}`}>
                <strong>Verdict: </strong>
                {willBeWiped
                  ? "Don't overpay — the loan is on track to be wiped. Invest your extra into a pension or ISA instead."
                  : futureValueIfInvested > interestSaved
                    ? `Investing the extra ${fmtGBP(extraMonthly)}/mo would likely outperform overpaying by ${fmtGBP(futureValueIfInvested - interestSaved)} over the loan's life. Consider a Stocks & Shares ISA or pension first.`
                    : `Overpaying saves you ${fmtGBP(interestSaved)} in interest — slightly more than investing would yield. Worth considering once your pension/ISA is well-funded.`}
              </div>
            </Card>
          </Section>

          <Section title="UK student loan rules">
            <div className="grid md:grid-cols-2 gap-3">
              <Card>
                <h4 className="font-semibold mb-1">It's not a normal debt</h4>
                <p className="text-sm text-muted-foreground">You only repay 9% (or 6% postgrad) of income above your plan threshold. Stop earning, stop paying. Doesn't show on credit files.</p>
              </Card>
              <Card>
                <h4 className="font-semibold mb-1">Write-off ages</h4>
                <p className="text-sm text-muted-foreground">Plan 1 wipes at 25 years; Plan 2/4/5 & Postgrad at 30 years; Plan 5 at 40 years. Many graduates never repay in full.</p>
              </Card>
              <Card>
                <h4 className="font-semibold mb-1">Interest cap</h4>
                <p className="text-sm text-muted-foreground">RPI-linked but capped at the prevailing market rate. Plan 5 (post-Aug 2023) charges only RPI — much fairer.</p>
              </Card>
              <Card>
                <h4 className="font-semibold mb-1">Salary sacrifice helps</h4>
                <p className="text-sm text-muted-foreground">Pension salary sacrifice reduces your "salary" for the 9% calc — saving income tax, NI <em>and</em> student loan repayment in one move.</p>
              </Card>
            </div>
            <div className="mt-3">
              <a href="/strategy" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                See full strategy recommendations <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </Section>
        </>
      )}
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
