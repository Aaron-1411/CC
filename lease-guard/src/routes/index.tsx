import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { analyzeLease, type LeaseAnalysis } from "@/lib/lease.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lease Audit — Instant UK Commercial Lease Risk Report" },
      {
        name: "description",
        content:
          "Paste your UK commercial lease and receive an instant risk report: rent commitment, dilapidations exit cost, and the clauses that matter — provided by your advisor.",
      },
    ],
  }),
  component: Index,
});

const SAMPLE_LEASE = `LEASE OF UNIT 4B, LONGCROSS BUSINESS PARK, MANCHESTER

PARTIES: Longcross Estates Ltd ("Landlord") and the Tenant.
TERM: 10 years from 24 March 2024 ("Term Commencement Date") expiring 23 March 2034.
RENT: £48,000 per annum exclusive of VAT, payable quarterly in advance.
SERVICE CHARGE: Tenant's fair proportion of the Landlord's costs of maintaining the Estate. No cap is specified.
RENT REVIEW: Upward only on the 5th anniversary, by reference to open market rent.
ALIENATION (Cl 8): Underletting of part not permitted. Assignment of whole permitted with Landlord's consent (such consent subject to AGA).
REPAIR (Cl 14): The Tenant shall keep the Premises in good and substantial repair and condition and shall yield up the same in such state at the Term end. No Schedule of Condition is attached.
REINSTATEMENT (Cl 14.3): Tenant to remove all alterations and partitions on expiry.
BREAK CLAUSE (Cl 21): Tenant may break on 24 March 2029 by 9 months' written notice, conditional on (a) vacant possession, (b) full compliance with all tenant covenants, and (c) payment of a sum equal to 6 months' rent.
INSURANCE: Landlord insures, Tenant reimburses 100%.
1954 ACT: Sections 24-28 excluded.`;

function Index() {
  const analyzeFn = useServerFn(analyzeLease);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();

  const mutation = useMutation({
    mutationFn: (payload: { leaseText: string; fileName?: string }) =>
      analyzeFn({ data: payload }),
    onError: (err: Error) => toast.error(err.message ?? "Analysis failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 50) {
      toast.error("Paste a longer extract — at least a few clauses.");
      return;
    }
    mutation.mutate({ leaseText: trimmed, fileName });
  };

  const handleFile = useCallback(async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("File too large — paste the lease text instead (max 4 MB).");
      return;
    }
    setFileName(file.name);
    if (file.type === "application/pdf") {
      toast.message(
        "PDFs aren't OCR'd in-browser. Copy the lease text and paste it below.",
      );
      return;
    }
    const txt = await file.text();
    setText(txt);
  }, []);

  const handleSample = () => {
    setText(SAMPLE_LEASE);
    setFileName("sample_unit_4b.txt");
  };

  const handleReset = () => {
    mutation.reset();
    setText("");
    setFileName(undefined);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />
      <Header
        analysis={mutation.data}
        showReset={mutation.isSuccess}
        onReset={handleReset}
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {!mutation.isSuccess ? (
          <IngestPanel
            text={text}
            setText={setText}
            fileName={fileName}
            onFile={handleFile}
            onSubmit={handleSubmit}
            onSample={handleSample}
            isLoading={mutation.isPending}
          />
        ) : (
          <ResultsSection analysis={mutation.data} />
        )}
      </main>

      <Footer />
    </div>
  );
}

/* ---------------- HEADER ---------------- */
function Header({
  analysis,
  showReset,
  onReset,
}: {
  analysis?: LeaseAnalysis;
  showReset: boolean;
  onReset: () => void;
}) {
  return (
    <nav className="border-b border-border bg-background/85">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-6 py-4">
        <div className="flex flex-col">
          <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
            {analysis?.executivePulse.sourceFile
              ? `File: ${analysis.executivePulse.sourceFile}`
              : "UK Commercial Lease Audit"}
          </span>
          <h1 className="text-xl font-extrabold tracking-tight">
            LEASESENSE PRO{" "}
            <span className="font-normal text-muted-foreground">/</span>{" "}
            <span className="text-muted-foreground">RISK ANALYSIS</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-end gap-8">
          {analysis ? (
            <>
              <PulseStat label="Annual Rent" value={analysis.executivePulse.annualRent} />
              <PulseStat label="Next Break" value={analysis.executivePulse.criticalWindow} />
              <PulseStat
                label="Risk Index"
                value={analysis.executivePulse.riskIndex}
                tone={
                  analysis.executivePulse.riskIndex === "CRITICAL"
                    ? "critical"
                    : analysis.executivePulse.riskIndex === "CAUTION"
                      ? "caution"
                      : "safe"
                }
              />
            </>
          ) : (
            <PulseStat label="Status" value="AWAITING DOCUMENT" />
          )}
          {showReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-widest hover:border-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              New Analysis
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function PulseStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "critical" | "caution" | "safe";
}) {
  const toneClass =
    tone === "critical"
      ? "text-risk-critical"
      : tone === "caution"
        ? "text-risk-caution"
        : tone === "safe"
          ? "text-risk-safe"
          : "text-foreground";
  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={`font-display text-xl tracking-tight ${toneClass}`}>{value}</span>
    </div>
  );
}

/* ---------------- INGEST ---------------- */
function IngestPanel({
  text,
  setText,
  fileName,
  onFile,
  onSubmit,
  onSample,
  isLoading,
}: {
  text: string;
  setText: (s: string) => void;
  fileName?: string;
  onFile: (f: File) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSample: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-10 py-6 lg:grid-cols-12">
      <section className="lg:col-span-5 animate-reveal">
        <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
          Confidential lease review · Provided by your advisor
        </span>
        <h2 className="mt-3 font-display text-5xl leading-[1.05] tracking-tight">
          Your lease,
          <br />
          <span className="text-muted-foreground">decoded in 60 seconds.</span>
        </h2>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
          Paste your UK commercial lease below. You'll receive an Executive Pulse on
          your total commitment, a ranked heatmap of the clauses that hit your bank
          account, your projected dilapidations exit cost, and the negotiation moves
          to take to the landlord — all in plain English.
        </p>

        <ul className="mt-10 space-y-3 text-sm">
          {[
            "What you'll actually pay across the term",
            "The exit cost most tenants only discover at year 9",
            "Break-clause traps and conditional-notice flags",
            "What to push back on before you sign",
          ].map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span className="mt-[7px] block h-1 w-3 shrink-0 bg-foreground" />
              <span className="text-foreground/80">{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <form
        onSubmit={onSubmit}
        className="lg:col-span-7 animate-reveal [animation-delay:120ms]"
      >
        <div className="border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
              Lease Document
            </span>
            <label className="inline-flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground hover:text-accent">
              <Upload className="h-3 w-3" />
              Upload .txt
              <input
                type="file"
                accept=".txt,.md,.pdf,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
            </label>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full lease text here — clauses on rent, repair, break, alienation, service charge…"
            className="h-[420px] w-full resize-none bg-transparent p-5 font-mono-ui text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
            spellCheck={false}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/40 px-5 py-3">
            <div className="flex items-center gap-2 text-[10px] font-mono-ui uppercase tracking-widest text-muted-foreground">
              <FileText className="h-3 w-3" />
              {fileName ?? "no file"} · {text.length.toLocaleString()} chars
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSample}
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Load sample lease
              </button>
              <button
                type="submit"
                disabled={isLoading || text.trim().length < 50}
                className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Auditing
                  </>
                ) : (
                  <>
                    Run Risk Audit <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="mt-4 border border-border bg-surface px-5 py-4 font-mono-ui text-[11px] text-muted-foreground">
            <span className="text-foreground">›</span> Cross-referencing covenants ·
            modelling dilapidations exposure · scanning for omissions…
          </div>
        )}
      </form>
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */
function ResultsSection({ analysis }: { analysis: LeaseAnalysis }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  return (
    <div ref={ref} className="scroll-mt-24">
      <AnalysisDashboard analysis={analysis} />
    </div>
  );
}

function AnalysisDashboard({ analysis }: { analysis: LeaseAnalysis }) {
  const sortedGotchas = [...analysis.gotchas].sort((a, b) => {
    const order = { CRITICAL: 0, CAUTION: 1, STANDARD: 2 } as const;
    return order[a.risk] - order[b.risk];
  });

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* LEFT */}
      <div className="col-span-12 space-y-12 lg:col-span-8">
        <ExecutivePulseCard analysis={analysis} />

        <section className="animate-reveal [animation-delay:80ms]">
          <SectionHeader
            title="Risk Heatmap"
            meta={`${analysis.anomaliesDetected} anomalies detected`}
          />
          <div className="space-y-3">
            {sortedGotchas.map((g, i) => (
              <GotchaRow key={i} g={g} />
            ))}
          </div>
        </section>

        <section className="animate-reveal [animation-delay:160ms]">
          <SectionHeader title="Plain English Translation" />
          <div className="grid grid-cols-12 gap-px border border-border bg-border">
            <HeaderCell className="col-span-4">Legal Provision</HeaderCell>
            <HeaderCell className="col-span-5">SME Interpretation</HeaderCell>
            <HeaderCell className="col-span-3">P&amp;L Impact</HeaderCell>
            {analysis.translationTable.map((row, i) => (
              <RowGroup key={i}>
                <BodyCell className="col-span-4 font-medium">{row.legalTerm}</BodyCell>
                <BodyCell className="col-span-5 italic text-muted-foreground">
                  {row.plainEnglish}
                </BodyCell>
                <BodyCell className="col-span-3 font-bold">{row.financialImpact}</BodyCell>
              </RowGroup>
            ))}
          </div>
        </section>
      </div>

      {/* RIGHT */}
      <aside className="col-span-12 space-y-6 lg:col-span-4 animate-reveal [animation-delay:240ms]">
        <DilapidationsCard d={analysis.dilapidations} />
        <NegotiationCard n={analysis.negotiation} />
        <CommitmentCard analysis={analysis} />
      </aside>
    </div>
  );
}

function ExecutivePulseCard({ analysis }: { analysis: LeaseAnalysis }) {
  const p = analysis.executivePulse;
  return (
    <section className="animate-reveal">
      <SectionHeader title="Executive Pulse" meta="Top-line commitment" />
      <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
        {[
          { label: "Annual Rent", value: p.annualRent },
          { label: "Service Charge", value: p.serviceCharge },
          { label: "VAT Status", value: p.vatStatus },
          { label: "Term", value: p.leaseTerm },
          { label: "Start", value: p.startDate },
          { label: "End", value: p.endDate },
          { label: "Critical Window", value: p.criticalWindow },
          { label: "Total Liability", value: p.estimatedTotalLiability },
        ].map((s) => (
          <div key={s.label} className="bg-surface p-4">
            <div className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-2 font-display text-lg tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GotchaRow({
  g,
}: {
  g: LeaseAnalysis["gotchas"][number];
}) {
  const tone =
    g.risk === "CRITICAL"
      ? { bar: "bg-risk-critical", chip: "bg-risk-critical/10 text-risk-critical" }
      : g.risk === "CAUTION"
        ? { bar: "bg-risk-caution", chip: "bg-risk-caution/10 text-risk-caution" }
        : { bar: "bg-risk-safe", chip: "bg-risk-safe/10 text-risk-safe" };
  return (
    <div className="group flex items-stretch gap-4 border border-border bg-surface p-4 transition-colors hover:border-foreground">
      <div className={`w-1 shrink-0 ${tone.bar}`} />
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span
            className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.chip}`}
          >
            {g.risk}
          </span>
          <span className="font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground">
            {g.category} · {g.clauseRef}
          </span>
        </div>
        <h3 className="text-base font-bold leading-tight">{g.title}</h3>
        <p className="mt-1.5 max-w-[68ch] text-sm text-muted-foreground">{g.soWhat}</p>
      </div>
    </div>
  );
}

function DilapidationsCard({
  d,
}: {
  d: LeaseAnalysis["dilapidations"];
}) {
  return (
    <div className="bg-risk-critical p-6 text-white">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="font-mono-ui text-[10px] font-bold uppercase tracking-widest">
          Exit Exposure Warning
        </span>
      </div>
      <h3 className="mb-2 font-display text-4xl tracking-tight">{d.headlineEstimate}</h3>
      <p className="text-xs leading-relaxed opacity-90">{d.rationale}</p>
      <div className="mt-4 border-t border-white/20 pt-3 text-[10px] font-mono-ui uppercase tracking-widest opacity-80">
        Schedule of Condition:{" "}
        <span className="font-bold">
          {d.scheduleOfConditionPresent ? "Present ✓" : "MISSING ✗"}
        </span>
      </div>
    </div>
  );
}

function NegotiationCard({
  n,
}: {
  n: LeaseAnalysis["negotiation"];
}) {
  return (
    <div className="border border-border bg-surface p-6">
      <h3 className="mb-4 border-b border-border pb-3 text-sm font-bold uppercase tracking-widest">
        Negotiation Strategy
      </h3>
      <div className="space-y-5">
        <Move label="Quick Win" value={n.shortTermWin} />
        <div className="border-l-2 border-accent bg-muted px-3 py-2">
          <Move label="Protective Move" value={n.protectiveMove} accent />
        </div>
        <Move label="Exit Move" value={n.exitMove} />
      </div>
    </div>
  );
}

function Move({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <span
        className={`mb-1 block text-[10px] font-bold uppercase tracking-widest ${accent ? "text-accent" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <p className="text-sm font-medium leading-snug">{value}</p>
    </div>
  );
}

function CommitmentCard({ analysis }: { analysis: LeaseAnalysis }) {
  return (
    <div className="border border-border bg-foreground p-6 text-background">
      <span className="font-mono-ui text-[10px] uppercase tracking-widest opacity-70">
        Total Commitment
      </span>
      <div className="mt-2 font-display text-3xl tracking-tight">
        {analysis.executivePulse.estimatedTotalLiability}
      </div>
      <p className="mt-3 text-xs opacity-80">
        Across {analysis.executivePulse.leaseTerm}, before service charge variability and
        dilapidations.
      </p>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function SectionHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between border-b border-foreground pb-2">
      <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
      {meta && (
        <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
          {meta}
        </span>
      )}
    </div>
  );
}

function HeaderCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-background p-3 font-mono-ui text-[10px] font-bold uppercase tracking-widest text-muted-foreground ${className}`}
    >
      {children}
    </div>
  );
}
function BodyCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`bg-surface p-3 text-xs ${className}`}>{children}</div>;
}
function RowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/* ---------------- footer ---------------- */
function Footer() {
  return (
    <footer className="mt-20 border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-[10px] font-mono-ui uppercase tracking-widest text-muted-foreground">
        <span>Confidential lease review · Not legal advice — confirm material findings with a qualified solicitor.</span>
        <Link
          to="/for-firms"
          className="inline-flex items-center gap-1.5 border border-border bg-surface px-3 py-2 text-foreground hover:border-foreground"
        >
          For agents & solicitors <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </footer>
  );
}
