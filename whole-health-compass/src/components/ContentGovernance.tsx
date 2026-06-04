import { BadgeCheck } from "lucide-react";
import { contentReview } from "@/data/concerns";
import { Card } from "@/components/ui";

/* The content's review provenance, surfaced as an auditable record rather than
 * a claim about any individual. It demonstrates the governance model: every
 * content version is checked against the safety rules before release, and the
 * reviewing clinician's name + registration are recorded with each sign-off. */

/** Compact one-line trust signal for the foot of the result page. */
export function ContentGovernanceLine() {
  if (!contentReview) return null;
  const { version, date } = contentReview;
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
      <BadgeCheck className="h-3.5 w-3.5 text-primary" />
      Content v{version} · reviewed against the safety rules before release ·{" "}
      <time dateTime={date}>{new Date(date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</time>
    </p>
  );
}

/** Full governance record for the /compliance page — the auditable artifact. */
export function ContentGovernanceCard() {
  if (!contentReview) return null;
  const { reviewedBy, role, date, version, statement } = contentReview;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-border bg-surface px-5 py-3.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <BadgeCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-serif text-lg leading-none">Content governance & review record</h3>
          <p className="mt-1 text-sm text-muted-foreground">Why the education can be trusted — and audited.</p>
        </div>
      </div>
      <dl className="grid gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-2">
        <Field label="Content version" value={`v${version}`} />
        <Field label="Last reviewed" value={new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
        <Field label="Reviewer" value={reviewedBy} />
        <Field label="Reviewer credential" value={role} />
      </dl>
      {statement && (
        <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">{statement}</p>
      )}
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[0.95rem] text-foreground/90">{value}</dd>
    </div>
  );
}
