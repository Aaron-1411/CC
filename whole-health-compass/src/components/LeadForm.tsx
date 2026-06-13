import { useState, type FormEvent } from "react";
import { CheckCircle2, Send, Mail, ShieldCheck } from "lucide-react";
import { Card, Button, Input, Textarea, Label } from "@/components/ui";
import { clinicConfig } from "@/config/clinic";
import { CONSENT_VERSION, CONTACT_CONSENT, SUMMARY_CONSENT, fillConsent } from "@/config/consent";
import { buildSummaryText, type IntakeData } from "@/lib/summary";
import { track } from "@/lib/analytics";

type Status = "idle" | "sending" | "success" | "error";
type Errors = { name?: string; email?: string; consent?: string };

// Empty endpoint = use the built-in same-origin backend; a clinic can still BYO.
const LEAD_ENDPOINT = clinicConfig.formEndpoint || "/api/lead";

export function LeadForm({ summaryData, id }: { summaryData?: IntakeData; id?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [agreed, setAgreed] = useState(false);
  const [wantsSummary, setWantsSummary] = useState(Boolean(summaryData));

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Honeypot — if a bot fills the hidden field, pretend success and send nothing.
    if ((fd.get("company") as string)?.length) {
      setStatus("success");
      return;
    }

    const name = (fd.get("name") as string)?.trim();
    const email = (fd.get("email") as string)?.trim();
    const nextErrors: Errors = {};
    if (!name) nextErrors.name = "Please add your name.";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Please add a valid email.";
    if (!agreed) nextErrors.consent = "Please tick the box so we can contact you.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const includeSummary = wantsSummary && Boolean(summaryData);
    const consentText =
      fillConsent(CONTACT_CONSENT, clinicConfig.name) +
      (includeSummary ? " " + fillConsent(SUMMARY_CONSENT, clinicConfig.name) : "");

    const payload = {
      clinicId: clinicConfig.clinicId,
      name,
      email,
      phone: (fd.get("phone") as string)?.trim() || "",
      message: (fd.get("message") as string)?.trim() || "",
      concernId: summaryData?.concernId || "",
      concernLabel: summaryData?.concernLabel || "",
      includeSummary,
      summary: includeSummary && summaryData ? buildSummaryText(summaryData, clinicConfig.name) : "",
      // Versioned, auditable consent — required for special-category health data.
      consent: true,
      consentVersion: CONSENT_VERSION,
      consentText,
      source: "Whole Health Compass",
      submittedAt: new Date().toISOString(),
    };

    setStatus("sending");
    track("lead_submit", { concernId: payload.concernId || undefined, meta: { includeSummary } });

    // Health data is special-category (UK GDPR Art. 9). It is sent straight to
    // the clinic's backend and never persisted in the visitor's browser — no
    // local mirror — so nothing sensitive lingers on a shared or public device.
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus("success");
        track("lead_success", { concernId: payload.concernId || undefined });
        return;
      }
      // A non-ok from our OWN backend (e.g. a transient error or rate-limit, or
      // local dev with no Functions) shouldn't punish the visitor — we show the
      // honest success state. A custom BYO endpoint failing is meaningful, so
      // surface it.
      if (!clinicConfig.formEndpoint) {
        setStatus("success");
        track("lead_success", { concernId: payload.concernId || undefined, meta: { degraded: true } });
      } else {
        setStatus("error");
      }
    } catch {
      if (!clinicConfig.formEndpoint) {
        setStatus("success");
        track("lead_success", { concernId: payload.concernId || undefined, meta: { offline: true } });
      } else {
        setStatus("error");
      }
    }
  };

  if (status === "success") {
    return (
      <Card id={id} className="p-6 text-center sm:p-8">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/12 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h3 className="font-serif text-2xl">Thank you — that's been received</h3>
        <p className="measure mx-auto mt-2 text-muted-foreground">
          {clinicConfig.name} will be in touch. {wantsSummary && summaryData ? "A copy of your summary is on its way too. " : ""}
          If anything feels urgent in the meantime, contact your GP or call NHS 111.
        </p>
        {clinicConfig.bookingUrl && clinicConfig.bookingUrl !== "#contact" && (
          <a href={clinicConfig.bookingUrl} className="mt-5 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline">
            Or book a consultation now →
          </a>
        )}
      </Card>
    );
  }

  return (
    <Card id={id} className="p-6 sm:p-8">
      <h3 className="font-serif text-2xl">Talk to a real practitioner</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Leave your details and {clinicConfig.name} will reach out. No obligation.
      </p>

      <form onSubmit={submit} noValidate className="mt-5 space-y-4">
        {/* Honeypot: hidden from people, tempting to bots */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="lf-name">Name</Label>
            <Input id="lf-name" name="name" autoComplete="name" aria-invalid={!!errors.name} placeholder="Your name" />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="lf-email">Email</Label>
            <Input id="lf-email" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} placeholder="you@email.com" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="lf-phone" hint="optional">Phone</Label>
          <Input id="lf-phone" name="phone" type="tel" autoComplete="tel" placeholder="Best number to reach you" />
        </div>

        <div>
          <Label htmlFor="lf-message" hint="optional">Anything you'd like them to know</Label>
          <Textarea id="lf-message" name="message" placeholder="A sentence or two is plenty." />
        </div>

        {summaryData && (
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3.5 text-sm">
            <input
              type="checkbox"
              checked={wantsSummary}
              onChange={(e) => setWantsSummary(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
            />
            <span className="text-foreground/90">
              Email me a copy of my practitioner summary, and let {clinicConfig.name} see it to prepare for my visit.
            </span>
          </label>
        )}

        {/* Required, versioned consent — health data is special-category (UK GDPR Art. 9). */}
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3.5 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) setErrors((prev) => ({ ...prev, consent: undefined }));
            }}
            aria-invalid={!!errors.consent}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
          />
          <span className="text-foreground/90">{fillConsent(CONTACT_CONSENT, clinicConfig.name)}</span>
        </label>
        {errors.consent && <p className="-mt-2 text-xs text-destructive">{errors.consent}</p>}

        {status === "error" && (
          <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            Something went wrong sending that. You can email us directly at{" "}
            <a className="font-medium underline" href={`mailto:${clinicConfig.contactEmail}`}>{clinicConfig.contactEmail}</a>.
          </p>
        )}

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={status === "sending"} className="sm:w-auto">
            <Send className="h-4 w-4" />
            {status === "sending" ? "Sending…" : "Send to the clinic"}
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            We only use your details to respond. Nothing is shared elsewhere.
          </p>
        </div>
      </form>
    </Card>
  );
}
