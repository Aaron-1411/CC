import { useState } from "react";
import { useStore, uid, type AppState, type PensionAccount, type ISAAccount, type SavingsAccount, type CustomAsset } from "@/lib/store";
import { ArrowRight, Sparkles, Trash2, Plus, ChevronDown, User, PiggyBank, Landmark, Home, Wallet, Gem, CheckCircle2 } from "lucide-react";

const EMPTY: AppState = {
  onboarded: false,
  profile: {
    name: "", age: 30, grossSalary: 0, studentLoanPlan: "none", studentLoanBalance: 0,
    marriedOrCivilPartner: false, partnerLowerEarner: false, hasChildren: false, isFirstTimeBuyer: false,
  },
  pensions: [], isas: [],
  mortgage: { enabled: false, propertyValue: 0, outstandingBalance: 0, rate: 0.045, termYearsRemaining: 25, monthlyOverpayment: 0 },
  savings: [], customAssets: [],
  selfAssessment: {
    utr: "", taxYear: "2025/26",
    employmentIncome: [], selfEmployment: [], selfEmploymentExpenses: [],
    dividends: [], savingsInterest: [], rentalIncome: [], rentalExpenses: [],
    otherIncome: [], pensionContribsRAS: [], giftAid: [], capitalGains: [],
  },
  goals: {
    retirementAge: 67, retirementIncome: 30000, emergencyFundMonths: 4,
    housePurchase: { enabled: false, targetPrice: 0, targetDeposit: 0, targetYear: new Date().getFullYear() + 5 },
    payOffMortgageBy: null, payOffStudentLoanBy: null, riskAppetite: "balanced", customGoals: [],
  },
};

export function Onboarding() {
  const [, setStore] = useStore();
  const [draft, setDraftState] = useState<AppState>(EMPTY);
  const setDraft = (u: (s: AppState) => AppState) => setDraftState((s) => u(s));
  const [open, setOpen] = useState<string>("about");

  const canFinish = draft.profile.name.trim().length > 0 && draft.profile.age > 0;

  function finish() {
    if (!canFinish) { setOpen("about"); return; }
    setStore(() => ({ ...draft, onboarded: true }));
  }

  // completion checks
  const done = {
    about: draft.profile.name.trim().length > 0 && draft.profile.age > 0 && draft.profile.grossSalary > 0,
    pensions: draft.pensions.length > 0,
    isas: draft.isas.length > 0,
    mortgage: draft.mortgage.enabled,
    savings: draft.savings.length > 0,
    custom: draft.customAssets.length > 0,
  };
  const filled = Object.values(done).filter(Boolean).length;

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-lg bg-gradient-gold flex items-center justify-center font-display font-bold text-gold-foreground">£</div>
          <div>
            <div className="font-display font-semibold tracking-tight">Sterling</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">UK Wealth Tracker</div>
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-soft p-6 md:p-8 mb-4">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 className="font-display text-2xl md:text-3xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" /> Set up your dashboard
            </h1>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold whitespace-nowrap">
              {filled}/6 sections
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Just fill in <strong className="text-foreground">About you</strong> to get started — the other sections are optional and can be added later. Everything stays on this device.
          </p>
        </div>

        <div className="space-y-2">
          <Accordion id="about" open={open} setOpen={setOpen} icon={<User className="h-4 w-4" />} title="About you" subtitle="Required — name, age, salary" required complete={done.about}>
            <AboutSection draft={draft} setDraft={setDraft} />
          </Accordion>

          <Accordion id="pensions" open={open} setOpen={setOpen} icon={<PiggyBank className="h-4 w-4" />} title="Pensions" subtitle="Workplace, SIPP, personal" complete={done.pensions}>
            <ListEditor
              items={draft.pensions}
              onChange={(items) => setDraft((s) => ({ ...s, pensions: items }))}
              empty="No pensions yet."
              addLabel="Add pension"
              create={(): PensionAccount => ({ id: uid(), name: "Workplace Pension", provider: "", type: "workplace", currentValue: 0, monthlyOwn: 0, monthlyEmployer: 0, expectedReturn: 0.06 })}
              render={(it, patch) => (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Name"><input className="ipt" value={it.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
                  <Field label="Provider"><input className="ipt" value={it.provider} onChange={(e) => patch({ provider: e.target.value })} /></Field>
                  <Field label="Type">
                    <select className="ipt" value={it.type} onChange={(e) => patch({ type: e.target.value as PensionAccount["type"] })}>
                      <option value="workplace">Workplace</option>
                      <option value="sipp">SIPP</option>
                      <option value="personal">Personal</option>
                    </select>
                  </Field>
                  <Field label="Current value (£)"><input type="number" className="ipt num" value={it.currentValue || ""} onChange={(e) => patch({ currentValue: +e.target.value })} /></Field>
                  <Field label="Your monthly (£)"><input type="number" className="ipt num" value={it.monthlyOwn || ""} onChange={(e) => patch({ monthlyOwn: +e.target.value })} /></Field>
                  <Field label="Employer monthly (£)"><input type="number" className="ipt num" value={it.monthlyEmployer || ""} onChange={(e) => patch({ monthlyEmployer: +e.target.value })} /></Field>
                </div>
              )}
            />
          </Accordion>

          <Accordion id="isas" open={open} setOpen={setOpen} icon={<Landmark className="h-4 w-4" />} title="ISAs & Help to Buy" subtitle="£20,000 annual allowance" complete={done.isas}>
            <ListEditor
              items={draft.isas}
              onChange={(items) => setDraft((s) => ({ ...s, isas: items }))}
              empty="No ISAs yet."
              addLabel="Add ISA"
              create={(): ISAAccount => ({ id: uid(), name: "Stocks & Shares ISA", type: "stocks", currentValue: 0, monthlyContribution: 0, thisYearContribution: 0, expectedReturn: 0.07 })}
              render={(it, patch) => (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Name"><input className="ipt" value={it.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
                  <Field label="Type">
                    <select className="ipt" value={it.type} onChange={(e) => patch({ type: e.target.value as ISAAccount["type"] })}>
                      <option value="stocks">Stocks & Shares</option>
                      <option value="cash">Cash ISA</option>
                      <option value="lisa">Lifetime ISA</option>
                      <option value="h2b">Help to Buy ISA</option>
                    </select>
                  </Field>
                  <Field label="Current value (£)"><input type="number" className="ipt num" value={it.currentValue || ""} onChange={(e) => patch({ currentValue: +e.target.value })} /></Field>
                  <Field label="Monthly (£)"><input type="number" className="ipt num" value={it.monthlyContribution || ""} onChange={(e) => patch({ monthlyContribution: +e.target.value })} /></Field>
                  <Field label="Paid in this tax yr (£)"><input type="number" className="ipt num" value={it.thisYearContribution || ""} onChange={(e) => patch({ thisYearContribution: +e.target.value })} /></Field>
                </div>
              )}
            />
          </Accordion>

          <Accordion id="mortgage" open={open} setOpen={setOpen} icon={<Home className="h-4 w-4" />} title="Mortgage" subtitle="Home value & debt" complete={done.mortgage}>
            <Toggle label="I have a mortgage" v={draft.mortgage.enabled} onChange={(v) => setDraft((s) => ({ ...s, mortgage: { ...s.mortgage, enabled: v } }))} />
            {draft.mortgage.enabled && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Property value (£)"><input type="number" className="ipt num" value={draft.mortgage.propertyValue || ""} onChange={(e) => setDraft((s) => ({ ...s, mortgage: { ...s.mortgage, propertyValue: +e.target.value } }))} /></Field>
                <Field label="Outstanding balance (£)"><input type="number" className="ipt num" value={draft.mortgage.outstandingBalance || ""} onChange={(e) => setDraft((s) => ({ ...s, mortgage: { ...s.mortgage, outstandingBalance: +e.target.value } }))} /></Field>
                <Field label="Interest rate (%)"><input type="number" step="0.01" className="ipt num" value={draft.mortgage.rate * 100 || ""} onChange={(e) => setDraft((s) => ({ ...s, mortgage: { ...s.mortgage, rate: +e.target.value / 100 } }))} /></Field>
                <Field label="Years remaining"><input type="number" className="ipt num" value={draft.mortgage.termYearsRemaining || ""} onChange={(e) => setDraft((s) => ({ ...s, mortgage: { ...s.mortgage, termYearsRemaining: +e.target.value } }))} /></Field>
              </div>
            )}
          </Accordion>

          <Accordion id="savings" open={open} setOpen={setOpen} icon={<Wallet className="h-4 w-4" />} title="Savings & cash" subtitle="Easy-access, regular savers" complete={done.savings}>
            <ListEditor
              items={draft.savings}
              onChange={(items) => setDraft((s) => ({ ...s, savings: items }))}
              empty="No savings accounts yet."
              addLabel="Add account"
              create={(): SavingsAccount => ({ id: uid(), name: "Easy access", balance: 0, rate: 0.04 })}
              render={(it, patch) => (
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Name"><input className="ipt" value={it.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
                  <Field label="Balance (£)"><input type="number" className="ipt num" value={it.balance || ""} onChange={(e) => patch({ balance: +e.target.value })} /></Field>
                  <Field label="Rate (%)"><input type="number" step="0.01" className="ipt num" value={it.rate * 100 || ""} onChange={(e) => patch({ rate: +e.target.value / 100 })} /></Field>
                </div>
              )}
            />
          </Accordion>

          <Accordion id="custom" open={open} setOpen={setOpen} icon={<Gem className="h-4 w-4" />} title="Custom assets" subtitle="Crypto, art, watches, business" complete={done.custom}>
            <ListEditor
              items={draft.customAssets}
              onChange={(items) => setDraft((s) => ({ ...s, customAssets: items }))}
              empty="No custom assets — easily added later."
              addLabel="Add asset"
              create={(): CustomAsset => ({ id: uid(), name: "", category: "Other", currentValue: 0, acquiredValue: 0, monthlyContribution: 0, expectedReturn: 0.05, notes: "" })}
              render={(it, patch) => (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Name"><input className="ipt" value={it.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
                  <Field label="Category"><input className="ipt" value={it.category} onChange={(e) => patch({ category: e.target.value })} /></Field>
                  <Field label="Current value (£)"><input type="number" className="ipt num" value={it.currentValue || ""} onChange={(e) => patch({ currentValue: +e.target.value })} /></Field>
                  <Field label="Acquired for (£)"><input type="number" className="ipt num" value={it.acquiredValue || ""} onChange={(e) => patch({ acquiredValue: +e.target.value })} /></Field>
                  <Field label="Expected return (%)"><input type="number" step="0.1" className="ipt num" value={it.expectedReturn * 100 || ""} onChange={(e) => patch({ expectedReturn: +e.target.value / 100 })} /></Field>
                  <Field label="Monthly add (£)"><input type="number" className="ipt num" value={it.monthlyContribution || ""} onChange={(e) => patch({ monthlyContribution: +e.target.value })} /></Field>
                </div>
              )}
            />
          </Accordion>
        </div>

        <div className="sticky bottom-4 mt-6 z-10">
          <button
            onClick={finish}
            disabled={!canFinish}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40 shadow-glow"
          >
            Build my dashboard <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-[11px] text-center text-muted-foreground mt-2">
            {canFinish ? "You can add or edit anything later from each tool's page." : "Fill in your name & age to continue."}
          </p>
        </div>
      </div>
    </div>
  );
}

function AboutSection({ draft, setDraft }: { draft: AppState; setDraft: (u: (s: AppState) => AppState) => void }) {
  const p = draft.profile;
  const patch = (x: Partial<typeof p>) => setDraft((s) => ({ ...s, profile: { ...s.profile, ...x } }));
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Your name">
        <input className="ipt" value={p.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Alex" />
      </Field>
      <Field label="Age">
        <input type="number" className="ipt num" value={p.age || ""} onChange={(e) => patch({ age: +e.target.value })} />
      </Field>
      <Field label="Gross annual salary (£)" full>
        <input type="number" className="ipt num" value={p.grossSalary || ""} onChange={(e) => patch({ grossSalary: +e.target.value })} placeholder="45000" />
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
        <input type="number" className="ipt num" value={p.studentLoanBalance || ""} onChange={(e) => patch({ studentLoanBalance: +e.target.value })} />
      </Field>
      <div className="col-span-2 grid grid-cols-2 gap-2 text-sm pt-1">
        <Toggle label="Married / civil partner" v={p.marriedOrCivilPartner} onChange={(v) => patch({ marriedOrCivilPartner: v })} />
        <Toggle label="Partner earns under £12,570" v={p.partnerLowerEarner} onChange={(v) => patch({ partnerLowerEarner: v })} />
        <Toggle label="Have children" v={p.hasChildren} onChange={(v) => patch({ hasChildren: v })} />
        <Toggle label="First-time buyer" v={p.isFirstTimeBuyer} onChange={(v) => patch({ isFirstTimeBuyer: v })} />
      </div>
    </div>
  );
}

function Accordion({ id, open, setOpen, icon, title, subtitle, required, complete, children }: {
  id: string; open: string; setOpen: (s: string) => void;
  icon: React.ReactNode; title: string; subtitle: string;
  required?: boolean; complete?: boolean;
  children: React.ReactNode;
}) {
  const isOpen = open === id;
  return (
    <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
      <button
        onClick={() => setOpen(isOpen ? "" : id)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${complete ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
          {complete ? <CheckCircle2 className="h-4 w-4" /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{title}</span>
            {required && <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">Required</span>}
            {!required && <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Optional</span>}
          </div>
          <div className="text-[11px] text-muted-foreground">{subtitle}</div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="px-4 pb-5 pt-1 border-t border-dashed">{children}</div>}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <input type="checkbox" checked={v} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
      <span>{label}</span>
    </label>
  );
}

function ListEditor<T extends { id: string }>({
  items, onChange, empty, addLabel, create, render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  empty: string;
  addLabel: string;
  create: () => T;
  render: (item: T, patch: (x: Partial<T>) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-3 mt-2">
      {items.length === 0 && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground text-center">{empty}</div>
      )}
      {items.map((it, idx) => (
        <div key={it.id} className="rounded-lg border bg-muted/20 p-3 relative">
          {render(it, (x) => onChange(items.map((y, i) => i === idx ? { ...y, ...x } : y)))}
          <button
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
            aria-label="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, create()])}
        className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90"
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  );
}
