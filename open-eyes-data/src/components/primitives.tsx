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

/**
 * ContextBlock — plain-English "what does this mean?" card.
 * Use it to anchor raw numbers with comparisons, legal benchmarks and consequences.
 */
export function ContextBlock({
  heading,
  children,
  variant = "default",
}: {
  heading: string;
  children: ReactNode;
  variant?: "default" | "warn" | "critical";
}) {
  const border =
    variant === "critical"
      ? "border-flag/30 bg-flag/5"
      : variant === "warn"
      ? "border-amber/30 bg-amber/5"
      : "border-border bg-surface-2/40";
  return (
    <div className={cn("rounded-lg border p-4 sm:p-5 space-y-2", border)}>
      <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        What this means
      </div>
      <h4 className="font-display text-base font-bold leading-snug">{heading}</h4>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

/**
 * ActionBar — "what can I do?" row on every data page.
 * Provides write-to-MP (with optional pre-drafted letter), share, and AI briefing entry points.
 */
export function ActionBar({
  mpTopic,
  briefingTopic,
  shareText,
  letterTemplate,
}: {
  mpTopic?: string;
  briefingTopic?: string;
  shareText?: string;
  /** Pre-drafted letter body. If provided, shows a "Draft letter" button that opens a modal. */
  letterTemplate?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterCopied, setLetterCopied] = useState(false);

  function handleShare() {
    const text = shareText ? `${shareText} — transparenC` : "Check this out on transparenC";
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: text, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  function copyLetter() {
    if (!letterTemplate) return;
    navigator.clipboard?.writeText(letterTemplate).then(() => {
      setLetterCopied(true);
      setTimeout(() => setLetterCopied(false), 2000);
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 py-4 border-t border-border">
        <span className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground self-center mr-1">
          Take action:
        </span>

        {mpTopic && (
          <a
            href="https://www.writetothem.com/?a=W"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber/40 bg-amber/5 text-amber label-mono text-[11px] uppercase tracking-wider hover:bg-amber/10 transition-colors"
          >
            ✉ Write to your MP
          </a>
        )}

        {letterTemplate && (
          <button
            onClick={() => setLetterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber/20 bg-amber/5 label-mono text-[11px] uppercase tracking-wider text-amber/80 hover:text-amber hover:border-amber/40 transition-colors"
          >
            ✦ Draft letter
          </button>
        )}

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-surface label-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
        >
          {copied ? "✓ Copied" : "↗ Share this"}
        </button>

        {briefingTopic && (
          <a
            href={`/briefing?topic=${encodeURIComponent(briefingTopic)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-surface label-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
          >
            ✦ Ask AI about this
          </a>
        )}
      </div>

      {/* Letter modal */}
      {letterOpen && letterTemplate && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setLetterOpen(false)}
        >
          <div
            className="bg-surface border border-border rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">Pre-drafted letter</div>
                <div className="font-display text-base font-bold mt-0.5">Copy, personalise and send</div>
              </div>
              <button
                onClick={() => setLetterOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="2" y1="2" x2="14" y2="14" /><line x1="14" y1="2" x2="2" y2="14" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground">{letterTemplate}</pre>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border bg-surface-2/40 rounded-b-xl">
              <p className="text-xs text-muted-foreground">Edit before sending — personalise with your name and local detail.</p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={copyLetter}
                  className="px-3 py-2 bg-amber text-amber-foreground rounded label-mono text-xs uppercase tracking-wider hover:opacity-90"
                >
                  {letterCopied ? "✓ Copied!" : "Copy letter"}
                </button>
                <a
                  href="https://www.writetothem.com/?a=W"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 border border-border rounded label-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Open Write to Them →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}