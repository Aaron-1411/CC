import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Building2, Copy, Loader2, RotateCcw, User } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { SiteNav } from "@/components/SiteNav";
import {
  generateComplaintLetter,
  type ComplaintInput,
  type ComplaintOutput,
} from "@/lib/complaint.functions";

export const Route = createFileRoute("/agent-rater")({
  head: () => ({
    meta: [
      { title: "Agent Complaint Letters — Know Your Rights | LeaseSense Pro" },
      {
        name: "description",
        content:
          "Describe your issue with a letting agent and get an AI-drafted formal complaint letter pre-filled with your statutory rights — ready to send.",
      },
    ],
  }),
  component: AgentRaterPage,
});

type Mode = "tenant" | "landlord";

const TENANT_CATEGORIES: { value: ComplaintInput["issueCategory"]; label: string; description: string }[] = [
  { value: "repairs_ignored", label: "Repairs Ignored", description: "Agent/landlord failing to carry out required repairs" },
  { value: "deposit_dispute", label: "Deposit Dispute", description: "Unfair or unlawful deductions from your deposit" },
  { value: "illegal_fees", label: "Illegal Fees", description: "Charges prohibited under the Tenant Fees Act 2019" },
  { value: "harassment", label: "Harassment", description: "Interference with your right to quiet enjoyment" },
  { value: "entry_without_notice", label: "Entry Without Notice", description: "Agent or landlord entering without 24 hours notice" },
  { value: "unsafe_property", label: "Unsafe Property", description: "Hazardous conditions, damp, mould, or safety failures" },
  { value: "referencing_delay", label: "Referencing Delay", description: "Unreasonable delay in the referencing process" },
  { value: "other", label: "Other Issue", description: "Any other complaint about agent conduct" },
];

const LANDLORD_CATEGORIES: { value: ComplaintInput["issueCategory"]; label: string; description: string }[] = [
  { value: "rent_not_passed", label: "Rent Not Passed On", description: "Agent collecting rent but not remitting it to you" },
  { value: "undisclosed_commissions", label: "Secret Commissions", description: "Undisclosed payments from contractors or referrals" },
  { value: "client_money_mishandling", label: "Client Money Issue", description: "Mishandling of your funds or CMP breach" },
  { value: "poor_marketing", label: "Poor Marketing", description: "Inadequate marketing leading to void periods" },
  { value: "failed_inspections", label: "Failed Inspections", description: "Agent not carrying out agreed property inspections" },
  { value: "poor_maintenance_management", label: "Maintenance Failures", description: "Poor contractor management or overcharging" },
  { value: "breach_of_management_agreement", label: "Contract Breach", description: "Failure to honour management agreement terms" },
  { value: "other", label: "Other Issue", description: "Any other complaint about agent conduct" },
];

const DEFAULT_FORM: ComplaintInput = {
  mode: "tenant",
  agentName: "",
  agentAddress: "",
  yourName: "",
  propertyAddress: "",
  issueCategory: "repairs_ignored",
  issueDescription: "",
  dateIssueStarted: "",
  previousContactMade: false,
  desiredOutcome: "",
};

function AgentRaterPage() {
  const [form, setForm] = useState<ComplaintInput>(DEFAULT_FORM);
  const generateFn = useServerFn(generateComplaintLetter);

  const mutation = useMutation({
    mutationFn: (data: ComplaintInput) => generateFn({ data }),
    onError: (err: Error) => toast.error(err.message ?? "Letter generation failed"),
  });

  const handleModeChange = (mode: Mode) => {
    setForm({
      ...DEFAULT_FORM,
      mode,
      issueCategory: mode === "tenant" ? "repairs_ignored" : "rent_not_passed",
    });
    mutation.reset();
  };

  const set = <K extends keyof ComplaintInput>(key: K, value: ComplaintInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agentName.trim() || !form.yourName.trim() || !form.propertyAddress.trim()) {
      toast.error("Please fill in your name, the agent name, and the property address.");
      return;
    }
    if (form.issueDescription.trim().length < 20) {
      toast.error("Please describe the issue in more detail.");
      return;
    }
    mutation.mutate(form);
  };

  const handleReset = () => {
    mutation.reset();
    setForm(DEFAULT_FORM);
  };

  const mode = form.mode ?? "tenant";
  const categories = mode === "tenant" ? TENANT_CATEGORIES : LANDLORD_CATEGORIES;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />
      <SiteNav />

      {!mutation.isSuccess && (
        <div className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-6 py-3">
            <span className="mr-4 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
              I am a
            </span>
            <ModeButton active={mode === "tenant"} onClick={() => handleModeChange("tenant")} icon={User} label="Tenant" />
            <ModeButton active={mode === "landlord"} onClick={() => handleModeChange("landlord")} icon={Building2} label="Landlord" />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 py-10">
        {!mutation.isSuccess ? (
          <FormPanel
            form={form}
            set={set}
            onSubmit={handleSubmit}
            isLoading={mutation.isPending}
            categories={categories}
            mode={mode}
          />
        ) : (
          <LetterPanel result={mutation.data} onReset={handleReset} mode={mode} />
        )}
      </main>

      <footer className="mt-20 border-t border-border px-6 py-8">
        <div className="mx-auto max-w-7xl font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
          Not legal advice · If your complaint is unresolved after 8 weeks, escalate to the agent's redress scheme.
        </div>
      </footer>
    </div>
  );
}

function ModeButton({
  active, onClick, icon: Icon, label,
}: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
        active ? "bg-foreground text-background" : "border border-border bg-background text-foreground hover:border-foreground"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function FormPanel({
  form,
  set,
  onSubmit,
  isLoading,
  categories,
  mode,
}: {
  form: ComplaintInput;
  set: <K extends keyof ComplaintInput>(key: K, value: ComplaintInput[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  categories: typeof TENANT_CATEGORIES;
  mode: Mode;
}) {
  const isTenant = mode === "tenant";
  return (
    <div className="grid gap-10 py-6 lg:grid-cols-12">
      <section className="lg:col-span-4 animate-reveal">
        <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
          {isTenant ? "Tenant Rights" : "Landlord Rights"} · Complaint Letters
        </span>
        <h2 className="mt-3 font-display text-5xl leading-[1.05] tracking-tight">
          Your rights,<br />
          <span className="text-muted-foreground">ready to send.</span>
        </h2>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          {isTenant
            ? "Describe what went wrong with your letting agent. We'll draft a formal complaint letter pre-filled with the relevant legislation — the Tenant Fees Act, Housing Act, and your right to quiet enjoyment."
            : "Describe how your agent has failed you. We'll draft a formal complaint letter citing the Consumer Rights Act, fiduciary duty, Client Money Protection rules, and your management agreement terms."}
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          {[
            "Statutory rights cited in full",
            "Agent's redress scheme identified",
            "Escalation path included",
            "Letter ready to copy and send",
          ].map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span className="mt-[7px] block h-1 w-3 shrink-0 bg-foreground" />
              <span className="text-foreground/80">{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={onSubmit} className="lg:col-span-8 animate-reveal [animation-delay:120ms]">
        <div className="space-y-6">
          {/* Issue category */}
          <FieldGroup label="What's the issue?">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => set("issueCategory", cat.value)}
                  className={`flex flex-col border p-3 text-left transition-colors ${
                    form.issueCategory === cat.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-surface hover:border-foreground"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">{cat.label}</span>
                  <span className={`mt-1 text-[10px] leading-tight ${form.issueCategory === cat.value ? "opacity-70" : "text-muted-foreground"}`}>
                    {cat.description}
                  </span>
                </button>
              ))}
            </div>
          </FieldGroup>

          {/* Names and addresses */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your Full Name *">
              <input
                type="text"
                value={form.yourName}
                onChange={(e) => set("yourName", e.target.value)}
                placeholder="Jane Smith"
                className={inputClass}
              />
            </Field>
            <Field label="Letting Agent / Landlord Name *">
              <input
                type="text"
                value={form.agentName}
                onChange={(e) => set("agentName", e.target.value)}
                placeholder="ABC Lettings Ltd"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Property Address *">
              <input
                type="text"
                value={form.propertyAddress}
                onChange={(e) => set("propertyAddress", e.target.value)}
                placeholder="Flat 3, 17 Elm Street, Bristol BS2 9LK"
                className={inputClass}
              />
            </Field>
            <Field label="Agent Address (optional)">
              <input
                type="text"
                value={form.agentAddress ?? ""}
                onChange={(e) => set("agentAddress", e.target.value)}
                placeholder="Agent's office address"
                className={inputClass}
              />
            </Field>
          </div>

          {/* Description */}
          <Field label="Describe the Issue *">
            <textarea
              value={form.issueDescription}
              onChange={(e) => set("issueDescription", e.target.value)}
              placeholder="Describe what happened, when it happened, and how it has affected you. Include any dates, amounts of money, and names of people involved."
              className={`${inputClass} h-36 resize-none`}
            />
            <span className="mt-1 block font-mono-ui text-[10px] text-muted-foreground">
              {form.issueDescription.length} / 3000 chars
            </span>
          </Field>

          {/* Secondary fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="When Did the Issue Start? (optional)">
              <input
                type="text"
                value={form.dateIssueStarted ?? ""}
                onChange={(e) => set("dateIssueStarted", e.target.value)}
                placeholder="e.g. January 2025"
                className={inputClass}
              />
            </Field>
            <Field label="Desired Outcome (optional)">
              <input
                type="text"
                value={form.desiredOutcome ?? ""}
                onChange={(e) => set("desiredOutcome", e.target.value)}
                placeholder="e.g. Full deposit returned, repairs completed"
                className={inputClass}
              />
            </Field>
          </div>

          {/* Previous contact */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("previousContactMade", !form.previousContactMade)}
              className={`h-5 w-5 border-2 transition-colors ${
                form.previousContactMade
                  ? "border-foreground bg-foreground"
                  : "border-border bg-surface hover:border-foreground"
              }`}
            >
              {form.previousContactMade && <span className="flex h-full items-center justify-center text-background text-[10px]">✓</span>}
            </button>
            <label
              className="cursor-pointer text-sm"
              onClick={() => set("previousContactMade", !form.previousContactMade)}
            >
              I have already contacted the agent about this issue
            </label>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-foreground px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <><Loader2 className="h-3 w-3 animate-spin" />Drafting Letter</>
              ) : (
                <>Draft Complaint Letter <ArrowRight className="h-3 w-3" /></>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function LetterPanel({ result, onReset, mode }: { result: ComplaintOutput; onReset: () => void; mode: Mode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.letter).then(() => {
      setCopied(true);
      toast.success("Letter copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
            {mode === "tenant" ? "Tenant complaint letter ready" : "Landlord complaint letter ready"}
          </span>
          <h2 className="font-display text-2xl tracking-tight">Your Formal Complaint</h2>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-widest hover:border-foreground"
        >
          <RotateCcw className="h-3 w-3" /> New Letter
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="col-span-12 lg:col-span-8">
          {/* Letter */}
          <div className="border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                Formal Complaint Letter
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground hover:text-accent"
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copied!" : "Copy Letter"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap p-6 font-mono-ui text-[12px] leading-relaxed text-foreground">
              {result.letter}
            </pre>
          </div>

          {/* Next steps */}
          <div className="mt-6 border border-border bg-surface p-6">
            <h3 className="mb-4 border-b border-border pb-3 text-sm font-bold uppercase tracking-widest">
              Next Steps
            </h3>
            <ol className="space-y-3">
              {result.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="font-mono-ui text-[10px] font-bold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="col-span-12 space-y-6 lg:col-span-4">
          {/* Key rights */}
          <div className="border border-border bg-surface p-6">
            <h3 className="mb-4 border-b border-border pb-3 text-sm font-bold uppercase tracking-widest">
              Your Rights in This Case
            </h3>
            <div className="space-y-4">
              {result.keyRights.map((r, i) => (
                <div key={i}>
                  <div className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-accent">
                    {r.legislation}
                  </div>
                  <div className="mt-0.5 text-sm font-medium">{r.right}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{r.relevance}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Escalation */}
          <div className="border border-border bg-foreground p-6 text-background">
            <span className="font-mono-ui text-[10px] uppercase tracking-widest opacity-70">
              If They Don't Respond
            </span>
            <p className="mt-3 text-sm leading-relaxed">{result.escalationPath}</p>
          </div>

          {/* Redress scheme */}
          <div className="border border-border bg-surface p-6">
            <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
              Redress Scheme
            </span>
            <p className="mt-3 text-sm leading-relaxed">{result.redressScheme}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ── helpers ── */
const inputClass =
  "w-full border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none";

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
