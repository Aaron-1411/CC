import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Section, StatCard } from "@/components/ui-bits";
import { DetailTable } from "@/components/DetailTable";
import { fmtGBP, fmtPct, mortgagePayment, mortgageSchedule } from "@/lib/uk-tax";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/mortgage")({
  head: () => ({
    meta: [
      { title: "Mortgage — Sterling" },
      { name: "description", content: "Track UK mortgage balance, equity, LTV and overpayment savings." },
    ],
  }),
  component: MortgagePage,
});

function MortgagePage() {
  const [s, set] = useStore();
  const m = s.mortgage;

  const equity = Math.max(0, m.propertyValue - m.outstandingBalance);
  const ltv = m.propertyValue > 0 ? m.outstandingBalance / m.propertyValue : 0;
  const monthlyPayment = mortgagePayment(m.outstandingBalance, m.rate, m.termYearsRemaining);
  const baseRun = mortgageSchedule(m.outstandingBalance, m.rate, m.termYearsRemaining, 0);
  const overRun = mortgageSchedule(m.outstandingBalance, m.rate, m.termYearsRemaining, m.monthlyOverpayment);
  const interestSaved = baseRun.schedule[baseRun.schedule.length - 1]?.interestPaid - overRun.schedule[overRun.schedule.length - 1]?.interestPaid;
  const monthsSaved = baseRun.monthsToPayoff - overRun.monthsToPayoff;

  function patch(p: Partial<typeof m>) {
    set((st) => ({ ...st, mortgage: { ...st.mortgage, ...p } }));
  }

  if (!m.enabled) {
    return (
      <div>
        <PageHeader eyebrow="Property" title="Mortgage" description="Track your UK mortgage and project equity growth." />
        <Card className="text-center py-10">
          <p className="text-muted-foreground mb-4">No mortgage tracked yet.</p>
          <button onClick={() => patch({ enabled: true })} className="inline-flex items-center gap-1 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90">
            Add your mortgage
          </button>
        </Card>
      </div>
    );
  }

  // chart data: balance over time, with and without overpayment
  const chartData = baseRun.schedule.map((row, idx) => ({
    year: row.year,
    standard: row.balance,
    overpayment: overRun.schedule[idx]?.balance ?? 0,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Property"
        title="Mortgage"
        description="Live UK calculation with overpayment scenarios."
      >
        <button onClick={() => patch({ enabled: false })} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Property value" value={fmtGBP(m.propertyValue)} />
        <StatCard label="Outstanding" value={fmtGBP(m.outstandingBalance)} tone="warning" />
        <StatCard label="Equity" value={fmtGBP(equity)} hint={`LTV ${fmtPct(ltv,1)}`} tone="success" />
        <StatCard label="Monthly payment" value={fmtGBP(monthlyPayment)} hint={`${m.termYearsRemaining} yr · ${fmtPct(m.rate,2)}`} tone="primary" />
      </div>

      <Section title="Mortgage details">
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Field label="Property value (£)">
              <input type="number" className="ipt num" value={m.propertyValue} onChange={(e) => patch({ propertyValue: +e.target.value })} />
            </Field>
            <Field label="Outstanding balance (£)">
              <input type="number" className="ipt num" value={m.outstandingBalance} onChange={(e) => patch({ outstandingBalance: +e.target.value })} />
            </Field>
            <Field label="Interest rate %">
              <input type="number" step="0.05" className="ipt num" value={(m.rate * 100).toFixed(2)} onChange={(e) => patch({ rate: +e.target.value / 100 })} />
            </Field>
            <Field label="Years remaining">
              <input type="number" className="ipt num" value={m.termYearsRemaining} onChange={(e) => patch({ termYearsRemaining: +e.target.value })} />
            </Field>
            <Field label="Monthly overpayment (£)">
              <input type="number" className="ipt num" value={m.monthlyOverpayment} onChange={(e) => patch({ monthlyOverpayment: +e.target.value })} />
            </Field>
          </div>
        </Card>
      </Section>

      <Section
        title="Overpayment impact"
        description={
          m.monthlyOverpayment > 0
            ? `Adding ${fmtGBP(m.monthlyOverpayment)}/mo saves ${fmtGBP(interestSaved)} in interest and clears the loan ${(monthsSaved/12).toFixed(1)} years sooner.`
            : "Add a monthly overpayment above to see the impact."
        }
      >
        <Card>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="ms" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--warning)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: number) => fmtGBP(v)} />
                <Area type="monotone" dataKey="standard" stroke="var(--warning)" fill="url(#ms)" name="Standard" />
                <Area type="monotone" dataKey="overpayment" stroke="var(--primary)" fill="url(#mo)" name="With overpayment" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Section>

      <Section title="Year-by-year breakdown" description="Each row shows where you'll be at the end of that year, with your current overpayment applied.">
        <DetailTable
          caption="Interest = the bank's fee for lending you money. Equity = the share of the home you actually own."
          columns={[
            { key: "year", header: "Year", hint: "End of this many years from today", align: "right", render: (r: any) => r.year },
            { key: "bal", header: "Balance owed", hint: "What's left on the mortgage at year end", align: "right", render: (r: any) => <span className="font-semibold">{fmtGBP(r.balance)}</span> },
            { key: "eq", header: "Your equity", hint: "Property value minus what you still owe (assumes property value is unchanged)", align: "right", render: (r: any) => <span className="text-success font-semibold">{fmtGBP(Math.max(0, m.propertyValue - r.balance))}</span> },
            { key: "ltv", header: "LTV", hint: "Loan-to-value: lower is better; sub-60% unlocks the best rates", align: "right", render: (r: any) => m.propertyValue > 0 ? fmtPct(r.balance / m.propertyValue, 1) : "—" },
            { key: "ip", header: "Interest paid (cumulative)", hint: "Total interest you've handed the bank since today", align: "right", render: (r: any) => <span className="text-warning-foreground">{fmtGBP(r.interestPaid)}</span> },
            { key: "pp", header: "Capital paid (cumulative)", hint: "Total balance you've actually paid down", align: "right", render: (r: any) => fmtGBP(r.principalPaid) },
          ]}
          rows={overRun.schedule.map((r, i) => ({ id: i, ...r }))}
        />
      </Section>

      <Section title="UK mortgage essentials">
        <div className="grid md:grid-cols-2 gap-3">
          <Card>
            <h4 className="font-semibold mb-1">LTV bands</h4>
            <p className="text-sm text-muted-foreground">Lower LTV unlocks better rates: 60%, 75%, 80%, 85%, 90%. Crossing a band at remortgage can cut your rate noticeably.</p>
          </Card>
          <Card>
            <h4 className="font-semibold mb-1">Overpayment limits</h4>
            <p className="text-sm text-muted-foreground">Most fixed-rate UK mortgages allow up to 10% of the balance per year as penalty-free overpayment. Check ERCs before exceeding.</p>
          </Card>
          <Card>
            <h4 className="font-semibold mb-1">Stamp Duty (England/NI)</h4>
            <p className="text-sm text-muted-foreground">From April 2025: 0% to £125k, 2% £125k–£250k, 5% £250k–£925k, 10% £925k–£1.5m, 12% above. First-time buyers: 0% to £300k.</p>
          </Card>
          <Card>
            <h4 className="font-semibold mb-1">Remortgage timing</h4>
            <p className="text-sm text-muted-foreground">Most lenders let you lock in a new deal up to 6 months before your fixed rate ends — a useful hedge against rate moves.</p>
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
