import { ShieldCheck, Pill as PillIcon, AlertTriangle, Phone, Info } from "lucide-react";
import { Card, Callout } from "@/components/ui";

const STATEMENTS = [
  {
    icon: <PillIcon className="h-4 w-4" />,
    text: "Always tell your GP and pharmacist about every medicine, herb and supplement you take — some combinations can interact.",
  },
  {
    icon: <Info className="h-4 w-4" />,
    text: "Some herbal and traditional products are unregulated and can vary in quality or purity. Only use products under guidance from a qualified, registered practitioner.",
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    text: "This tool is general education — not medical advice, diagnosis or treatment.",
  },
  {
    icon: <AlertTriangle className="h-4 w-4" />,
    text: "If your symptoms are severe, worsening, or an emergency, contact your GP, call NHS 111, or in an emergency call 999.",
  },
];

export function SafetyPanel({ id }: { id?: string }) {
  return (
    <Card id={id} className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-serif text-xl leading-none">Staying safe</h3>
          <p className="mt-1 text-sm text-muted-foreground">Important to read — this is here on every step, not buried.</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {STATEMENTS.map((s, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90">
            <span className="mt-0.5 shrink-0 text-primary">{s.icon}</span>
            <span>{s.text}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-warning-soft px-4 py-3 text-sm font-medium text-warning-foreground">
        <Phone className="h-4 w-4 shrink-0" />
        In an emergency call <strong>999</strong> · Urgent advice: <strong>NHS 111</strong>
      </div>
    </Card>
  );
}

/** Concern-specific "when to seek help sooner" list. Safety guidance, never a
 *  diagnosis — it tells people when to involve a professional, not what's wrong.
 *  Driven by the pack's per-concern `redFlags`, so each vertical sets its own. */
export function RedFlags({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <Card className="overflow-hidden border-warning/30">
      <div className="flex items-center gap-2.5 border-b border-warning/25 bg-warning-soft px-5 py-3.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-serif text-lg leading-none text-warning-foreground">When to seek help sooner</h3>
          <p className="mt-1 text-sm text-warning-foreground/80">Signs that are worth a prompt conversation with a professional.</p>
        </div>
      </div>
      <ul className="space-y-2.5 px-5 py-4">
        {items.map((s, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
      <div className="mx-5 mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-warning-soft px-4 py-3 text-sm font-medium text-warning-foreground">
        <Phone className="h-4 w-4 shrink-0" />
        In an emergency call <strong>999</strong> · Urgent advice: <strong>NHS 111</strong>
      </div>
    </Card>
  );
}

/** Gentle, non-specific reminder shown only when a patient listed medicines or
 *  supplements. It never assesses or names interactions — that would be a
 *  medical claim. It only prompts the human conversation. */
export function InteractionsReminder() {
  return (
    <Callout tone="warning" icon={<PillIcon className="h-4 w-4" />} title="A quick reminder about what you're taking">
      Because you mentioned medicines or supplements, it's worth checking with your pharmacist or doctor that everything
      is safe to take together. We don't assess interactions here — a quick human check is the safe way to do it.
    </Callout>
  );
}
