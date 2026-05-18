import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";

export function LiveBadge({ timestamp, label = "LIVE" }: { timestamp?: string | number | Date | null; label?: string }) {
  const ts = timestamp ? new Date(timestamp) : null;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <span className="inline-flex items-center gap-2 label-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-ok opacity-60 live-dot" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
      </span>
      <span className="text-ok">{label}</span>
      {ts && mounted && (
        <span className="text-muted-foreground">
          · fetched {ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </span>
  );
}

export function DataProvenance({
  source,
  url,
  licence = "Open Government Licence v3.0",
  fetchedAt,
}: {
  source: string;
  url?: string;
  licence?: string;
  fetchedAt?: string | number | Date | null;
}) {
  const ts = fetchedAt ? new Date(fetchedAt) : null;
  return (
    <div className="border-t border-border pt-3 mt-4 text-[11px] text-muted-foreground label-mono space-y-0.5">
      <div>
        <span className="uppercase tracking-wider">Source: </span>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="underline hover:text-amber break-all">
            {source}
          </a>
        ) : (
          <span>{source}</span>
        )}
      </div>
      <div>
        <span className="uppercase tracking-wider">Licence: </span>
        <span>{licence}</span>
      </div>
      {ts && (
        <div>
          <span className="uppercase tracking-wider">Fetched: </span>
          <span>{ts.toUTCString()}</span>
        </div>
      )}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-lg p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        {eyebrow && (
          <div className="label-mono text-[11px] uppercase tracking-[0.2em] text-amber mb-1">
            {eyebrow}
          </div>
        )}
        <h2 className="font-display text-2xl sm:text-3xl font-bold">{title}</h2>
      </div>
      {right}
    </div>
  );
}

type FlagVariant = "direct" | "no-tender" | "restricted" | "open" | "neutral" | "warn" | "ok";
const flagStyles: Record<FlagVariant, string> = {
  direct: "bg-flag/15 text-flag border-flag/30",
  "no-tender": "bg-flag/15 text-flag border-flag/30",
  restricted: "bg-amber/15 text-amber border-amber/30",
  warn: "bg-amber/15 text-amber border-amber/30",
  open: "bg-ok/15 text-ok border-ok/30",
  ok: "bg-ok/15 text-ok border-ok/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function FlagPill({
  variant = "neutral",
  children,
}: {
  variant?: FlagVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] label-mono uppercase tracking-wider",
        flagStyles[variant],
      )}
    >
      {children}
    </span>
  );
}

export function ThresholdBar({
  value,
  thresholds,
}: {
  value: number;
  thresholds: number[];
}) {
  const max = Math.max(thresholds[thresholds.length - 1], value);
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="relative h-2 bg-surface-2 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            value >= thresholds[1] ? "bg-ok" : value >= thresholds[0] ? "bg-amber" : "bg-amber/60",
          )}
          style={{ width: `${pct}%` }}
        />
        {thresholds.map((t) => (
          <div
            key={t}
            className="absolute top-0 bottom-0 w-px bg-foreground/40"
            style={{ left: `${(t / max) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between label-mono text-[10px] text-muted-foreground">
        <span className={value >= thresholds[0] ? "text-ok" : ""}>
          10k · response
        </span>
        <span className={value >= thresholds[1] ? "text-ok" : ""}>
          100k · debate
        </span>
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-surface-2/60 rounded animate-pulse", className)}
    />
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
  loading,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: "amber" | "flag" | "ok";
  loading?: boolean;
}) {
  return (
    <div className="border border-border bg-surface rounded-lg p-4">
      <div className="label-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "font-display text-3xl sm:text-4xl font-bold mt-2",
          accent === "amber" && "text-amber",
          accent === "flag" && "text-flag",
          accent === "ok" && "text-ok",
        )}
      >
        {loading ? <Skeleton className="h-8 w-24" /> : value}
      </div>
      {hint && (
        <div className="label-mono text-[11px] text-muted-foreground mt-1">{hint}</div>
      )}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div className="border border-flag/30 bg-flag/10 text-flag p-3 rounded label-mono text-xs">
      {children}
    </div>
  );
}