"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ClipboardList, RefreshCw } from "lucide-react";

export function RunAuditButton({
  brandId,
  variant = "primary",
  hasExisting = false,
}: {
  brandId: string;
  variant?: "primary" | "secondary";
  hasExisting?: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/audit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "FAILED") {
        throw new Error(data.error ?? "Audit failed.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit failed.");
    } finally {
      setRunning(false);
    }
  }

  const Icon = hasExisting ? RefreshCw : ClipboardList;
  const label = hasExisting ? "Re-run audit" : "Run audit";

  const base =
    "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-[var(--accent)] text-white hover:opacity-90"
      : "border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--panel-2)]";

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button onClick={run} disabled={running} className={`${base} ${styles}`}>
        {running ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        {running ? "Auditing…" : label}
      </button>
      {running ? (
        <span className="text-xs text-[var(--ink-3)]">
          Analysing 13 pillars with live web research — this can take a minute.
        </span>
      ) : null}
      {error ? <span className="text-xs text-[var(--bad)]">{error}</span> : null}
    </div>
  );
}
