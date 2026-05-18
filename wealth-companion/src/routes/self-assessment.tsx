import { createFileRoute } from "@tanstack/react-router";
import { useStore, uid, type SAEntry, type SACapitalGain, type SelfAssessment } from "@/lib/store";
import { PageHeader, Card, Section, StatCard } from "@/components/ui-bits";
import { DetailTable } from "@/components/DetailTable";
import { fmtGBP, fmtPct, computeTakeHome, incomeTax, UK } from "@/lib/uk-tax";
import { Plus, Trash2, Download, FileText, Info } from "lucide-react";
import { useRef } from "react";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";

export const Route = createFileRoute("/self-assessment")({
  head: () => ({
    meta: [
      { title: "Self Assessment — Sterling" },
      { name: "description", content: "Track everything HMRC needs for your UK Self Assessment tax return — incomes, expenses, dividends, interest, CGT, pension reliefs and Gift Aid." },
    ],
  }),
  component: SAPage,
});

type ListKey =
  | "employmentIncome"
  | "selfEmployment"
  | "selfEmploymentExpenses"
  | "dividends"
  | "savingsInterest"
  | "rentalIncome"
  | "rentalExpenses"
  | "otherIncome"
  | "pensionContribsRAS"
  | "giftAid";

function sum(list: SAEntry[]) {
  return list.reduce((a, x) => a + (x.amount || 0), 0);
}

function SAPage() {
  const [s, set] = useStore();
  const sa = s.selfAssessment;
  const reportRef = useRef<HTMLDivElement>(null);

  // ----- totals -----
  const employmentTotal = sum(sa.employmentIncome);
  const seGross = sum(sa.selfEmployment);
  const seExpenses = sum(sa.selfEmploymentExpenses);
  const seProfit = Math.max(0, seGross - seExpenses);
  const dividends = sum(sa.dividends);
  const savingsInt = sum(sa.savingsInterest);
  const rentalGross = sum(sa.rentalIncome);
  const rentalExp = sum(sa.rentalExpenses);
  const rentalProfit = Math.max(0, rentalGross - rentalExp);
  const other = sum(sa.otherIncome);
  const ras = sum(sa.pensionContribsRAS);
  const giftAid = sum(sa.giftAid);

  // CGT
  const cgGains = sa.capitalGains
    .filter((g) => !g.withinISA)
    .map((g) => ({ ...g, gain: g.proceeds - g.cost }));
  const totalGains = cgGains.reduce((a, g) => a + g.gain, 0);
  const taxableGains = Math.max(0, totalGains - UK.cgtAllowance);

  // ----- estimated tax (illustrative) -----
  // PAYE income already taxed at source — we re-compute total liability so user sees overall picture.
  const totalNonSavingsIncome = employmentTotal + seProfit + rentalProfit + other;
  // Higher-rate / additional-rate band extension via RAS pensions & Gift Aid
  const bandExtension = (ras + giftAid) * 1.25;
  const adjBasicLimit = UK.basicRateLimit + bandExtension;

  const psa = totalNonSavingsIncome > UK.basicRateLimit ? UK.savingsAllowanceHigher : UK.savingsAllowanceBasic;
  const taxableSavings = Math.max(0, savingsInt - psa);
  const taxableDividends = Math.max(0, dividends - UK.dividendAllowance);

  const it = incomeTax(totalNonSavingsIncome);
  // Approximate dividend tax: treat as topmost slice
  const divRate = totalNonSavingsIncome >= UK.higherRateLimit ? 0.3935 : totalNonSavingsIncome >= adjBasicLimit ? 0.3375 : 0.0875;
  const dividendTax = taxableDividends * divRate;
  // Savings: nearest marginal rate (basic 20% / higher 40%)
  const savRate = totalNonSavingsIncome >= UK.higherRateLimit ? UK.additionalRate : totalNonSavingsIncome >= adjBasicLimit ? UK.higherRate : UK.basicRate;
  const savingsTax = taxableSavings * savRate;
  const cgtRate = totalNonSavingsIncome >= adjBasicLimit ? 0.24 : 0.18;
  const cgtDue = taxableGains * cgtRate;
  const estimatedTotalTax = it.tax + dividendTax + savingsTax + cgtDue;

  const th = computeTakeHome({ grossSalary: s.profile.grossSalary, studentLoan: s.profile.studentLoanPlan });
  const paidViaPAYE = th.incomeTaxAmount;
  const balancing = estimatedTotalTax - paidViaPAYE;

  // ----- helpers -----
  function patch(p: Partial<SelfAssessment>) {
    set((st) => ({ ...st, selfAssessment: { ...st.selfAssessment, ...p } }));
  }
  function addEntry(key: ListKey) {
    patch({ [key]: [...sa[key], { id: uid(), date: new Date().toISOString().slice(0, 10), description: "", amount: 0 }] } as any);
  }
  function updEntry(key: ListKey, id: string, p: Partial<SAEntry>) {
    patch({ [key]: sa[key].map((e) => (e.id === id ? { ...e, ...p } : e)) } as any);
  }
  function delEntry(key: ListKey, id: string) {
    patch({ [key]: sa[key].filter((e) => e.id !== id) } as any);
  }
  function addGain() {
    patch({
      capitalGains: [...sa.capitalGains, { id: uid(), asset: "", acquired: "", disposed: new Date().toISOString().slice(0, 10), proceeds: 0, cost: 0, withinISA: false }],
    });
  }
  function updGain(id: string, p: Partial<SACapitalGain>) {
    patch({ capitalGains: sa.capitalGains.map((g) => (g.id === id ? { ...g, ...p } : g)) });
  }
  function delGain(id: string) {
    patch({ capitalGains: sa.capitalGains.filter((g) => g.id !== id) });
  }

  function exportCSV() {
    const rows: string[] = [];
    rows.push(`Self Assessment summary,${sa.taxYear}`);
    rows.push(`UTR,${sa.utr}`);
    rows.push("");
    rows.push("Section,Item,Date,Amount (GBP),Notes");
    const dump = (label: string, arr: SAEntry[]) =>
      arr.forEach((e) => rows.push(`${label},"${(e.description ?? "").replace(/"/g, "'")}",${e.date},${e.amount},"${(e.notes ?? "").replace(/"/g, "'")}"`));
    dump("Employment income (PAYE)", sa.employmentIncome);
    dump("Self-employment income", sa.selfEmployment);
    dump("Self-employment expenses", sa.selfEmploymentExpenses);
    dump("Dividends (non-ISA)", sa.dividends);
    dump("Savings interest (non-ISA)", sa.savingsInterest);
    dump("Rental income", sa.rentalIncome);
    dump("Rental expenses", sa.rentalExpenses);
    dump("Other income", sa.otherIncome);
    dump("Pension RAS contributions", sa.pensionContribsRAS);
    dump("Gift Aid", sa.giftAid);
    rows.push("");
    rows.push("Capital gains,Asset,Acquired,Disposed,Proceeds,Cost,Gain,Within ISA");
    sa.capitalGains.forEach((g) =>
      rows.push(`,"${g.asset}",${g.acquired},${g.disposed},${g.proceeds},${g.cost},${g.proceeds - g.cost},${g.withinISA ? "Yes" : "No"}`),
    );
    rows.push("");
    rows.push("Totals");
    rows.push(`Employment,${employmentTotal}`);
    rows.push(`Self-employment profit,${seProfit}`);
    rows.push(`Dividends,${dividends}`);
    rows.push(`Savings interest,${savingsInt}`);
    rows.push(`Rental profit,${rentalProfit}`);
    rows.push(`Other income,${other}`);
    rows.push(`Pension RAS,${ras}`);
    rows.push(`Gift Aid,${giftAid}`);
    rows.push(`Capital gains (taxable),${taxableGains}`);
    rows.push(`Estimated total tax,${estimatedTotalTax.toFixed(2)}`);
    rows.push(`Already paid via PAYE,${paidViaPAYE.toFixed(2)}`);
    rows.push(`Balancing payment,${balancing.toFixed(2)}`);
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `self-assessment-${sa.taxYear.replace("/", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div ref={reportRef}>
      <PageHeader
        eyebrow="HMRC ready"
        title="Self Assessment"
        description="Capture every figure HMRC asks for on your UK Self Assessment return. Numbers update live and you can export a CSV summary."
      >
        <DownloadPdfButton
          targetRef={reportRef}
          filename={`self-assessment-${sa.taxYear.replace("/", "-")}.pdf`}
          label="Download PDF"
        />
        <button onClick={exportCSV} className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </PageHeader>

      <Card className="mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="UTR (10 digits)">
            <input className="ipt num" placeholder="1234567890" value={sa.utr} onChange={(e) => patch({ utr: e.target.value })} />
          </Field>
          <Field label="Tax year">
            <input className="ipt" value={sa.taxYear} onChange={(e) => patch({ taxYear: e.target.value })} />
          </Field>
          <div className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>UK tax year runs <strong>6 April → 5 April</strong>. Online return due 31 January after year end. Pay by 31 January (and possibly 31 July).</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total income" value={fmtGBP(employmentTotal + seProfit + rentalProfit + other + dividends + savingsInt)} tone="primary" />
        <StatCard label="Estimated tax due" value={fmtGBP(estimatedTotalTax)} hint="Income + dividend + savings + CGT" />
        <StatCard label="Already paid via PAYE" value={fmtGBP(paidViaPAYE)} tone="success" />
        <StatCard
          label={balancing >= 0 ? "Balancing to pay" : "Refund expected"}
          value={fmtGBP(Math.abs(balancing))}
          tone={balancing > 0 ? "warning" : "success"}
          hint="Indicative only"
        />
      </div>

      {/* ---- Section: Employment ---- */}
      <SAList
        title="Employment income (PAYE)"
        helper="Each P60 / P45. Gross figure (before tax). Use one row per employer. Already pre-taxed at source — listed here for the full HMRC picture."
        listKey="employmentIncome"
        entries={sa.employmentIncome}
        total={employmentTotal}
        onAdd={() => addEntry("employmentIncome")}
        onUpd={(id, p) => updEntry("employmentIncome", id, p)}
        onDel={(id) => delEntry("employmentIncome", id)}
      />

      {/* ---- Self-employment ---- */}
      <Section title="Self-employment / freelance" description="Sole trader income and allowable expenses. Profit = income − expenses.">
        <div className="grid md:grid-cols-2 gap-4">
          <SACard
            title="Income (gross)"
            entries={sa.selfEmployment}
            onAdd={() => addEntry("selfEmployment")}
            onUpd={(id, p) => updEntry("selfEmployment", id, p)}
            onDel={(id) => delEntry("selfEmployment", id)}
            placeholder="Invoice / client"
          />
          <SACard
            title="Allowable expenses"
            entries={sa.selfEmploymentExpenses}
            onAdd={() => addEntry("selfEmploymentExpenses")}
            onUpd={(id, p) => updEntry("selfEmploymentExpenses", id, p)}
            onDel={(id) => delEntry("selfEmploymentExpenses", id)}
            placeholder="Software, travel, supplies…"
          />
        </div>
        <Card className="mt-3">
          <div className="grid grid-cols-3 text-sm">
            <KV k="Gross income" v={fmtGBP(seGross)} />
            <KV k="Expenses" v={fmtGBP(seExpenses)} />
            <KV k="Taxable profit" v={fmtGBP(seProfit)} accent />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Trading allowance: first £1,000 of self-employed income is tax-free (use it instead of expenses if expenses are below that).</p>
        </Card>
      </Section>

      {/* ---- Dividends ---- */}
      <SAList
        title="Dividends (outside ISA)"
        helper={`First £${UK.dividendAllowance} per year is tax-free. Above that: 8.75% basic / 33.75% higher / 39.35% additional. ISA dividends are tax-free and don't go here.`}
        listKey="dividends"
        entries={sa.dividends}
        total={dividends}
        onAdd={() => addEntry("dividends")}
        onUpd={(id, p) => updEntry("dividends", id, p)}
        onDel={(id) => delEntry("dividends", id)}
      />

      {/* ---- Savings interest ---- */}
      <SAList
        title="Savings interest (outside ISA)"
        helper={`Personal Savings Allowance: £1,000 (basic-rate) / £500 (higher-rate). Above that taxed at your marginal rate. Cash ISA interest is tax-free.`}
        listKey="savingsInterest"
        entries={sa.savingsInterest}
        total={savingsInt}
        onAdd={() => addEntry("savingsInterest")}
        onUpd={(id, p) => updEntry("savingsInterest", id, p)}
        onDel={(id) => delEntry("savingsInterest", id)}
      />

      {/* ---- Rental ---- */}
      <Section title="UK property income" description="Rental income and allowable expenses. Profit goes on the SA105 supplementary page.">
        <div className="grid md:grid-cols-2 gap-4">
          <SACard
            title="Rent received"
            entries={sa.rentalIncome}
            onAdd={() => addEntry("rentalIncome")}
            onUpd={(id, p) => updEntry("rentalIncome", id, p)}
            onDel={(id) => delEntry("rentalIncome", id)}
            placeholder="Property / tenant"
          />
          <SACard
            title="Allowable expenses"
            entries={sa.rentalExpenses}
            onAdd={() => addEntry("rentalExpenses")}
            onUpd={(id, p) => updEntry("rentalExpenses", id, p)}
            onDel={(id) => delEntry("rentalExpenses", id)}
            placeholder="Letting agent, repairs, insurance…"
          />
        </div>
        <Card className="mt-3">
          <div className="grid grid-cols-3 text-sm">
            <KV k="Rent received" v={fmtGBP(rentalGross)} />
            <KV k="Expenses" v={fmtGBP(rentalExp)} />
            <KV k="Rental profit" v={fmtGBP(rentalProfit)} accent />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Mortgage interest is no longer deducted directly — instead a 20% tax credit on finance costs is given separately.</p>
        </Card>
      </Section>

      {/* ---- Other income ---- */}
      <SAList
        title="Other income"
        helper="Anything else HMRC wants to know about: side gigs, foreign income, trust income, untaxed interest, etc."
        listKey="otherIncome"
        entries={sa.otherIncome}
        total={other}
        onAdd={() => addEntry("otherIncome")}
        onUpd={(id, p) => updEntry("otherIncome", id, p)}
        onDel={(id) => delEntry("otherIncome", id)}
      />

      {/* ---- Reliefs ---- */}
      <Section title="Reliefs that reduce your tax" description="These extend your basic-rate band — meaning more income taxed at 20% instead of 40%.">
        <div className="grid md:grid-cols-2 gap-4">
          <SACard
            title="Pension contributions (relief at source)"
            entries={sa.pensionContribsRAS}
            onAdd={() => addEntry("pensionContribsRAS")}
            onUpd={(id, p) => updEntry("pensionContribsRAS", id, p)}
            onDel={(id) => delEntry("pensionContribsRAS", id)}
            placeholder="SIPP / personal pension"
          />
          <SACard
            title="Gift Aid donations"
            entries={sa.giftAid}
            onAdd={() => addEntry("giftAid")}
            onUpd={(id, p) => updEntry("giftAid", id, p)}
            onDel={(id) => delEntry("giftAid", id)}
            placeholder="Charity name"
          />
        </div>
        <Card className="mt-3 text-sm">
          <p className="text-muted-foreground">
            You've extended your basic-rate band by <strong className="text-foreground">{fmtGBP(bandExtension)}</strong> — that's the gross-up of pension RAS + Gift Aid. Higher-rate taxpayers usually need to claim this relief through Self Assessment.
          </p>
        </Card>
      </Section>

      {/* ---- Capital Gains ---- */}
      <Section
        title="Capital Gains"
        description={`Allowance: £${UK.cgtAllowance} per year. Gains within ISAs / pensions are exempt and don't need reporting.`}
        action={
          <button onClick={addGain} className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Add disposal
          </button>
        }
      >
        <DetailTable
          empty="No disposals recorded — add any sale of shares, crypto, second property, etc."
          caption="Gain = proceeds − cost. Add disposals as they happen during the tax year."
          columns={[
            { key: "asset", header: "Asset", render: (g: any) => <input className="ipt" value={g.asset} onChange={(e) => updGain(g.id, { asset: e.target.value })} /> },
            { key: "acq", header: "Acquired", hint: "Date you bought it", render: (g: any) => <input type="date" className="ipt" value={g.acquired} onChange={(e) => updGain(g.id, { acquired: e.target.value })} /> },
            { key: "dis", header: "Disposed", hint: "Date sold", render: (g: any) => <input type="date" className="ipt" value={g.disposed} onChange={(e) => updGain(g.id, { disposed: e.target.value })} /> },
            { key: "p", header: "Proceeds (£)", align: "right", render: (g: any) => <input type="number" className="ipt num" value={g.proceeds} onChange={(e) => updGain(g.id, { proceeds: +e.target.value })} /> },
            { key: "c", header: "Cost (£)", align: "right", render: (g: any) => <input type="number" className="ipt num" value={g.cost} onChange={(e) => updGain(g.id, { cost: +e.target.value })} /> },
            { key: "g", header: "Gain (£)", align: "right", render: (g: any) => {
              const v = g.proceeds - g.cost;
              return <span className={`font-semibold ${v >= 0 ? "text-success" : "text-destructive"}`}>{fmtGBP(v)}</span>;
            } },
            { key: "isa", header: "ISA?", align: "center", hint: "Tick if held in an ISA — exempt from CGT", render: (g: any) => <input type="checkbox" checked={g.withinISA} onChange={(e) => updGain(g.id, { withinISA: e.target.checked })} /> },
            { key: "x", header: "", render: (g: any) => <button onClick={() => delGain(g.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button> },
          ]}
          rows={sa.capitalGains}
        />
        <Card className="mt-3">
          <div className="grid grid-cols-3 text-sm">
            <KV k="Total reportable gains" v={fmtGBP(totalGains)} />
            <KV k={`Less £${UK.cgtAllowance.toLocaleString()} allowance`} v={fmtGBP(taxableGains)} />
            <KV k={`CGT @ ${fmtPct(cgtRate, 0)}`} v={fmtGBP(cgtDue)} accent />
          </div>
        </Card>
      </Section>

      {/* ---- Summary ---- */}
      <Section title="Estimated tax summary" description="Indicative only — the exact figure depends on adjustments HMRC applies.">
        <DetailTable
          caption="Where your total estimated bill comes from."
          columns={[
            { key: "k", header: "Component", render: (r: any) => <span className="font-medium">{r.k}</span> },
            { key: "h", header: "How calculated", render: (r: any) => <span className="text-xs text-muted-foreground">{r.h}</span> },
            { key: "v", header: "£", align: "right", render: (r: any) => <span className="font-semibold num">{fmtGBP(r.v)}</span> },
          ]}
          rows={[
            { id: 1, k: "Income tax (non-savings)", h: "Bands applied to PAYE + self-employment + rental + other", v: it.tax },
            { id: 2, k: "Dividend tax", h: `${fmtGBP(taxableDividends)} taxable @ ${fmtPct(divRate, 2)}`, v: dividendTax },
            { id: 3, k: "Savings interest tax", h: `${fmtGBP(taxableSavings)} taxable @ ${fmtPct(savRate, 0)}`, v: savingsTax },
            { id: 4, k: "Capital Gains Tax", h: `${fmtGBP(taxableGains)} @ ${fmtPct(cgtRate, 0)}`, v: cgtDue },
          ]}
          footer={
            <>
              <tr><td className="px-3 py-2.5" colSpan={2}>Estimated total tax</td><td className="px-3 py-2.5 text-right num">{fmtGBP(estimatedTotalTax)}</td></tr>
              <tr><td className="px-3 py-2.5" colSpan={2}>Already paid via PAYE</td><td className="px-3 py-2.5 text-right num">{fmtGBP(paidViaPAYE)}</td></tr>
              <tr><td className="px-3 py-2.5" colSpan={2}>{balancing >= 0 ? "Balancing payment" : "Refund expected"}</td><td className={`px-3 py-2.5 text-right num font-semibold ${balancing > 0 ? "text-warning-foreground" : "text-success"}`}>{fmtGBP(Math.abs(balancing))}</td></tr>
            </>
          }
        />
      </Section>

      <Section title="Filing checklist">
        <div className="grid md:grid-cols-2 gap-3">
          <Card>
            <h4 className="font-semibold mb-1 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Key dates 2025/26</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 5 Oct 2026 — register for SA if first time</li>
              <li>• 31 Oct 2026 — paper return deadline</li>
              <li>• 31 Jan 2027 — online return + balancing payment</li>
              <li>• 31 Jul 2027 — second payment on account</li>
            </ul>
          </Card>
          <Card>
            <h4 className="font-semibold mb-1">Who must file?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Self-employed earning &gt; £1,000</li>
              <li>• Untaxed income &gt; £2,500</li>
              <li>• Income &gt; £150,000</li>
              <li>• Receive Child Benefit + earn &gt; £60k</li>
              <li>• Capital gains above the £3,000 allowance</li>
              <li>• Higher-rate taxpayer claiming pension/Gift Aid relief</li>
            </ul>
          </Card>
        </div>
      </Section>

      <style>{`.ipt{width:100%;font-size:13px;padding:6px 8px;border:1px solid var(--border);border-radius:6px;background:var(--background);color:var(--foreground);}`}</style>
    </div>
  );
}

function SAList({
  title, helper, listKey, entries, total, onAdd, onUpd, onDel,
}: {
  title: string;
  helper: string;
  listKey: ListKey;
  entries: SAEntry[];
  total: number;
  onAdd: () => void;
  onUpd: (id: string, p: Partial<SAEntry>) => void;
  onDel: (id: string) => void;
}) {
  return (
    <Section
      title={title}
      description={helper}
      action={
        <button onClick={onAdd} className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      }
    >
      <DetailTable
        empty={`No ${title.toLowerCase()} recorded yet.`}
        columns={[
          { key: "date", header: "Date", render: (r: any) => <input type="date" className="ipt" value={r.date} onChange={(e) => onUpd(r.id, { date: e.target.value })} /> },
          { key: "desc", header: "Description", render: (r: any) => <input className="ipt" placeholder="e.g. Acme Ltd" value={r.description} onChange={(e) => onUpd(r.id, { description: e.target.value })} /> },
          { key: "amt", header: "Amount (£)", align: "right", render: (r: any) => <input type="number" className="ipt num" value={r.amount} onChange={(e) => onUpd(r.id, { amount: +e.target.value })} /> },
          { key: "notes", header: "Notes", render: (r: any) => <input className="ipt" placeholder="optional" value={r.notes ?? ""} onChange={(e) => onUpd(r.id, { notes: e.target.value })} /> },
          { key: "x", header: "", render: (r: any) => <button onClick={() => onDel(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button> },
        ]}
        rows={entries}
        footer={
          <tr>
            <td className="px-3 py-2.5" colSpan={2}>Total</td>
            <td className="px-3 py-2.5 text-right num font-semibold">{fmtGBP(total)}</td>
            <td colSpan={2}></td>
          </tr>
        }
      />
    </Section>
  );
}

function SACard({
  title, entries, onAdd, onUpd, onDel, placeholder,
}: {
  title: string;
  entries: SAEntry[];
  onAdd: () => void;
  onUpd: (id: string, p: Partial<SAEntry>) => void;
  onDel: (id: string) => void;
  placeholder?: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm">{title}</h4>
        <button onClick={onAdd} className="text-xs text-primary hover:underline inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No entries yet.</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map((e) => (
            <div key={e.id} className="grid grid-cols-[1fr_110px_30px] gap-1.5 items-center">
              <input className="ipt" placeholder={placeholder} value={e.description} onChange={(ev) => onUpd(e.id, { description: ev.target.value })} />
              <input type="number" className="ipt num" value={e.amount} onChange={(ev) => onUpd(e.id, { amount: +ev.target.value })} />
              <button onClick={() => onDel(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 text-xs text-muted-foreground text-right">Subtotal: <span className="font-semibold text-foreground">{fmtGBP(sum(entries))}</span></div>
    </Card>
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
function KV({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className={`font-display text-lg font-semibold num ${accent ? "text-primary" : ""}`}>{v}</div>
    </div>
  );
}
