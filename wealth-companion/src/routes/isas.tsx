import { createFileRoute } from "@tanstack/react-router";
import { useStore, uid, type ISAAccount } from "@/lib/store";
import { PageHeader, Card, Section, StatCard } from "@/components/ui-bits";
import { DetailTable, TypePill } from "@/components/DetailTable";
import { fmtGBP, fmtPct, projectGrowth, UK } from "@/lib/uk-tax";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from "recharts";

export const Route = createFileRoute("/isas")({
  head: () => ({
    meta: [
      { title: "ISAs — Sterling" },
      { name: "description", content: "Track Stocks & Shares, Cash, Lifetime ISAs and Help to Buy. Allowance tracking included." },
    ],
  }),
  component: ISAPage,
});

function ISAPage() {
  const [s, set] = useStore();
  const total = s.isas.reduce((a, i) => a + i.currentValue, 0);
  const used = s.isas.reduce((a, i) => a + i.thisYearContribution, 0);
  const remaining = Math.max(0, UK.isaAllowance - used);
  const lisa = s.isas.find((i) => i.type === "lisa");
  const lisaUsed = lisa?.thisYearContribution ?? 0;
  const lisaRemaining = Math.max(0, UK.lisaAllowance - lisaUsed);
  const lisaBonusYTD = lisaUsed * UK.lisaBonus;

  const monthly = s.isas.reduce((a, i) => a + i.monthlyContribution, 0);
  const blended = s.isas.reduce((a, i) => a + i.expectedReturn * (i.currentValue || 1), 0) / Math.max(1, total);

  function update(id: string, patch: Partial<ISAAccount>) {
    set((st) => ({ ...st, isas: st.isas.map((i) => i.id === id ? { ...i, ...patch } : i) }));
  }
  function add() {
    set((st) => ({
      ...st,
      isas: [...st.isas, { id: uid(), name: "New ISA", type: "stocks", currentValue: 0, monthlyContribution: 0, thisYearContribution: 0, expectedReturn: 0.06 }],
    }));
  }
  function remove(id: string) {
    set((st) => ({ ...st, isas: st.isas.filter((i) => i.id !== id) }));
  }

  const allowanceData = [
    { name: "ISA total", used, remaining },
    { name: "LISA", used: lisaUsed, remaining: lisaRemaining },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Tax-free wrapper"
        title="ISAs"
        description="Stocks & Shares, Cash, Lifetime and Help to Buy. £20,000 total allowance per UK adult per year — resets every 6 April."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total ISA value" value={fmtGBP(total)} tone="primary" />
        <StatCard label="Allowance used" value={fmtGBP(used)} hint={`of ${fmtGBP(UK.isaAllowance)}`} />
        <StatCard label="Allowance remaining" value={fmtGBP(remaining)} hint="Use it before 6 April" tone={remaining > 0 ? "success" : "default"} />
        <StatCard label="LISA bonus YTD" value={fmtGBP(lisaBonusYTD)} hint={lisa ? `${fmtGBP(lisaRemaining)} more for full bonus` : "No LISA yet"} tone="gold" />
      </div>

      <Section title="Allowance tracker">
        <Card>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={allowanceData} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: number) => fmtGBP(v)} />
                <Bar dataKey="used" stackId="a" fill="var(--primary)" name="Used" />
                <Bar dataKey="remaining" stackId="a" fill="var(--gold)" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Section>

      <ScenarioSection startValue={total} monthly={monthly} blended={isFinite(blended) ? blended : 0.06} />


      <Section title="ISA summary" description="Each ISA in plain English. Hover ❓ for what each column means.">
        <DetailTable
          empty="No ISAs yet — use 'Add ISA' below to start."
          caption="An ISA shelters money from UK tax on growth and interest. £20,000 limit per person each tax year (resets 6 April)."
          columns={[
            { key: "name", header: "ISA", hint: "Your nickname for this ISA", render: (r: any) => <span className="font-medium">{r.name}</span> },
            { key: "type", header: "Type", hint: "Stocks invests in funds; Cash earns interest; LISA gets a 25% bonus; H2B is closed to new accounts", render: (r: any) => {
              const labels: any = { stocks: "Stocks & Shares", cash: "Cash", lisa: "Lifetime", h2b: "Help to Buy" };
              return <TypePill tone={r.type === "lisa" ? "gold" : r.type === "stocks" ? "primary" : "default"}>{labels[r.type]}</TypePill>;
            } },
            { key: "value", header: "Value", hint: "What's in this ISA today", align: "right", render: (r: any) => <span className="font-semibold">{fmtGBP(r.currentValue)}</span> },
            { key: "thisyr", header: "This tax year in", hint: "Money paid in since 6 April — counts towards your £20k limit", align: "right", render: (r: any) => fmtGBP(r.thisYearContribution) },
            { key: "monthly", header: "Monthly", hint: "Auto-contribution you've set up", align: "right", render: (r: any) => fmtGBP(r.monthlyContribution) },
            { key: "ret", header: "Return", hint: "Yearly growth assumption", align: "right", render: (r: any) => fmtPct(r.expectedReturn, 1) },
            { key: "bonus", header: "Bonus / yr", hint: "Government top-up (LISA only): 25% of what you put in, up to £1,000/yr", align: "right", render: (r: any) => r.type === "lisa" ? <span className="text-gold-foreground font-semibold">{fmtGBP(Math.min(r.thisYearContribution, UK.lisaAllowance) * UK.lisaBonus)}</span> : <span className="text-muted-foreground">—</span> },
          ]}
          rows={s.isas}
          footer={
            <tr>
              <td className="px-3 py-2.5" colSpan={2}>Totals</td>
              <td className="px-3 py-2.5 text-right num">{fmtGBP(total)}</td>
              <td className="px-3 py-2.5 text-right num">{fmtGBP(used)} <span className="text-[10px] text-muted-foreground">/ £20k</span></td>
              <td className="px-3 py-2.5 text-right num">{fmtGBP(monthly)}</td>
              <td className="px-3 py-2.5 text-right num">—</td>
              <td className="px-3 py-2.5 text-right num text-gold-foreground font-semibold">{fmtGBP(lisaBonusYTD)}</td>
            </tr>
          }
        />
      </Section>

      <Section
        title="Your ISAs"
        action={
          <button onClick={add} className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Add ISA
          </button>
        }
      >
        <div className="space-y-3">
          {s.isas.map((i) => {
            const isLisaOver = i.type === "lisa" && i.thisYearContribution > UK.lisaAllowance;
            return (
              <Card key={i.id}>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <input className="font-display font-semibold text-lg bg-transparent outline-none border-b border-transparent focus:border-primary" value={i.name} onChange={(e) => update(i.id, { name: e.target.value })} />
                  <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Field label="Type">
                    <select className="ipt" value={i.type} onChange={(e) => update(i.id, { type: e.target.value as any })}>
                      <option value="stocks">Stocks & Shares</option>
                      <option value="cash">Cash</option>
                      <option value="lisa">Lifetime ISA</option>
                      <option value="h2b">Help to Buy ISA</option>
                    </select>
                  </Field>
                  <Field label="Current value (£)">
                    <input type="number" className="ipt num" value={i.currentValue} onChange={(e) => update(i.id, { currentValue: +e.target.value })} />
                  </Field>
                  <Field label="Monthly (£)">
                    <input type="number" className="ipt num" value={i.monthlyContribution} onChange={(e) => update(i.id, { monthlyContribution: +e.target.value })} />
                  </Field>
                  <Field label="This tax year in (£)">
                    <input type="number" className="ipt num" value={i.thisYearContribution} onChange={(e) => update(i.id, { thisYearContribution: +e.target.value })} />
                  </Field>
                  <Field label="Expected return %">
                    <input type="number" step="0.5" className="ipt num" value={(i.expectedReturn * 100).toFixed(1)} onChange={(e) => update(i.id, { expectedReturn: +e.target.value / 100 })} />
                  </Field>
                </div>
                {isLisaOver && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-warning-foreground bg-warning/15 px-3 py-2 rounded-md">
                    <AlertTriangle className="h-3.5 w-3.5" /> LISA contributions exceed the £4,000 yearly cap.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Section>

      <Section title="ISA rules at a glance">
        <div className="grid md:grid-cols-2 gap-3">
          <Card>
            <h4 className="font-semibold mb-1">£20,000 annual allowance</h4>
            <p className="text-sm text-muted-foreground">Split however you want across S&S, Cash, LISA (£4k cap) and Innovative Finance ISAs. From April 2024 you can pay into multiple ISAs of the same type in one tax year.</p>
          </Card>
          <Card>
            <h4 className="font-semibold mb-1">Lifetime ISA</h4>
            <p className="text-sm text-muted-foreground">Open age 18–39, contribute to 50. £4,000/yr cap — HMRC adds 25% bonus. Use for first home (≤£450k) or after age 60. Otherwise 25% withdrawal charge.</p>
          </Card>
          <Card>
            <h4 className="font-semibold mb-1">Help to Buy ISA</h4>
            <p className="text-sm text-muted-foreground">Closed to new accounts. Existing holders can contribute until 30 Nov 2029 and claim bonus by 1 Dec 2030. Can transfer balance into a LISA.</p>
          </Card>
          <Card>
            <h4 className="font-semibold mb-1">Junior ISA</h4>
            <p className="text-sm text-muted-foreground">£9,000/year for under-18s. Locked until 18, then becomes the child's adult ISA. Doesn't affect parent's £20k allowance.</p>
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

function ScenarioSection({ startValue, monthly: defaultMonthly, blended }: { startValue: number; monthly: number; blended: number }) {
  const [returnPct, setReturnPct] = useState(Math.round(blended * 1000) / 10);
  const [monthly, setMonthly] = useState(Math.round(defaultMonthly));
  const [years, setYears] = useState(20);

  // Three scenarios: pessimistic / chosen / optimistic
  const scenarios = useMemo(() => {
    const lo = Math.max(0, returnPct - 3) / 100;
    const mid = returnPct / 100;
    const hi = (returnPct + 3) / 100;
    const lows = projectGrowth(startValue, monthly, lo, years);
    const mids = projectGrowth(startValue, monthly, mid, years);
    const his = projectGrowth(startValue, monthly, hi, years);
    return lows.map((row, i) => ({
      year: row.year,
      pessimistic: row.value,
      chosen: mids[i]?.value,
      optimistic: his[i]?.value,
    }));
  }, [startValue, monthly, returnPct, years]);

  const final = scenarios[scenarios.length - 1] ?? { pessimistic: 0, chosen: 0, optimistic: 0 };

  return (
    <Section
      title="Scenario planner"
      description="Markets are unpredictable — try different return assumptions to see the range of outcomes. The lines show 3 scenarios: 3% below, your chosen rate, and 3% above."
    >
      <Card>
        <div className="grid md:grid-cols-3 gap-5 mb-4">
          <SliderField label="Stocks & Shares return (per year)" value={returnPct} min={0} max={12} step={0.5} suffix="%" onChange={setReturnPct} note={
            returnPct < 4 ? "Conservative — close to long-run cash/bonds." :
            returnPct < 7 ? "Realistic — long-run UK/global stock market average ~5–7% real." :
            returnPct < 9 ? "Optimistic — top end of historical equity returns." : "Very optimistic — sustained 9%+ is rare."
          } />
          <SliderField label="Monthly contribution" value={monthly} min={0} max={1700} step={25} suffix=" £/mo" onChange={setMonthly} note={`${fmtGBP(monthly * 12)}/yr — ISA cap is £20,000/yr.`} />
          <SliderField label="Years invested" value={years} min={1} max={40} step={1} suffix=" yrs" onChange={setYears} note={years >= 20 ? "Long-term — compounding does most of the work." : "Short horizons mean returns dominate less."} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3 text-center">
          <Outcome label={`Pessimistic (${(returnPct-3).toFixed(1)}%)`} value={final.pessimistic} tone="text-warning-foreground" />
          <Outcome label={`Your scenario (${returnPct.toFixed(1)}%)`} value={final.chosen ?? 0} tone="text-primary" big />
          <Outcome label={`Optimistic (${(returnPct+3).toFixed(1)}%)`} value={final.optimistic ?? 0} tone="text-success" />
        </div>

        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={scenarios}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} label={{ value: "Years", position: "insideBottom", offset: -2, fontSize: 10 }} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: number) => fmtGBP(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="pessimistic" stroke="var(--warning)" strokeDasharray="4 4" dot={false} name="Pessimistic" />
              <Line type="monotone" dataKey="chosen" stroke="var(--primary)" strokeWidth={2.5} dot={false} name="Your scenario" />
              <Line type="monotone" dataKey="optimistic" stroke="var(--success)" strokeDasharray="4 4" dot={false} name="Optimistic" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Tip: ISA growth is fully <strong className="text-foreground">tax-free</strong> — no income tax on dividends/interest, no Capital Gains Tax on sales. The same money in a regular brokerage would lose ~10–25% to tax over time.
        </p>
      </Card>
    </Section>
  );
}

function SliderField({ label, value, min, max, step, suffix, onChange, note }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void; note?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-display text-base font-semibold num text-primary">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--primary)]" />
      {note && <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{note}</p>}
    </div>
  );
}

function Outcome({ label, value, tone, big }: { label: string; value: number; tone: string; big?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display ${big ? "text-2xl" : "text-lg"} font-semibold num ${tone}`}>{fmtGBP(value)}</div>
    </div>
  );
}
