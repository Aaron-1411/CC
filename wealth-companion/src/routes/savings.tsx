import { createFileRoute } from "@tanstack/react-router";
import { useStore, uid } from "@/lib/store";
import { PageHeader, Card, Section, StatCard } from "@/components/ui-bits";
import { fmtGBP, fmtPct, computeTakeHome, UK } from "@/lib/uk-tax";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: "Savings — Sterling" },
      { name: "description", content: "Track UK cash savings, interest, and Personal Savings Allowance usage." },
    ],
  }),
  component: SavingsPage,
});

function SavingsPage() {
  const [s, set] = useStore();
  const total = s.savings.reduce((a, x) => a + x.balance, 0);
  const interest = s.savings.reduce((a, x) => a + x.balance * x.rate, 0);
  const th = computeTakeHome({ grossSalary: s.profile.grossSalary, studentLoan: s.profile.studentLoanPlan });
  const psa = th.bands.higher > 0 ? UK.savingsAllowanceHigher : UK.savingsAllowanceBasic;
  const taxableInterest = Math.max(0, interest - psa);

  function update(id: string, patch: any) {
    set((st) => ({ ...st, savings: st.savings.map((x) => x.id === id ? { ...x, ...patch } : x) }));
  }
  function add() {
    set((st) => ({ ...st, savings: [...st.savings, { id: uid(), name: "New account", balance: 0, rate: 0.045 }] }));
  }
  function remove(id: string) {
    set((st) => ({ ...st, savings: st.savings.filter((x) => x.id !== id) }));
  }

  return (
    <div>
      <PageHeader eyebrow="Cash" title="Savings" description="Easy-access, fixed-term and regular savers. Tracks your Personal Savings Allowance." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total cash" value={fmtGBP(total)} tone="primary" />
        <StatCard label="Annual interest" value={fmtGBP(interest)} hint="Based on current rates" />
        <StatCard label="PSA allowance" value={fmtGBP(psa)} hint={th.bands.higher > 0 ? "Higher rate" : "Basic rate"} tone="success" />
        <StatCard label="Taxable interest" value={fmtGBP(taxableInterest)} tone={taxableInterest > 0 ? "warning" : "default"} />
      </div>

      <Section
        title="Your accounts"
        action={
          <button onClick={add} className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Add account
          </button>
        }
      >
        <div className="space-y-3">
          {s.savings.map((x) => (
            <Card key={x.id}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Name</label>
                  <input className="ipt" value={x.name} onChange={(e) => update(x.id, { name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Balance (£)</label>
                  <input type="number" className="ipt num" value={x.balance} onChange={(e) => update(x.id, { balance: +e.target.value })} />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Rate %</label>
                    <input type="number" step="0.05" className="ipt num" value={(x.rate * 100).toFixed(2)} onChange={(e) => update(x.id, { rate: +e.target.value / 100 })} />
                  </div>
                  <button onClick={() => remove(x.id)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Annual interest: <span className="font-semibold text-foreground">{fmtGBP(x.balance * x.rate)}</span> ({fmtPct(x.rate, 2)})
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Personal Savings Allowance">
        <Card>
          <p className="text-sm text-muted-foreground">
            Basic-rate taxpayers get £1,000 of interest tax-free. Higher-rate £500. Additional-rate £0. Interest above your PSA is taxed at your marginal rate.
            Move surplus cash into a Cash ISA to shelter it from tax.
          </p>
        </Card>
      </Section>

      <style>{`.ipt{width:100%;font-size:13px;padding:6px 8px;border:1px solid var(--border);border-radius:6px;background:var(--background);color:var(--foreground);}`}</style>
    </div>
  );
}
