import { createFileRoute } from "@tanstack/react-router";
import { useStore, uid, type CustomAsset } from "@/lib/store";
import { PageHeader, Card, Section, StatCard } from "@/components/ui-bits";
import { DetailTable, TypePill } from "@/components/DetailTable";
import { fmtGBP, fmtPct, projectGrowth } from "@/lib/uk-tax";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const PRESETS = ["Crypto", "Watches", "Art", "Wine", "Classic Car", "Whisky", "Trading cards", "Property", "Business equity", "Other"];

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Custom Portfolio — Sterling" },
      { name: "description", content: "Document and project growth for your unusual assets — name and build a portfolio." },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const [s, set] = useStore();
  const total = s.customAssets.reduce((a, c) => a + c.currentValue, 0);
  const acquired = s.customAssets.reduce((a, c) => a + c.acquiredValue, 0);
  const gain = total - acquired;
  const gainPct = acquired > 0 ? gain / acquired : 0;
  const monthly = s.customAssets.reduce((a, c) => a + c.monthlyContribution, 0);

  // Combined projection per asset over 10 years
  const horizons = [0, 1, 3, 5, 10, 15, 20];
  const chart = horizons.map((y) => {
    const row: any = { year: y };
    s.customAssets.forEach((c) => {
      const proj = projectGrowth(c.currentValue, c.monthlyContribution, c.expectedReturn, y);
      row[c.name || c.id] = proj[proj.length - 1]?.value ?? c.currentValue;
    });
    return row;
  });

  function update(id: string, patch: Partial<CustomAsset>) {
    set((st) => ({ ...st, customAssets: st.customAssets.map((c) => c.id === id ? { ...c, ...patch } : c) }));
  }
  function add() {
    set((st) => ({
      ...st,
      customAssets: [...st.customAssets, {
        id: uid(),
        name: "New asset",
        category: "Other",
        currentValue: 0,
        acquiredValue: 0,
        monthlyContribution: 0,
        expectedReturn: 0.05,
        notes: "",
      }],
    }));
  }
  function remove(id: string) {
    set((st) => ({ ...st, customAssets: st.customAssets.filter((c) => c.id !== id) }));
  }

  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <div>
      <PageHeader
        eyebrow="Bespoke wealth"
        title="Custom Portfolio"
        description="Anything that doesn't fit standard buckets — crypto, watches, art, wine, classic cars, business equity. Name it, value it, project it."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Portfolio value" value={fmtGBP(total)} tone="primary" />
        <StatCard label="Acquired for" value={fmtGBP(acquired)} />
        <StatCard label="Unrealised gain" value={fmtGBP(gain)} hint={fmtPct(gainPct, 1)} tone={gain >= 0 ? "success" : "destructive"} />
        <StatCard label="Monthly added" value={fmtGBP(monthly)} tone="gold" />
      </div>

      {s.customAssets.length === 0 ? (
        <Card className="text-center py-12">
          <Sparkles className="h-10 w-10 mx-auto text-gold mb-3" />
          <h3 className="font-display text-xl mb-1">Build your portfolio</h3>
          <p className="text-sm text-muted-foreground mb-4">Track unusual assets and project their growth over time.</p>
          <button onClick={add} className="inline-flex items-center gap-1 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90">
            <Plus className="h-4 w-4" /> Add your first asset
          </button>
        </Card>
      ) : (
        <>
          <Section title="Projected growth by asset">
            <Card>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} label={{ value: "Years", position: "insideBottom", offset: -5, fontSize: 10 }} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: number) => fmtGBP(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {s.customAssets.map((c, idx) => (
                      <Line key={c.id} type="monotone" dataKey={c.name || c.id} stroke={colors[idx % colors.length]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Section>

          <Section title="Portfolio summary" description="One row per asset. Hover ❓ for plain-English explanations.">
            <DetailTable
              caption="Unrealised gain = how much you'd profit on paper if you sold today (before any tax)."
              columns={[
                { key: "name", header: "Asset", hint: "Your name for this item", render: (r: any) => <span className="font-medium">{r.name}</span> },
                { key: "cat", header: "Category", hint: "What kind of asset it is", render: (r: any) => <TypePill>{r.category}</TypePill> },
                { key: "acq", header: "Paid", hint: "What you originally paid for it", align: "right", render: (r: any) => fmtGBP(r.acquiredValue) },
                { key: "now", header: "Worth now", hint: "Today's estimated market value", align: "right", render: (r: any) => <span className="font-semibold">{fmtGBP(r.currentValue)}</span> },
                { key: "g", header: "Gain", hint: "Worth now minus what you paid", align: "right", render: (r: any) => {
                  const g = r.currentValue - r.acquiredValue;
                  return <span className={g >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>{fmtGBP(g)}</span>;
                } },
                { key: "pct", header: "Return so far", hint: "Gain as a percentage of what you paid", align: "right", render: (r: any) => {
                  const pct = r.acquiredValue > 0 ? (r.currentValue - r.acquiredValue) / r.acquiredValue : 0;
                  return <span className={pct >= 0 ? "text-success" : "text-destructive"}>{fmtPct(pct, 1)}</span>;
                } },
                { key: "add", header: "Adding / mo", hint: "Money you contribute each month to grow this asset", align: "right", render: (r: any) => fmtGBP(r.monthlyContribution) },
                { key: "p10", header: "In 10 yrs", hint: "Projected value in 10 years using your assumed return", align: "right", render: (r: any) => {
                  const p = projectGrowth(r.currentValue, r.monthlyContribution, r.expectedReturn, 10);
                  return <span className="text-primary font-semibold">{fmtGBP(p[p.length-1]?.value ?? 0)}</span>;
                } },
              ]}
              rows={s.customAssets}
              footer={
                <tr>
                  <td className="px-3 py-2.5" colSpan={2}>Totals</td>
                  <td className="px-3 py-2.5 text-right num">{fmtGBP(acquired)}</td>
                  <td className="px-3 py-2.5 text-right num">{fmtGBP(total)}</td>
                  <td className="px-3 py-2.5 text-right num">{fmtGBP(gain)}</td>
                  <td className="px-3 py-2.5 text-right num">{fmtPct(gainPct, 1)}</td>
                  <td className="px-3 py-2.5 text-right num">{fmtGBP(monthly)}</td>
                  <td className="px-3 py-2.5 text-right num">—</td>
                </tr>
              }
            />
          </Section>

          <Section
            title="Your assets"
            action={
              <button onClick={add} className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90">
                <Plus className="h-3.5 w-3.5" /> Add asset
              </button>
            }
          >
            <div className="space-y-3">
              {s.customAssets.map((c) => {
                const g = c.currentValue - c.acquiredValue;
                return (
                  <Card key={c.id}>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <input className="font-display font-semibold text-lg bg-transparent outline-none border-b border-transparent focus:border-primary" value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} />
                      <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <Field label="Category">
                        <select className="ipt" value={c.category} onChange={(e) => update(c.id, { category: e.target.value })}>
                          {PRESETS.map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </Field>
                      <Field label="Acquired for (£)">
                        <input type="number" className="ipt num" value={c.acquiredValue} onChange={(e) => update(c.id, { acquiredValue: +e.target.value })} />
                      </Field>
                      <Field label="Current value (£)">
                        <input type="number" className="ipt num" value={c.currentValue} onChange={(e) => update(c.id, { currentValue: +e.target.value })} />
                      </Field>
                      <Field label="Monthly add (£)">
                        <input type="number" className="ipt num" value={c.monthlyContribution} onChange={(e) => update(c.id, { monthlyContribution: +e.target.value })} />
                      </Field>
                      <Field label="Expected return %">
                        <input type="number" step="0.5" className="ipt num" value={(c.expectedReturn * 100).toFixed(1)} onChange={(e) => update(c.id, { expectedReturn: +e.target.value / 100 })} />
                      </Field>
                    </div>
                    <div className="mt-3">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</label>
                      <textarea className="ipt" rows={2} value={c.notes} onChange={(e) => update(c.id, { notes: e.target.value })} placeholder="Provenance, condition, valuation source…" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Unrealised: <span className={`font-semibold ${g >= 0 ? "text-success" : "text-destructive"}`}>{fmtGBP(g)}</span></span>
                      <span className="text-muted-foreground">CGT: gains over £3,000/yr taxed at 18% / 24%</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Section>
        </>
      )}

      <Section title="Tax notes for unusual assets">
        <div className="grid md:grid-cols-2 gap-3">
          <Card>
            <h4 className="font-semibold mb-1">Capital Gains Tax</h4>
            <p className="text-sm text-muted-foreground">Most unusual assets sit outside ISAs/pensions, so gains are taxable. £3,000 annual exempt amount. Rates: 18% (basic) / 24% (higher) on most assets from Oct 2024.</p>
          </Card>
          <Card>
            <h4 className="font-semibold mb-1">Chattels exemption</h4>
            <p className="text-sm text-muted-foreground">Personal possessions sold for ≤£6,000 are CGT-free. Wasting assets (life ≤50yrs, e.g. classic cars) are generally exempt.</p>
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
