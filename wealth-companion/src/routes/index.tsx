import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { useStore } from "@/lib/store";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { computeTakeHome, fmtGBP, fmtPct, projectGrowth, UK } from "@/lib/uk-tax";
import { computeOpportunities } from "@/lib/eligibility";
import { PageHeader, StatCard, Section, Card } from "@/components/ui-bits";
import { DetailTable, TypePill, type Column } from "@/components/DetailTable";
import { ArrowRight, TrendingUp, AlertCircle, CheckCircle2, Compass } from "lucide-react";
import { buildRecommendations, scoreFinancialHealth } from "@/lib/strategy";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Sterling UK Wealth Tracker" },
      { name: "description", content: "Your total UK wealth, pension, ISA, mortgage and eligibility at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [s] = useStore();
  const reportRef = useRef<HTMLDivElement>(null);

  const pensionTotal = s.pensions.reduce((a, p) => a + p.currentValue, 0);
  const isaTotal = s.isas.reduce((a, i) => a + i.currentValue, 0);
  const cashTotal = s.savings.reduce((a, x) => a + x.balance, 0);
  const customTotal = s.customAssets.reduce((a, c) => a + c.currentValue, 0);
  const propertyEquity = s.mortgage.enabled
    ? Math.max(0, s.mortgage.propertyValue - s.mortgage.outstandingBalance)
    : 0;
  const liabilities = (s.mortgage.enabled ? s.mortgage.outstandingBalance : 0) + s.profile.studentLoanBalance;
  const grossAssets = pensionTotal + isaTotal + cashTotal + customTotal + (s.mortgage.enabled ? s.mortgage.propertyValue : 0);
  const netWorth = grossAssets - liabilities;

  const th = computeTakeHome({
    grossSalary: s.profile.grossSalary,
    studentLoan: s.profile.studentLoanPlan,
  });

  const opps = computeOpportunities(s);
  const eligible = opps.filter((o) => o.status === "eligible");
  const recs = buildRecommendations(s);
  const health = scoreFinancialHealth(s);
  const topRecs = recs.slice(0, 3);

  // Combined growth projection across pensions + ISAs + custom (15 yrs)
  const monthly = [...s.pensions, ...s.isas, ...s.customAssets].reduce((a, x: any) => {
    const m = (x.monthlyOwn ?? 0) + (x.monthlyEmployer ?? 0) + (x.monthlyContribution ?? 0);
    return a + m;
  }, 0);
  const blendedReturn =
    [...s.pensions, ...s.isas, ...s.customAssets].reduce(
      (a, x: any) => a + (x.expectedReturn ?? 0.05) * (x.currentValue || 1),
      0,
    ) / Math.max(1, pensionTotal + isaTotal + customTotal);
  const projection = projectGrowth(
    pensionTotal + isaTotal + customTotal,
    monthly,
    isFinite(blendedReturn) ? blendedReturn : 0.06,
    20,
  );

  const allocation = [
    { name: "Pensions", value: pensionTotal, color: "var(--chart-1)" },
    { name: "ISAs", value: isaTotal, color: "var(--chart-2)" },
    { name: "Property equity", value: propertyEquity, color: "var(--chart-3)" },
    { name: "Cash", value: cashTotal, color: "var(--chart-4)" },
    { name: "Custom", value: customTotal, color: "var(--chart-5)" },
  ].filter((a) => a.value > 0);

  return (
    <div ref={reportRef}>
      <PageHeader
        eyebrow={`Tax year ${UK.taxYear}`}
        title={s.profile.name ? `Hello, ${s.profile.name}` : "Your wealth at a glance"}
        description="Personalised UK money management — pensions, ISAs, mortgage, savings and bespoke assets in one place."
      >
        <DownloadPdfButton
          targetRef={reportRef}
          filename={`sterling-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`}
        />
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Edit profile <ArrowRight className="h-3 w-3" />
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Net worth" value={fmtGBP(netWorth)} hint={`Gross ${fmtGBP(grossAssets)} − ${fmtGBP(liabilities)} debt`} tone="primary" />
        <StatCard label="Pensions" value={fmtGBP(pensionTotal)} hint={`${s.pensions.length} account${s.pensions.length===1?"":"s"}`} />
        <StatCard label="ISAs" value={fmtGBP(isaTotal)} hint={`${fmtGBP(UK.isaAllowance - s.isas.reduce((a,i)=>a+i.thisYearContribution,0))} allowance left`} />
        <StatCard label="Cash & savings" value={fmtGBP(cashTotal)} hint="Across all accounts" />
      </div>

      <Section
        title="Top moves to make next"
        description={`Health score ${health.score}/100 · ${recs.length} optimisations identified for your situation.`}
        action={<Link to="/strategy" className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"><Compass className="h-3 w-3" /> Open strategy →</Link>}
      >
        {topRecs.length === 0 ? (
          <Card><p className="text-sm text-muted-foreground">No urgent moves right now — everything looks well-tuned.</p></Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            {topRecs.map((r, i) => (
              <Card key={r.id}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="h-6 w-6 rounded-md bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                  <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold ${r.priority === "critical" ? "bg-warning/20 text-warning-foreground" : r.priority === "high" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{r.priority}</span>
                </div>
                <h4 className="font-semibold text-sm">{r.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{r.why}</p>
                {r.estimatedBenefit && <div className="mt-2 text-xs font-semibold text-primary">{r.estimatedBenefit}</div>}
              </Card>
            ))}
          </div>
        )}
      </Section>

      <div className="grid lg:grid-cols-3 gap-4 mb-10">
        <Card className="lg:col-span-2">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h3 className="font-display font-semibold">20-year projection</h3>
              <p className="text-xs text-muted-foreground">
                Investing {fmtGBP(monthly)}/mo at {fmtPct(isFinite(blendedReturn) ? blendedReturn : 0.06, 1)} blended return
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Year 20</div>
              <div className="font-display text-2xl font-semibold text-primary num">
                {fmtGBP(projection[projection.length - 1]?.value ?? 0)}
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={projection}>
                <defs>
                  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  formatter={(v: number) => fmtGBP(v)}
                />
                <Area type="monotone" dataKey="contributions" stroke="var(--gold)" fill="url(#gC)" name="Contributions" />
                <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="url(#gV)" name="Total value" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 rounded-lg bg-muted/40 border border-dashed p-3 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground mb-1">How is this calculated?</div>
            <ul className="space-y-0.5">
              <li>• <strong>Start point:</strong> {fmtGBP(pensionTotal + isaTotal + customTotal)} = today's pension pots ({fmtGBP(pensionTotal)}) + ISAs ({fmtGBP(isaTotal)}) + custom assets ({fmtGBP(customTotal)}). Cash savings & property are excluded as they don't compound the same way.</li>
              <li>• <strong>Monthly investing:</strong> {fmtGBP(monthly)} = sum of every "monthly contribution" (you + employer) across pensions, ISAs and custom assets you've entered.</li>
              <li>• <strong>Blended return:</strong> {fmtPct(isFinite(blendedReturn) ? blendedReturn : 0.06, 1)} = each pot's expected return weighted by how much money sits in it. So a £100k SIPP at 7% counts more than a £5k crypto pot at 12%.</li>
              <li>• <strong>Maths:</strong> standard compound growth — each month earns 1/12 of the annual return, then your contribution is added, repeat for 240 months.</li>
              <li>• <strong>Caveats:</strong> assumes nothing is withdrawn, returns are smooth, and ignores inflation, fees and tax. Real-world results vary considerably.</li>
            </ul>
          </div>
        </Card>

        <Card>
          <h3 className="font-display font-semibold mb-2">Allocation</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={allocation} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {allocation.map((a, i) => <Cell key={i} fill={a.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtGBP(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Section
        title="Where your wealth lives"
        description="Every pot you've added, valued today. Hover the ❓ icons for plain-English explanations."
      >
        <DetailTable
          caption="Net worth = everything you own (assets) minus everything you owe (liabilities)."
          columns={[
            { key: "bucket", header: "Bucket", hint: "The category your money sits in", render: (r: any) => <span className="font-medium">{r.bucket}</span> },
            { key: "type", header: "Type", hint: "Asset adds to wealth, liability is debt you owe", render: (r: any) => <TypePill tone={r.kind === "asset" ? "success" : "warning"}>{r.kind}</TypePill> },
            { key: "items", header: "Items", hint: "How many separate accounts or things in this bucket", align: "right", render: (r: any) => <span>{r.items}</span> },
            { key: "value", header: "Value (£)", hint: "What it is worth right now in pounds", align: "right", render: (r: any) => <span className="font-semibold">{fmtGBP(r.value)}</span> },
            { key: "pct", header: "% of net worth", hint: "Share of your total net worth this bucket represents", align: "right", render: (r: any) => <span className="text-muted-foreground">{netWorth > 0 ? fmtPct(r.value / netWorth, 1) : "—"}</span> },
          ]}
          rows={[
            { id: "p", bucket: "Pensions", kind: "asset", items: s.pensions.length, value: pensionTotal },
            { id: "i", bucket: "ISAs (tax-free wrapper)", kind: "asset", items: s.isas.length, value: isaTotal },
            { id: "h", bucket: "Property (home value)", kind: "asset", items: s.mortgage.enabled ? 1 : 0, value: s.mortgage.enabled ? s.mortgage.propertyValue : 0 },
            { id: "c", bucket: "Cash & savings", kind: "asset", items: s.savings.length, value: cashTotal },
            { id: "x", bucket: "Custom assets (crypto, art…)", kind: "asset", items: s.customAssets.length, value: customTotal },
            { id: "m", bucket: "Mortgage owed", kind: "liability", items: s.mortgage.enabled ? 1 : 0, value: s.mortgage.enabled ? -s.mortgage.outstandingBalance : 0 },
            { id: "sl", bucket: "Student loan owed", kind: "liability", items: s.profile.studentLoanBalance > 0 ? 1 : 0, value: -s.profile.studentLoanBalance },
          ].filter((r) => r.value !== 0 || r.items > 0)}
          footer={
            <tr>
              <td className="px-3 py-2.5" colSpan={3}>Net worth (assets − debts)</td>
              <td className="px-3 py-2.5 text-right num font-semibold text-primary">{fmtGBP(netWorth)}</td>
              <td className="px-3 py-2.5 text-right text-muted-foreground">100%</td>
            </tr>
          }
        />
      </Section>

      <Section
        title="Income & tax snapshot"
        description={`Based on £${s.profile.grossSalary.toLocaleString()} gross — ${s.profile.studentLoanPlan === "none" ? "no student loan" : `student loan ${s.profile.studentLoanPlan}`}`}
        action={
          <Link to="/profile" className="text-xs text-primary font-semibold hover:underline">Adjust →</Link>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard label="Take-home / mo" value={fmtGBP(th.takeHome)} tone="success" />
          <StatCard label="Income tax / yr" value={fmtGBP(th.incomeTaxAmount)} hint={`Effective ${fmtPct(th.incomeTaxAmount/Math.max(1,s.profile.grossSalary),1)}`} />
          <StatCard label="National Insurance" value={fmtGBP(th.niAmount)} />
          <StatCard
            label="Marginal rate"
            value={fmtPct(th.marginalRate, 0)}
            hint="On the next £1 earned"
            tone={th.marginalRate >= 0.4 ? "warning" : "default"}
          />
        </div>
        <DetailTable
          caption="How HMRC slices your salary. Each band is taxed at a different percentage."
          columns={[
            { key: "label", header: "Band", hint: "The slice of your income HMRC is looking at", render: (r: any) => <span className="font-medium">{r.label}</span> },
            { key: "range", header: "Income range", hint: "Which pounds of your salary fall into this band", render: (r: any) => <span className="text-muted-foreground text-xs">{r.range}</span> },
            { key: "rate", header: "Rate", hint: "Percentage HMRC takes from each £1 in this band", align: "right", render: (r: any) => <span>{r.rate}</span> },
            { key: "amount", header: "Falls in band (£)", hint: "How much of YOUR salary lands here", align: "right", render: (r: any) => <span>{fmtGBP(r.amount)}</span> },
            { key: "tax", header: "Tax on this band (£)", hint: "Pounds of tax due from this band only", align: "right", render: (r: any) => <span className="font-semibold">{fmtGBP(r.tax)}</span> },
          ]}
          rows={[
            { id: "pa", label: "Personal allowance", range: `£0 – £${th.bands.pa.toLocaleString()}`, rate: "0%", amount: Math.min(s.profile.grossSalary, th.bands.pa), tax: 0 },
            { id: "b", label: "Basic rate", range: `£${th.bands.pa.toLocaleString()} – £50,270`, rate: "20%", amount: th.bands.basic, tax: th.bands.basic * 0.20 },
            { id: "h", label: "Higher rate", range: "£50,270 – £125,140", rate: "40%", amount: th.bands.higher, tax: th.bands.higher * 0.40 },
            { id: "a", label: "Additional rate", range: "Over £125,140", rate: "45%", amount: th.bands.additional, tax: th.bands.additional * 0.45 },
          ]}
          footer={
            <tr>
              <td className="px-3 py-2.5" colSpan={4}>Total income tax</td>
              <td className="px-3 py-2.5 text-right num font-semibold">{fmtGBP(th.incomeTaxAmount)}</td>
            </tr>
          }
        />
      </Section>

      <Section
        title="Schemes you're eligible for"
        description={`${eligible.length} of ${opps.length} opportunities apply to your situation right now.`}
        action={
          <Link to="/eligibility" className="text-xs text-primary font-semibold hover:underline">See all →</Link>
        }
      >
        <div className="grid md:grid-cols-2 gap-3">
          {opps.slice(0, 4).map((o) => (
            <Card key={o.id}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  o.status === "eligible" ? "bg-success/15 text-success" :
                  o.status === "review" ? "bg-warning/20 text-warning-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {o.status === "eligible" ? <CheckCircle2 className="h-4 w-4" /> :
                   o.status === "review" ? <AlertCircle className="h-4 w-4" /> :
                   <TrendingUp className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{o.title}</h4>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">{o.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{o.summary}</p>
                  {o.potentialBenefit && (
                    <div className="mt-2 text-xs font-semibold text-primary">{o.potentialBenefit}</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
