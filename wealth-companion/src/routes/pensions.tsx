import { createFileRoute } from "@tanstack/react-router";
import { useStore, uid, type PensionAccount } from "@/lib/store";
import { PageHeader, Card, Section, StatCard } from "@/components/ui-bits";
import { DetailTable, TypePill } from "@/components/DetailTable";
import { computeTakeHome, fmtGBP, fmtPct, projectGrowth, UK } from "@/lib/uk-tax";
import { Trash2, Plus, Target } from "lucide-react";
import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from "recharts";

export const Route = createFileRoute("/pensions")({
  head: () => ({
    meta: [
      { title: "Pensions — Sterling" },
      { name: "description", content: "Track UK pensions, calculate tax relief and project retirement pot." },
    ],
  }),
  component: PensionsPage,
});

function PensionsPage() {
  const [s, set] = useStore();
  const total = s.pensions.reduce((a, p) => a + p.currentValue, 0);
  const monthly = s.pensions.reduce((a, p) => a + p.monthlyOwn + p.monthlyEmployer, 0);
  const annualOwn = s.pensions.reduce((a, p) => a + p.monthlyOwn * 12, 0);
  const annualEmp = s.pensions.reduce((a, p) => a + p.monthlyEmployer * 12, 0);
  const annualTotal = annualOwn + annualEmp;

  const retireAge = s.goals.retirementAge || 67;
  const yearsToRetire = Math.max(1, retireAge - s.profile.age);
  const blended =
    s.pensions.reduce((a, p) => a + p.expectedReturn * (p.currentValue || 1), 0) /
    Math.max(1, total);
  const proj = projectGrowth(total, monthly, isFinite(blended) ? blended : 0.06, yearsToRetire);

  // Goal — pot needed to fund desired retirement income (4% rule)
  const targetPot = (s.goals.retirementIncome || 30000) / 0.04;
  const projectedAtRet = proj[proj.length - 1]?.value ?? 0;
  const goalGap = targetPot - projectedAtRet;
  const goalPct = Math.min(1, projectedAtRet / Math.max(1, targetPot));

  // Scenario sliders
  const [scReturn, setScReturn] = useState(Math.round((isFinite(blended) ? blended : 0.06) * 100));
  const [scExtra, setScExtra] = useState(0);
  const [scAge, setScAge] = useState(retireAge);
  const scYears = Math.max(1, scAge - s.profile.age);
  const scenarios = useMemo(() => {
    const r = scReturn / 100;
    const m = monthly + scExtra;
    const data: any[] = [];
    for (let y = 0; y <= scYears; y++) {
      const base = projectGrowth(total, monthly, isFinite(blended) ? blended : 0.06, y).slice(-1)[0]?.value ?? total;
      const adj = projectGrowth(total, m, r, y).slice(-1)[0]?.value ?? total;
      data.push({ year: y, current: base, scenario: adj, target: targetPot });
    }
    return data;
  }, [scReturn, scExtra, scYears, monthly, total, blended, targetPot]);
  const scFinal = scenarios[scenarios.length - 1]?.scenario ?? 0;
  const scIncome = scFinal * 0.04;

  // Tax-relief comparison: salary sacrifice vs none
  const ownPct = (annualOwn / Math.max(1, s.profile.grossSalary)) * 100;
  const noSacrifice = computeTakeHome({ grossSalary: s.profile.grossSalary, studentLoan: s.profile.studentLoanPlan });
  const withSacrifice = computeTakeHome({
    grossSalary: s.profile.grossSalary,
    studentLoan: s.profile.studentLoanPlan,
    pensionSalSacPct: ownPct,
  });
  const taxSaved =
    noSacrifice.incomeTaxAmount + noSacrifice.niAmount + noSacrifice.studentLoanAmount -
    (withSacrifice.incomeTaxAmount + withSacrifice.niAmount + withSacrifice.studentLoanAmount);

  function update(id: string, patch: Partial<PensionAccount>) {
    set((st) => ({ ...st, pensions: st.pensions.map((p) => p.id === id ? { ...p, ...patch } : p) }));
  }
  function add() {
    set((st) => ({
      ...st,
      pensions: [...st.pensions, { id: uid(), name: "New Pension", provider: "", type: "sipp", currentValue: 0, monthlyOwn: 0, monthlyEmployer: 0, expectedReturn: 0.06 }],
    }));
  }
  function remove(id: string) {
    set((st) => ({ ...st, pensions: st.pensions.filter((p) => p.id !== id) }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Retirement"
        title="Pensions"
        description="Workplace, SIPP and personal pensions. Tax relief and projections use 2025/26 UK rules."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total pot" value={fmtGBP(total)} tone="primary" />
        <StatCard label="Monthly in" value={fmtGBP(monthly)} hint={`${fmtGBP(annualTotal)}/yr · AA ${fmtGBP(UK.annualAllowance)}`} />
        <StatCard label="Tax + NI saved / yr" value={fmtGBP(taxSaved)} hint={`vs no sacrifice (own ${ownPct.toFixed(1)}%)`} tone="gold" />
        <StatCard label={`Pot at age ${retireAge}`} value={fmtGBP(projectedAtRet)} hint={`${yearsToRetire} yrs at ${fmtPct(isFinite(blended)?blended:0.06,1)}`} tone="success" />
      </div>

      <Section title="Projection to retirement">
        <Card>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={proj}>
                <defs>
                  <linearGradient id="pp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: number) => fmtGBP(v)} />
                <Area type="monotone" dataKey="contributions" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.15} name="Contributions" />
                <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="url(#pp)" name="Pot value" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Section>

      <Section
        title="Retirement goal"
        description="What you want at retirement and how close you are. Edit goals on the Strategy page."
      >
        <Card>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Target pot</div>
              <div className="font-display text-2xl font-semibold num">{fmtGBP(targetPot)}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">To fund {fmtGBP(s.goals.retirementIncome)}/yr (4% rule)</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Projected at age {retireAge}</div>
              <div className={`font-display text-2xl font-semibold num ${projectedAtRet >= targetPot ? "text-success" : ""}`}>{fmtGBP(projectedAtRet)}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Sustainable income ≈ {fmtGBP(projectedAtRet * 0.04)}/yr</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Gap</div>
              <div className={`font-display text-2xl font-semibold num ${goalGap > 0 ? "text-warning-foreground" : "text-success"}`}>
                {goalGap > 0 ? fmtGBP(goalGap) : "On track"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{(goalPct * 100).toFixed(0)}% of target</div>
            </div>
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${projectedAtRet >= targetPot ? "bg-success" : "bg-primary"}`} style={{ width: `${goalPct * 100}%` }} />
          </div>
        </Card>
      </Section>

      <Section
        title="What if…? Scenario planner"
        description="Drag the sliders to see how extra contributions, returns or retiring later change your pot."
      >
        <Card>
          <div className="grid md:grid-cols-3 gap-5">
            <SliderRow label="Annual return" value={`${scReturn}%`} sub="Pessimistic ~4% · realistic 6–7% · optimistic 9%">
              <Slider min={2} max={12} step={1} value={[scReturn]} onValueChange={(v) => setScReturn(v[0])} />
            </SliderRow>
            <SliderRow label="Extra monthly contribution" value={fmtGBP(scExtra)} sub="On top of what you already pay in">
              <Slider min={0} max={2000} step={25} value={[scExtra]} onValueChange={(v) => setScExtra(v[0])} />
            </SliderRow>
            <SliderRow label="Retire at age" value={`${scAge}`} sub={`${scYears} years from now`}>
              <Slider min={Math.max(s.profile.age + 1, 55)} max={75} step={1} value={[scAge]} onValueChange={(v) => setScAge(v[0])} />
            </SliderRow>
          </div>

          <div className="grid md:grid-cols-3 gap-3 mt-5 mb-2">
            <StatCard label="Scenario pot" value={fmtGBP(scFinal)} hint={`At age ${scAge}`} tone="primary" />
            <StatCard label="Vs. current path" value={fmtGBP(scFinal - projectedAtRet)} hint={scFinal > projectedAtRet ? "More than current plan" : "Less than current plan"} tone={scFinal >= projectedAtRet ? "success" : "warning"} />
            <StatCard label="Income (4% rule)" value={fmtGBP(scIncome)} hint={scIncome >= s.goals.retirementIncome ? "Hits goal ✓" : "Below goal"} tone={scIncome >= s.goals.retirementIncome ? "success" : "default"} />
          </div>

          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={scenarios}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `Yr ${v}`} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: number) => fmtGBP(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={targetPot} stroke="var(--gold)" strokeDasharray="4 4" label={{ value: "Goal", fill: "var(--gold)", fontSize: 10 }} />
                <Line type="monotone" dataKey="current" stroke="var(--muted-foreground)" strokeWidth={2} dot={false} name="Current plan" />
                <Line type="monotone" dataKey="scenario" stroke="var(--primary)" strokeWidth={2.5} dot={false} name="Scenario" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-xs text-muted-foreground flex items-start gap-2">
            <Target className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Try increasing extra contributions by £100/mo — small monthly changes compound dramatically over decades. Returns aren't guaranteed; figures ignore inflation, fees and tax.</span>
          </div>
        </Card>
      </Section>

      <Section title="Pension summary" description="Each pot in plain English. Hover ❓ for what each column means.">
        <DetailTable
          empty="No pensions added yet — use 'Add pension' below."
          caption="Tax relief = bonus from HMRC for paying into a pension. At 20% tax, a £100 contribution only costs you £80."
          columns={[
            { key: "name", header: "Pension", hint: "Your nickname for this pot", render: (r: any) => <div><div className="font-medium">{r.name}</div><div className="text-[11px] text-muted-foreground">{r.provider || "No provider set"}</div></div> },
            { key: "type", header: "Type", hint: "Workplace = via employer, SIPP = self-managed, Personal = private plan", render: (r: any) => <TypePill tone={r.type === "workplace" ? "primary" : r.type === "sipp" ? "gold" : "default"}>{r.type}</TypePill> },
            { key: "value", header: "Pot value", hint: "What's invested today", align: "right", render: (r: any) => <span className="font-semibold">{fmtGBP(r.currentValue)}</span> },
            { key: "you", header: "You / mo", hint: "Your own monthly contribution from gross pay", align: "right", render: (r: any) => fmtGBP(r.monthlyOwn) },
            { key: "emp", header: "Employer / mo", hint: "Free money your employer adds each month", align: "right", render: (r: any) => <span className="text-success font-semibold">{fmtGBP(r.monthlyEmployer)}</span> },
            { key: "tot", header: "Annual in", hint: "Combined yearly contributions (you + employer)", align: "right", render: (r: any) => fmtGBP((r.monthlyOwn + r.monthlyEmployer) * 12) },
            { key: "ret", header: "Return", hint: "Yearly growth assumption used for projections", align: "right", render: (r: any) => fmtPct(r.expectedReturn, 1) },
            { key: "proj", header: `At age ${retireAge}`, hint: `Projected pot at retirement (you are ${s.profile.age})`, align: "right", render: (r: any) => {
              const yrs = Math.max(1, retireAge - s.profile.age);
              const p = projectGrowth(r.currentValue, r.monthlyOwn + r.monthlyEmployer, r.expectedReturn, yrs);
              return <span className="text-primary font-semibold">{fmtGBP(p[p.length-1]?.value ?? 0)}</span>;
            } },
          ]}
          rows={s.pensions}
          footer={
            <tr>
              <td className="px-3 py-2.5" colSpan={2}>Totals</td>
              <td className="px-3 py-2.5 text-right num">{fmtGBP(total)}</td>
              <td className="px-3 py-2.5 text-right num">{fmtGBP(annualOwn / 12)}</td>
              <td className="px-3 py-2.5 text-right num">{fmtGBP(annualEmp / 12)}</td>
              <td className="px-3 py-2.5 text-right num">{fmtGBP(annualTotal)}</td>
              <td className="px-3 py-2.5 text-right num">—</td>
              <td className="px-3 py-2.5 text-right num text-primary font-semibold">{fmtGBP(proj[proj.length-1]?.value ?? 0)}</td>
            </tr>
          }
        />
      </Section>

      <Section
        title="Your pensions"
        description="Edit any field — values update everywhere instantly."
        action={
          <button onClick={add} className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Add pension
          </button>
        }
      >
        <div className="space-y-3">
          {s.pensions.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between mb-3 gap-2">
                <input
                  className="font-display font-semibold text-lg bg-transparent outline-none border-b border-transparent focus:border-primary"
                  value={p.name}
                  onChange={(e) => update(p.id, { name: e.target.value })}
                />
                <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <Field label="Provider">
                  <input className="ipt" value={p.provider} onChange={(e) => update(p.id, { provider: e.target.value })} />
                </Field>
                <Field label="Type">
                  <select className="ipt" value={p.type} onChange={(e) => update(p.id, { type: e.target.value as any })}>
                    <option value="workplace">Workplace</option>
                    <option value="sipp">SIPP</option>
                    <option value="personal">Personal</option>
                  </select>
                </Field>
                <Field label="Current value (£)">
                  <input type="number" className="ipt num" value={p.currentValue} onChange={(e) => update(p.id, { currentValue: +e.target.value })} />
                </Field>
                <Field label="Your monthly (£)">
                  <input type="number" className="ipt num" value={p.monthlyOwn} onChange={(e) => update(p.id, { monthlyOwn: +e.target.value })} />
                </Field>
                <Field label="Employer monthly (£)">
                  <input type="number" className="ipt num" value={p.monthlyEmployer} onChange={(e) => update(p.id, { monthlyEmployer: +e.target.value })} />
                </Field>
                <Field label="Expected return %">
                  <input type="number" step="0.5" className="ipt num" value={(p.expectedReturn * 100).toFixed(1)} onChange={(e) => update(p.id, { expectedReturn: +e.target.value / 100 })} />
                </Field>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="UK pension rules in plain English">
        <div className="grid md:grid-cols-2 gap-3">
          <Card>
            <h4 className="font-semibold mb-1">Annual Allowance</h4>
            <p className="text-sm text-muted-foreground">£60,000/year of pension contributions get tax relief. Tapers down to £10,000 if your adjusted income exceeds £260,000. Carry-forward unused allowance from the last 3 tax years.</p>
          </Card>
          <Card>
            <h4 className="font-semibold mb-1">Tax relief</h4>
            <p className="text-sm text-muted-foreground">You get tax relief at your marginal rate. Salary sacrifice also saves NI. £1 sacrificed costs higher-rate taxpayers ~58p of take-home but adds £1+ to your pot.</p>
          </Card>
          <Card>
            <h4 className="font-semibold mb-1">Access age</h4>
            <p className="text-sm text-muted-foreground">Normal Minimum Pension Age is 55, rising to 57 from April 2028. 25% can be taken tax-free (up to £268,275 lump sum allowance).</p>
          </Card>
          <Card>
            <h4 className="font-semibold mb-1">State Pension</h4>
            <p className="text-sm text-muted-foreground">Need 35 qualifying NI years for the full new State Pension (£11,973/year in 2025/26). Check your forecast at gov.uk and consider topping up gaps.</p>
          </Card>
        </div>
      </Section>

      <style>{`.ipt{width:100%;font-size:13px;padding:6px 8px;border:1px solid var(--border);border-radius:6px;background:var(--background);color:var(--foreground);}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
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
