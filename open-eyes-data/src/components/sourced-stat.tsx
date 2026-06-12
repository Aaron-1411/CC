/**
 * <SourcedStat> — the single component through which EVERY user-visible figure
 * renders. It mechanically enforces the mission rule "link every number to its
 * original source": a value, a label, and an always-visible
 * "source ↗ · as of {date}" affordance (no hover required).
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatStatValue, type SourcedStat as SourcedStatT } from "@/contract/stats";
import { getSource, LICENCE_LABELS } from "@/contract/sources";

function fmtAsOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Full block: big value + label + source line. Use on data pages and cards. */
export function SourcedStat({
  stat,
  size = "md",
  className,
}: {
  stat: SourcedStatT;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const source = getSource(stat.sourceId);
  const valueCls =
    size === "lg" ? "text-3xl sm:text-4xl" : size === "sm" ? "text-xl" : "text-2xl sm:text-3xl";
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className={cn("font-display font-black text-amber leading-none", valueCls)}>
        {formatStatValue(stat)}
      </span>
      <span className="text-sm text-muted-foreground leading-snug">{stat.label}</span>
      <SourcedStatProvenance stat={stat} source={source} />
      {stat.methodologyNote && (
        <span className="text-[11px] text-muted-foreground/70 leading-snug italic">
          {stat.methodologyNote}
        </span>
      )}
    </div>
  );
}

/** Inline variant: "{value} {label} (source ↗ · as of …)" for use within prose-like rows. */
export function SourcedStatInline({ stat, className }: { stat: SourcedStatT; className?: string }) {
  const source = getSource(stat.sourceId);
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      <span className="font-semibold text-foreground">{formatStatValue(stat)}</span>
      <span className="text-muted-foreground">{stat.label}</span>
      <SourcedStatProvenance stat={stat} source={source} inline />
    </span>
  );
}

function SourcedStatProvenance({
  stat,
  source,
  inline = false,
}: {
  stat: SourcedStatT;
  source: ReturnType<typeof getSource>;
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className={cn(
        "label-mono text-[10px] uppercase tracking-wider text-muted-foreground inline-flex flex-wrap items-center gap-x-1.5",
        inline ? "" : "mt-0.5",
      )}
    >
      <a
        href={stat.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="text-amber/80 hover:text-amber underline decoration-dotted underline-offset-2"
        title={`${source.name} — ${LICENCE_LABELS[source.licence]}`}
      >
        {source.name} ↗
      </a>
      <span aria-hidden="true">·</span>
      <span>as of {fmtAsOf(stat.asOf)}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Source details"
        className="rounded-full border border-border w-3.5 h-3.5 inline-flex items-center justify-center text-[8px] leading-none hover:border-amber hover:text-amber"
      >
        i
      </button>
      {open && (
        <span className="basis-full mt-1 normal-case tracking-normal text-[11px] text-muted-foreground/80 leading-snug">
          {LICENCE_LABELS[source.licence]}
          {source.cadence ? ` · updated ${source.cadence}` : ""}
          {stat.fetchedAt
            ? ` · last refreshed ${new Date(stat.fetchedAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : ""}
        </span>
      )}
    </span>
  );
}
