import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Section } from "@/components/ui-bits";
import { computeTakeHome, fmtGBP, fmtPct } from "@/lib/uk-tax";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Sterling" },
      { name: "description", content: "Your details power UK eligibility checks and tax calculations." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [s, set] = useStore();
  const p = s.profile;

  function patch(x: Partial<typeof p>) {
    set((st) => ({ ...st, profile: { ...st.profile, ...x } }));
  }

  const th = computeTakeHome({ grossSalary: p.grossSalary, studentLoan: p.studentLoanPlan });

  return (
    <div>
      <PageHeader eyebrow="About you" title="Profile" description="Used to personalise UK tax & eligibility calculations. Stored locally on this device." />

      <Section title="Personal details">
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Name">
              <input className="ipt" value={p.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label="Age">
              <input type="number" className="ipt num" value={p.age} onChange={(e) => patch({ age: +e.target.value })} />
            </Field>
            <Field label="Gross annual salary (£)">
              <input type="number" className="ipt num" value={p.grossSalary} onChange={(e) => patch({ grossSalary: +e.target.value })} />
            </Field>
            <Field label="Student loan plan">
              <select className="ipt" value={p.studentLoanPlan} onChange={(e) => patch({ studentLoanPlan: e.target.value as any })}>
                <option value="none">None</option>
                <option value="plan1">Plan 1</option>
                <option value="plan2">Plan 2</option>
                <option value="plan4">Plan 4 (Scotland)</option>
                <option value="plan5">Plan 5</option>
                <option value="postgrad">Postgraduate</option>
              </select>
            </Field>
            <Field label="Student loan balance (£)">
              <input type="number" className="ipt num" value={p.studentLoanBalance} onChange={(e) => patch({ studentLoanBalance: +e.target.value })} />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Toggle label="Married / civil partner" v={p.marriedOrCivilPartner} onChange={(v) => patch({ marriedOrCivilPartner: v })} />
            <Toggle label="Partner earns under PA" v={p.partnerLowerEarner} onChange={(v) => patch({ partnerLowerEarner: v })} />
            <Toggle label="Has children" v={p.hasChildren} onChange={(v) => patch({ hasChildren: v })} />
            <Toggle label="First-time buyer" v={p.isFirstTimeBuyer} onChange={(v) => patch({ isFirstTimeBuyer: v })} />
          </div>
        </Card>
      </Section>

      <Section title="Live UK tax breakdown" description="Computed instantly from the figures above.">
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <KV k="Gross salary" v={fmtGBP(p.grossSalary)} />
            <KV k="Income tax" v={fmtGBP(th.incomeTaxAmount)} />
            <KV k="National Insurance" v={fmtGBP(th.niAmount)} />
            <KV k="Student loan" v={fmtGBP(th.studentLoanAmount)} />
            <KV k="Take-home / yr" v={fmtGBP(th.takeHome * 12)} accent />
            <KV k="Take-home / mo" v={fmtGBP(th.takeHome)} accent />
            <KV k="Effective tax rate" v={fmtPct(th.effectiveTaxRate, 1)} />
            <KV k="Marginal rate" v={fmtPct(th.marginalRate, 0)} />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            <strong>Bands:</strong> {fmtGBP(th.bands.basic)} in basic (20%) · {fmtGBP(th.bands.higher)} in higher (40%) · {fmtGBP(th.bands.additional)} in additional (45%)
          </div>
        </Card>
      </Section>

      <Section title="Data & privacy">
        <Card>
          <p className="text-sm text-muted-foreground mb-3">All your data is stored only in this browser (localStorage). Nothing is sent to a server.</p>
          <button
            onClick={() => { if (confirm("Reset all data?")) { localStorage.removeItem("wealth-tracker:v1"); location.reload(); } }}
            className="text-xs font-semibold text-destructive hover:underline"
          >
            Clear all data
          </button>
        </Card>
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

function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={v} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
      <span>{label}</span>
    </label>
  );
}

function KV({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className={`font-display text-xl font-semibold num ${accent ? "text-primary" : ""}`}>{v}</div>
    </div>
  );
}
