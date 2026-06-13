import { ShieldCheck, BadgeCheck, Scale, Leaf, ExternalLink } from "lucide-react";
import { Card, Eyebrow, Pill } from "@/components/ui";
import {
  registersForActivePack,
  showsHerbalProductNote,
  psaNote,
  herbalProductNote,
} from "@/data/registers";

/* Patient-facing literacy behind "qualified, registered practitioner": *how* a
 * person actually verifies someone, for the kinds of care the active pack
 * discusses. Pack-aware — renders only the registers relevant to the live pack,
 * and the THR herbal-product note only when a herbal tradition is present.
 * Statutory vs voluntary is shown as a neutral fact (a Pill), never a ranking;
 * links go to stable homepages, opened in a new tab. */
export function RegistersExplainer() {
  const registers = registersForActivePack();
  if (registers.length === 0) return null;
  const showsHerbal = showsHerbalProductNote();

  return (
    <div>
      <div className="mb-8 text-center">
        <Eyebrow className="justify-center">How to check a practitioner</Eyebrow>
        <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Checking someone is properly registered</h2>
        <p className="measure mx-auto mt-2 text-muted-foreground">
          Whatever kind of care you're weighing up, you can confirm the person is properly registered before you book.
          Here's who keeps the register for each field, and what being on it actually tells you.
        </p>
      </div>

      {/* The "if you only check one thing" umbrella — PSA oversees statutory
          regulators and accredits voluntary registers. */}
      <Card className="mx-auto mb-6 max-w-3xl border-primary/25 bg-primary-soft/40 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-xl">{psaNote.body}</h3>
              <Pill tint="primary">{psaNote.short}</Pill>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{psaNote.text}</p>
            <a
              href={psaNote.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Check a register on the {psaNote.short} site <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </Card>

      {/* Per-field registers relevant to the active pack, in declared order. */}
      <div className="grid gap-4 sm:grid-cols-2">
        {registers.map((r) => (
          <Card key={r.id} className="flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{r.care}</p>
                <h3 className="mt-1 font-serif text-lg leading-tight">{r.body}</h3>
              </div>
              <Pill tint="muted" className="shrink-0">{r.short}</Pill>
            </div>

            <div className="mt-3">
              {r.basis === "statutory" ? (
                <Pill tint="success"><Scale className="h-3.5 w-3.5" /> Backed by UK law</Pill>
              ) : (
                <Pill tint="muted"><BadgeCheck className="h-3.5 w-3.5" /> Voluntary register</Pill>
              )}
            </div>

            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{r.whatItMeans}</p>

            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Visit the {r.short} site <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Card>
        ))}
      </div>

      {/* Product-agnostic THR safety literacy — only when the pack involves a
          tradition that may use herbal products. Names no product or ingredient
          and makes no efficacy claim. */}
      {showsHerbal && (
        <Card className="mx-auto mt-6 max-w-3xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Leaf className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-xl">{herbalProductNote.body}</h3>
                <Pill tint="muted">{herbalProductNote.short}</Pill>
                <Pill tint="muted">{herbalProductNote.regulatorShort}</Pill>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{herbalProductNote.text}</p>
              <a
                href={herbalProductNote.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                About the {herbalProductNote.regulatorShort} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
