import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowRight, Check } from "lucide-react";

type FirmType = "Commercial Agent" | "Solicitor" | "Accountant / SME Advisor" | "Other";

/**
 * Demo-booking modal. UI-only — no backend wiring yet.
 * Use <ContactModal trigger={<button>…</button>} /> to open from any CTA.
 */
export function ContactModal({
  trigger,
  defaultOpen,
  heading = "Book your 20-minute demo",
  description = "Tell us a little about your firm and we'll spin up a branded sandbox on the call.",
}: {
  trigger: ReactNode;
  defaultOpen?: boolean;
  heading?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to backend / CRM. Intentionally UI-only for now.
    setSubmitted(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(() => setSubmitted(false), 200);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        {submitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-risk-safe/15 text-risk-safe">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-2xl tracking-tight">Request received.</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll be in touch within 1 business day to confirm your slot.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl tracking-tight">
                {heading}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" name="name" required />
                <Field label="Firm name" name="firm" required />
              </div>
              <Field label="Email" name="email" type="email" required />
              <Field label="Phone (optional)" name="phone" type="tel" />
              <div>
                <Label>What best describes your firm?</Label>
                <select
                  name="type"
                  required
                  defaultValue=""
                  className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {(
                    [
                      "Commercial Agent",
                      "Solicitor",
                      "Accountant / SME Advisor",
                      "Other",
                    ] satisfies FirmType[]
                  ).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Anything specific you'd like to see on the demo? (optional)</Label>
                <textarea
                  name="notes"
                  maxLength={500}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 bg-foreground px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-background hover:bg-accent"
              >
                Request my demo slot <ArrowRight className="h-3 w-3" />
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={255}
        className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
      />
    </div>
  );
}
