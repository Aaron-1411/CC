"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Lock, Check } from "lucide-react";
import { AGENT_META, type AgentType, type AutonomyLevel } from "@/types/agents";
import { setAgentEnabled, setAgentAutonomy } from "@/lib/actions";
import { cn, timeAgo } from "@/lib/utils";

export interface AgentCardProps {
  brandId: string;
  agentType: AgentType;
  enabled: boolean;
  autonomyLevel: AutonomyLevel;
  pendingCount: number;
  runCount: number;
  lastRunAt: string | null;
  implemented: boolean;
}

export function AgentCard(props: AgentCardProps) {
  const { brandId, agentType, pendingCount, runCount, lastRunAt, implemented } = props;
  const meta = AGENT_META[agentType];
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [enabled, setEnabled] = useState(props.enabled);
  const [autonomy, setAutonomy] = useState<AutonomyLevel>(props.autonomyLevel);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    startTransition(() => setAgentEnabled(brandId, agentType, next));
  }

  function changeAutonomy(level: AutonomyLevel) {
    if (meta.alwaysApproval) return;
    setAutonomy(level);
    startTransition(() => setAgentAutonomy(brandId, agentType, level));
  }

  async function runNow() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, agentType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Run failed");
      if (data.status === "SKIPPED") {
        setResult(data.error ? `Skipped — ${data.error}` : "Skipped (conflict).");
      } else if (data.status === "FAILED") {
        throw new Error(data.error ?? "Run failed");
      } else {
        setResult(
          data.itemCount > 0
            ? `Done — ${data.itemCount} new item${data.itemCount === 1 ? "" : "s"} in your inbox.`
            : "Done — nothing new this time.",
        );
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ background: meta.colour }}
        >
          {meta.short.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--ink)]">{meta.label}</h3>
            {pendingCount > 0 ? (
              <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                {pendingCount} pending
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-2)]">{meta.blurb}</p>
        </div>

        {/* Enable switch */}
        <button
          role="switch"
          aria-checked={enabled}
          aria-label={enabled ? "Disable agent" : "Enable agent"}
          onClick={toggleEnabled}
          disabled={pending}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:opacity-60",
            enabled ? "bg-[var(--accent)]" : "bg-[var(--line)]",
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 rounded-full bg-white shadow transition",
              enabled ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--ink-3)]">
        <span>{meta.scheduleLabel}</span>
        <span>·</span>
        <span>{runCount} runs</span>
        {lastRunAt ? (
          <>
            <span>·</span>
            <span>last {timeAgo(lastRunAt)}</span>
          </>
        ) : null}
      </div>

      {/* Autonomy */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
          Autonomy
        </span>
        {meta.alwaysApproval ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--panel-2)] px-2 py-1 text-[11px] font-medium text-[var(--ink-2)]">
            <Lock className="h-3 w-3" /> Always needs approval
          </span>
        ) : (
          <div className="inline-flex rounded-lg border border-[var(--line)] p-0.5">
            <button
              onClick={() => changeAutonomy("APPROVAL_REQUIRED")}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-medium transition",
                autonomy === "APPROVAL_REQUIRED"
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--ink-2)] hover:bg-[var(--panel-2)]",
              )}
            >
              Approve first
            </button>
            <button
              onClick={() => changeAutonomy("FULLY_AUTONOMOUS")}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-medium transition",
                autonomy === "FULLY_AUTONOMOUS"
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--ink-2)] hover:bg-[var(--panel-2)]",
              )}
            >
              Auto-publish
            </button>
          </div>
        )}
      </div>

      {/* Run + status */}
      <div className="mt-4 flex items-center gap-2 border-t border-[var(--line-2)] pt-3">
        {implemented ? (
          <button
            onClick={runNow}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--panel-2)] disabled:opacity-60"
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Run now
          </button>
        ) : (
          <span className="rounded-lg bg-[var(--panel-2)] px-3 py-1.5 text-xs font-medium text-[var(--ink-3)]">
            Coming soon
          </span>
        )}

        {result ? (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--good)]">
            <Check className="h-3.5 w-3.5" /> {result}
          </span>
        ) : null}
        {error ? <span className="text-xs text-[var(--bad)]">{error}</span> : null}
      </div>
    </div>
  );
}
