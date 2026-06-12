/**
 * <FreshnessBadge> — honest replacement for the generic green "LIVE" label.
 *
 * Shows the real state of the data from FreshnessMeta:
 *   fresh        → "{source} · updated 2h ago"
 *   stale        → amber "{source} · last updated {date} (refresh due)"
 *   source_down  → red "showing last good data from {date} — {source} unreachable"
 *
 * Never renders a blank widget; never implies data is live when it isn't.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { FreshnessMeta } from "@/contract/freshness";
import { getSource } from "@/contract/sources";

function relAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function FreshnessBadge({ meta, className }: { meta: FreshnessMeta; className?: string }) {
  // Avoid SSR/client hydration mismatch on relative times.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const source = getSource(meta.sourceId);

  if (meta.status === "source_down") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 label-mono text-[10px] uppercase tracking-wider text-flag",
          className,
        )}
        role="status"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-flag" aria-hidden="true" />
        {source.name} unreachable — showing last good data
        {meta.lastGoodAt ? ` from ${fmtDate(meta.lastGoodAt)}` : ""}
      </span>
    );
  }

  if (meta.status === "stale") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 label-mono text-[10px] uppercase tracking-wider text-amber",
          className,
        )}
        role="status"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-amber" aria-hidden="true" />
        {source.name} · last updated {fmtDate(meta.fetchedAt)}
        {meta.nextExpected ? ` · next due ${fmtDate(meta.nextExpected)}` : " · refresh due"}
      </span>
    );
  }

  // fresh
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 label-mono text-[10px] uppercase tracking-wider text-muted-foreground",
        className,
      )}
      role="status"
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-ok opacity-60 live-dot" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
      </span>
      <span className="text-ok">{source.name}</span>
      {mounted && <span>· updated {relAge(meta.fetchedAt)}</span>}
      {meta.nextExpected && <span>· next {fmtDate(meta.nextExpected)}</span>}
    </span>
  );
}
