import { AlertTriangle, Zap } from "lucide-react";
import { getAgentsStatus } from "@/lib/queries";
import { hasApiKey } from "@/lib/claude";
import { AgentCard } from "@/components/agents/AgentCard";
import type { AutonomyLevel } from "@/types/agents";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const agents = await getAgentsStatus(brandId);
  const apiKey = hasApiKey();

  const enabledCount = agents.filter((a) => a.enabled).length;
  const pendingTotal = agents.reduce((s, a) => s + a.pendingCount, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-[var(--ink)]">
            <Zap className="h-5 w-5 text-[var(--accent)]" /> Agents
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-2)]">
            Seven specialists. Switch on the ones you want, choose how much rope they get, and
            review their work in the inbox.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--ink-3)]">
          <span>
            <span className="font-semibold text-[var(--ink)]">{enabledCount}</span> / {agents.length}{" "}
            on
          </span>
          <span>
            <span className="font-semibold text-[var(--ink)]">{pendingTotal}</span> pending
          </span>
        </div>
      </div>

      {!apiKey ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[var(--warn)]/30 bg-[var(--warn-bg)] px-4 py-3 text-sm text-[var(--ink-2)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warn)]" />
          <p>
            <span className="font-semibold text-[var(--ink)]">No API key set.</span> Agents are
            ready, but won&apos;t run until you add <code className="text-xs">ANTHROPIC_API_KEY</code>{" "}
            to your <code className="text-xs">.env</code> file.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((a) => (
          <AgentCard
            key={a.agentType}
            brandId={brandId}
            agentType={a.agentType}
            enabled={a.enabled}
            autonomyLevel={a.autonomyLevel as AutonomyLevel}
            pendingCount={a.pendingCount}
            runCount={a.runCount}
            lastRunAt={a.lastRunAt ? a.lastRunAt.toISOString() : null}
            implemented={a.implemented}
          />
        ))}
      </div>
    </div>
  );
}
