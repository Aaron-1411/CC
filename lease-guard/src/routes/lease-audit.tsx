import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  FileText,
  Loader2,
  RotateCcw,
  Upload,
  User,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { SiteNav } from "@/components/SiteNav";
import {
  analyzeLease,
  analyzeLandlordLease,
  type LeaseAnalysis,
  type LandlordAnalysis,
} from "@/lib/lease.functions";

export const Route = createFileRoute("/lease-audit")({
  head: () => ({
    meta: [
      { title: "Lease Audit — UK Lease & Tenancy Risk Analysis | LeaseSense Pro" },
      {
        name: "description",
        content:
          "Paste a UK commercial lease or residential tenancy agreement and get an instant risk report — for tenants or landlords.",
      },
    ],
  }),
  component: LeaseAuditPage,
});

type Mode = "tenant" | "landlord";

const SAMPLE_COMMERCIAL = `LEASE OF UNIT 4B, LONGCROSS BUSINESS PARK, MANCHESTER

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

const SAMPLE_AST = `ASSURED SHORTHOLD TENANCY AGREEMENT

LANDLORD: Sarah Thompson, 22 Oak Lane, Bristol BS1 4PQ
TENANT: James Carter
PROPERTY: Flat 3, 17 Elm Street, Bristol BS2 9LK
TERM: 12 months from 1 June 2024 to 31 May 2025
RENT: £1,200 per calendar month, payable in advance on the 1st of each month
DEPOSIT: £1,800 (equivalent to 1.5 months' rent). Landlord states deposit will be registered with a Government-approved scheme within 30 days.
PERMITTED USE: Residential occupation by the Tenant only. No subletting permitted.
REPAIRS: Landlord responsible for structure, roof, exterior, and all installations for supply of water, gas, electricity and sanitation. Tenant responsible for internal decorative order.
NOTICE: Tenant may give 2 months written notice after 6 months. Landlord may serve Section 21 notice after 6 months, giving 2 months notice.
PETS: Not permitted without prior written consent.
ALTERATIONS: No alterations permitted without landlord's written consent.
GAS SAFETY: Landlord states valid Gas Safety Certificate provided.
EPC: Landlord states EPC rating of D provided.
ELECTRICAL: No EICR mentioned.`;

function LeaseAuditPage() {
  const [mode, setMode] = useState<Mode>("tenant");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();

  const tenantFn = useServerFn(analyzeLease);
  const landlordFn = useServerFn(analyzeLandlordLease);

  const tenantMutation = useMutation({
    mutationFn: (payload: { leaseText: string; fileName?: string }) =>
      tenantFn({ data: payload }),
    onError: (err: Error) => toast.error(err.message ?? "Analysis failed"),
  });

  const landlordMutation = useMutation({
    mutationFn: (payload: { leaseText: string; fileName?: string }) =>
      landlordFn({ data: payload }),
    onError: (err: Error) => toast.error(err.message ?? "Analysis failed"),
  });

  const mutation = mode === "tenant" ? tenantMutation : landlordMutation;

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
      toast.message("PDFs aren't OCR'd in-browser. Copy the lease text and paste it below.");
      return;
    }
    const txt = await file.text();
    setText(txt);
  }, []);

  const handleSample = () => {
    setText(mode === "tenant" ? SAMPLE_COMMERCIAL : SAMPLE_AST);
    setFileName(mode === "tenant" ? "sample_commercial.txt" : "sample_ast.txt");
  };

  const handleReset = () => {
    tenantMutation.reset();
    landlordMutation.reset();
    setText("");
    setFileName(undefined);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    handleReset();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />
      <SiteNav />

      {/* MODE SWITCHER */}
      {!mutation.isSuccess && (
        <div className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-6 py-3">
            <span className="mr-4 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
              I am a
            </span>
            <ModeButton
              active={mode === "tenant"}
              onClick={() => handleModeChange("tenant")}
              icon={User}
              label="Tenant / Occupier"
            />
            <ModeButton
              active={mode === "landlord"}
              onClick={() => handleModeChange("landlord")}
              icon={Building2}
              label="Landlord / Lessor"
            />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 py-10">
        {!mutation.isSuccess ? (
          <IngestPanel
            mode={mode}
            text={text}
            setText={setText}
            fileName={fileName}
            onFile={handleFile}
            onSubmit={handleSubmit}
            onSample={handleSample}
            isLoading={mutation.isPending}
          />
        ) : mode === "tenant" ? (
          <ResultsSection analysis={tenantMutation.data as LeaseAnalysis} onReset={handleReset} />
        ) : (
          <LandlordResultsSection analysis={landlordMutation.data as LandlordAnalysis} onReset={handleReset} />
        )}
      </main>

      <footer className="mt-20 border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Confidential lease review · Not legal advice — confirm material findings with a qualified solicitor.</span>
        </div>
      </footer>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
        active
          ? "bg-foreground text-background"
          : "border border-border bg-background text-foreground hover:border-foreground"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function IngestPanel({
  mode,
  text,
  setText,
  fileName,
  onFile,
  onSubmit,
  onSample,
  isLoading,
}: {
  mode: Mode;
  text: string;
  setText: (s: string) => void;
  fileName?: string;
  onFile: (f: File) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSample: () => void;
  isLoading: boolean;
}) {
  const isTenant = mode === "tenant";
  return (
    <div className="grid gap-10 py-6 lg:grid-cols-12">
      <section className="lg:col-span-5 animate-reveal">
        <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
          {isTenant ? "Commercial lease review · Tenant-side analysis" : "Tenancy agreement review · Landlord-side audit"}
        </span>
        <h2 className="mt-3 font-display text-5xl leading-[1.05] tracking-tight">
          {isTenant ? (
            <>Your lease,<br /><span className="text-muted-foreground">decoded in 60 seconds.</span></>
          ) : (
            <>Your tenancy,<br /><span className="text-muted-foreground">bulletproofed.</span></>
          )}
        </h2>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
          {isTenant
            ? "Paste your UK commercial lease. Get an Executive Pulse on your total commitment, a ranked heatmap of risky clauses, your projected dilapidations exit cost, and negotiation moves — in plain English."
            : "Paste a residential AST or commercial lease. Get a landlord-side compliance audit: deposit protection, notice validity, repair obligations, prohibited fees, and what a court would say about each clause."}
        </p>
        <ul className="mt-10 space-y-3 text-sm">
          {(isTenant
            ? [
                "What you'll actually pay across the term",
                "The exit cost most tenants only discover at year 9",
                "Break-clause traps and conditional-notice flags",
                "What to push back on before you sign",
              ]
            : [
                "Deposit scheme compliance and prescribed information",
                "Section 21 / Section 8 notice validity",
                "Prohibited fees under the Tenant Fees Act 2019",
                "Repair and licensing obligations you may be missing",
              ]
          ).map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span className="mt-[7px] block h-1 w-3 shrink-0 bg-foreground" />
              <span className="text-foreground/80">{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={onSubmit} className="lg:col-span-7 animate-reveal [animation-delay:120ms]">
        <div className="border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
              {isTenant ? "Lease Document" : "Tenancy Agreement"}
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
            placeholder={
              isTenant
                ? "Paste the full lease text here — clauses on rent, repair, break, alienation, service charge…"
                : "Paste the AST or tenancy agreement here — rent, deposit, notice periods, repair, permitted use…"
            }
            className="h-[420px] w-full resize-none bg-transparent p-5 font-mono-ui text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
            spellCheck={false}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/40 px-5 py-3">
            <div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
              <FileText className="h-3 w-3" />
              {fileName ?? "no file"} · {text.length.toLocaleString()} chars
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSample}
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Load sample
              </button>
              <button
                type="submit"
                disabled={isLoading || text.trim().length < 50}
                className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? (
                  <><Loader2 className="h-3 w-3 animate-spin" />Auditing</>
                ) : (
                  <>Run {isTenant ? "Risk" : "Compliance"} Audit <ArrowRight className="h-3 w-3" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="mt-4 border border-border bg-surface px-5 py-4 font-mono-ui text-[11px] text-muted-foreground">
            <span className="text-foreground">›</span>{" "}
            {isTenant
              ? "Cross-referencing covenants · modelling dilapidations exposure · scanning for omissions…"
              : "Checking deposit compliance · reviewing notice validity · scanning for prohibited fees…"}
          </div>
        )}
      </form>
    </div>
  );
}

/* ── TENANT RESULTS ── */
function ResultsSection({ analysis, onReset }: { analysis: LeaseAnalysis; onReset: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, []);
  return (
    <div ref={ref} className="scroll-mt-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">Tenant-side analysis</span>
          <h2 className="font-display text-2xl tracking-tight">Lease Risk Report</h2>
        </div>
        <button onClick={onReset} className="inline-flex items-center gap-2 border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-widest hover:border-foreground">
          <RotateCcw className="h-3 w-3" /> New Analysis
        </button>
      </div>
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
      <div className="col-span-12 space-y-12 lg:col-span-8">
        <ExecutivePulseCard analysis={analysis} />

        <section className="animate-reveal [animation-delay:80ms]">
          <SectionHeader title="Risk Heatmap" meta={`${analysis.anomaliesDetected} anomalies detected`} />
          <div className="space-y-3">
            {sortedGotchas.map((g, i) => <GotchaRow key={i} g={g} />)}
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
                <BodyCell className="col-span-5 italic text-muted-foreground">{row.plainEnglish}</BodyCell>
                <BodyCell className="col-span-3 font-bold">{row.financialImpact}</BodyCell>
              </RowGroup>
            ))}
          </div>
        </section>
      </div>

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
            <div className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            <div className="mt-2 font-display text-lg tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GotchaRow({ g }: { g: LeaseAnalysis["gotchas"][number] }) {
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
          <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.chip}`}>
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

function DilapidationsCard({ d }: { d: LeaseAnalysis["dilapidations"] }) {
  return (
    <div className="bg-risk-critical p-6 text-white">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="font-mono-ui text-[10px] font-bold uppercase tracking-widest">Exit Exposure Warning</span>
      </div>
      <h3 className="mb-2 font-display text-4xl tracking-tight">{d.headlineEstimate}</h3>
      <p className="text-xs leading-relaxed opacity-90">{d.rationale}</p>
      <div className="mt-4 border-t border-white/20 pt-3 font-mono-ui text-[10px] uppercase tracking-widest opacity-80">
        Schedule of Condition:{" "}
        <span className="font-bold">{d.scheduleOfConditionPresent ? "Present ✓" : "MISSING ✗"}</span>
      </div>
    </div>
  );
}

function NegotiationCard({ n }: { n: LeaseAnalysis["negotiation"] }) {
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
      <span className={`mb-1 block text-[10px] font-bold uppercase tracking-widest ${accent ? "text-accent" : "text-muted-foreground"}`}>
        {label}
      </span>
      <p className="text-sm font-medium leading-snug">{value}</p>
    </div>
  );
}

function CommitmentCard({ analysis }: { analysis: LeaseAnalysis }) {
  return (
    <div className="border border-border bg-foreground p-6 text-background">
      <span className="font-mono-ui text-[10px] uppercase tracking-widest opacity-70">Total Commitment</span>
      <div className="mt-2 font-display text-3xl tracking-tight">{analysis.executivePulse.estimatedTotalLiability}</div>
      <p className="mt-3 text-xs opacity-80">
        Across {analysis.executivePulse.leaseTerm}, before service charge variability and dilapidations.
      </p>
    </div>
  );
}

/* ── LANDLORD RESULTS ── */
function LandlordResultsSection({ analysis, onReset }: { analysis: LandlordAnalysis; onReset: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, []);

  const sorted = [...analysis.complianceFlags].sort((a, b) => {
    const order = { BREACH: 0, RISK: 1, NOTE: 2 } as const;
    return order[a.severity] - order[b.severity];
  });

  return (
    <div ref={ref} className="scroll-mt-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">Landlord-side analysis</span>
          <h2 className="font-display text-2xl tracking-tight">Tenancy Compliance Audit</h2>
        </div>
        <button onClick={onReset} className="inline-flex items-center gap-2 border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-widest hover:border-foreground">
          <RotateCcw className="h-3 w-3" /> New Analysis
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-10 lg:col-span-8">
          {/* Overview */}
          <section>
            <SectionHeader title="Compliance Overview" />
            <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-3">
              {[
                { label: "Overall Status", value: analysis.overview.overallStatus },
                { label: "Tenancy Type", value: analysis.overview.tenancyType },
                { label: "Deposit Protected", value: analysis.overview.depositProtected ? "Yes ✓" : "Not confirmed ✗" },
                { label: "Section 21 Valid", value: analysis.overview.section21Valid ? "Valid ✓" : "Risk flagged ✗" },
                { label: "Critical Issues", value: String(analysis.overview.criticalIssueCount) },
                { label: "EPC / Gas / EICR", value: analysis.overview.safetyDocs },
              ].map((s) => (
                <div key={s.label} className="bg-surface p-4">
                  <div className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                  <div className="mt-2 font-display text-lg tracking-tight">{s.value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Compliance flags */}
          <section>
            <SectionHeader title="Compliance Flags" meta={`${analysis.complianceFlags.length} items`} />
            <div className="space-y-3">
              {sorted.map((f, i) => {
                const tone =
                  f.severity === "BREACH"
                    ? { bar: "bg-risk-critical", chip: "bg-risk-critical/10 text-risk-critical" }
                    : f.severity === "RISK"
                      ? { bar: "bg-risk-caution", chip: "bg-risk-caution/10 text-risk-caution" }
                      : { bar: "bg-risk-safe", chip: "bg-risk-safe/10 text-risk-safe" };
                return (
                  <div key={i} className="flex items-stretch gap-4 border border-border bg-surface p-4">
                    <div className={`w-1 shrink-0 ${tone.bar}`} />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.chip}`}>
                          {f.severity}
                        </span>
                        <span className="font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground">
                          {f.category}
                        </span>
                      </div>
                      <h3 className="text-base font-bold leading-tight">{f.title}</h3>
                      <p className="mt-1.5 max-w-[68ch] text-sm text-muted-foreground">{f.explanation}</p>
                      {f.action && (
                        <p className="mt-2 text-[11px] font-semibold text-foreground">Action: {f.action}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="col-span-12 space-y-6 lg:col-span-4">
          {/* Obligations checklist */}
          <div className="border border-border bg-surface p-6">
            <h3 className="mb-4 border-b border-border pb-3 text-sm font-bold uppercase tracking-widest">
              Landlord Obligations Checklist
            </h3>
            <div className="space-y-2">
              {analysis.obligationsChecklist.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 shrink-0 text-base ${item.met ? "text-risk-safe" : "text-risk-critical"}`}>
                    {item.met ? "✓" : "✗"}
                  </span>
                  <div>
                    <span className="font-medium">{item.obligation}</span>
                    {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended actions */}
          <div className="border border-border bg-foreground p-6 text-background">
            <span className="font-mono-ui text-[10px] uppercase tracking-widest opacity-70">Priority Actions</span>
            <div className="mt-4 space-y-4">
              {analysis.priorityActions.map((a, i) => (
                <div key={i}>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">#{i + 1}</div>
                  <p className="mt-1 text-sm font-medium">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ── shared helpers ── */
function SectionHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between border-b border-foreground pb-2">
      <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
      {meta && <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">{meta}</span>}
    </div>
  );
}

function HeaderCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-background p-3 font-mono-ui text-[10px] font-bold uppercase tracking-widest text-muted-foreground ${className}`}>
      {children}
    </div>
  );
}

function BodyCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-surface p-3 text-xs ${className}`}>{children}</div>;
}

function RowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
