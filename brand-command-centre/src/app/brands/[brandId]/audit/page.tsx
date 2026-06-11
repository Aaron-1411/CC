import Link from "next/link";
import { ClipboardList, ArrowRight, Lightbulb } from "lucide-react";
import {
  getLatestAudit,
  pillarsFromAudit,
  opportunitiesFromAudit,
  ragCounts,
  avgScore,
} from "@/lib/queries";
import { hasApiKey } from "@/lib/claude";
import { getPillar } from "@/lib/pillars";
import { RAGBadge } from "@/components/shared/RAGBadge";
import { RunAuditButton } from "@/components/audit/RunAuditButton";
import { AGENT_META } from "@/types/agents";
import { ragStyles, timeAgo } from "@/lib/utils";
import type { Impact, Effort, PillarResult } from "@/types/analysis";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const impactChip: Record<Impact, string> = {
  HIGH: "text-[var(--good)] bg-[var(--good-bg)]",
  MEDIUM: "text-[var(--warn)] bg-[var(--warn-bg)]",
  LOW: "text-[var(--ink-3)] bg-[var(--panel-2)]",
};
const effortLabel: Record<Effort, string> = {
  LOW: "Low effort",
  MEDIUM: "Medium effort",
  HIGH: "High effort",
};

export default async function AuditPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const base = `/brands/${brandId}`;
  const audit = await getLatestAudit(brandId);
  const pillars = pillarsFromAudit(audit);
  const opportunities = opportunitiesFromAudit(audit);
  const apiKey = hasApiKey();
  const hasAudit = pillars.length > 0;

  const rag = ragCounts(pillars);
  const score = avgScore(pillars);

  // Group pillars by category, preserving rubric order.
  const categories: { name: string; items: PillarResult[] }[] = [];
  for (const p of pillars) {
    const def = getPillar(p.id);
    const cat = def?.category ?? "Other";
    let group = categories.find((c) => c.name === cat);
    if (!group) {
      group = { name: cat, items: [] };
      categories.push(group);
    }
    group.items.push(p);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-[var(--ink)]">
            <ClipboardList className="h-5 w-5 text-[var(--accent)]" /> Brand audit
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-2)]">
            A 13-pillar gap analysis of your whole growth stack, with a ranked action list.
            {audit?.completedAt ? (
              <span className="text-[var(--ink-3)]"> · Last run {timeAgo(audit.completedAt)}</span>
            ) : null}
          </p>
        </div>
        {hasAudit ? <RunAuditButton brandId={brandId} variant="secondary" hasExisting /> : null}
      </div>

      {!apiKey ? (
        <div className="mb-5 rounded-xl border border-[var(--warn)]/30 bg-[var(--warn-bg)] px-4 py-3 text-sm text-[var(--ink-2)]">
          <span className="font-semibold text-[var(--ink)]">No API key set.</span> Add{" "}
          <code className="text-xs">ANTHROPIC_API_KEY</code> to <code className="text-xs">.env</code>{" "}
          to run the audit.
        </div>
      ) : null}

      {!hasAudit ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--panel)] px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--panel-2)] text-[var(--accent)]">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-[var(--ink)]">Run your first audit</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[var(--ink-2)]">
            We&apos;ll research your site, search presence, social and reviews, score 13 pillars
            from foundations to retention, and hand you a prioritised to-do list — each tied to the
            agent that can fix it.
          </p>
          <div className="mt-5 flex justify-center">
            <RunAuditButton brandId={brandId} variant="primary" />
          </div>
        </div>
      ) : (
        <>
          {/* Score summary */}
          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5">
              <span className="text-4xl font-semibold tracking-tight text-[var(--ink)]">
                {score}
                <span className="text-lg font-normal text-[var(--ink-3)]">/100</span>
              </span>
              <span className="mt-1 text-xs font-medium text-[var(--ink-2)]">Overall health</span>
            </div>
            <div className="flex flex-col justify-center rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--panel-2)]">
                <Bar n={rag.green} total={pillars.length} color="var(--good)" />
                <Bar n={rag.amber} total={pillars.length} color="var(--warn)" />
                <Bar n={rag.red} total={pillars.length} color="var(--bad)" />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                <Legend n={rag.green} label="On track" color="var(--good)" />
                <Legend n={rag.amber} label="Needs work" color="var(--warn)" />
                <Legend n={rag.red} label="Critical" color="var(--bad)" />
              </div>
            </div>
          </div>

          {/* Opportunity matrix */}
          {opportunities.length > 0 ? (
            <section className="mt-6">
              <h2 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
                <Lightbulb className="h-4 w-4 text-[var(--warn)]" /> Prioritised opportunities
              </h2>
              <ul className="space-y-2">
                {opportunities.map((o, i) => {
                  const agent = o.recommendedAgent ? AGENT_META[o.recommendedAgent] : null;
                  const pillar = getPillar(o.pillarId);
                  return (
                    <li
                      key={i}
                      className="flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--panel-2)] text-xs font-semibold text-[var(--ink-2)]">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--ink)]">{o.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--ink-2)]">{o.action}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-3)]">
                          {pillar ? <span>Pillar {pillar.id} · {pillar.name}</span> : null}
                          <span>·</span>
                          <span>{effortLabel[o.effort]}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                            impactChip[o.impact]
                          }
                        >
                          {o.impact} impact
                        </span>
                        {agent ? (
                          <Link
                            href={`${base}/agents`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] px-2 py-1 text-[11px] font-medium text-[var(--ink-2)] transition hover:bg-[var(--panel-2)] hover:text-[var(--ink)]"
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: agent.colour }}
                            />
                            {agent.short}
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {/* Pillars by category */}
          <section className="mt-7 space-y-6">
            {categories.map((cat) => (
              <div key={cat.name}>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
                  {cat.name}
                </h3>
                <div className="space-y-2">
                  {cat.items.map((p) => (
                    <PillarRow key={p.id} p={p} base={base} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function Bar({ n, total, color }: { n: number; total: number; color: string }) {
  if (n === 0) return null;
  return <span style={{ width: `${(n / total) * 100}%`, background: color }} />;
}

function Legend({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--ink-2)]">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="font-semibold text-[var(--ink)]">{n}</span> {label}
    </span>
  );
}

function PillarRow({ p, base }: { p: PillarResult; base: string }) {
  const s = ragStyles(p.status);
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[var(--ink-3)]">
              {String(p.id).padStart(2, "0")}
            </span>
            <h4 className="text-sm font-semibold text-[var(--ink)]">{p.name}</h4>
          </div>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{p.summary}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <RAGBadge status={p.status} />
          <span className={"text-sm font-semibold " + s.text}>{p.score}</span>
        </div>
      </div>

      {p.findings.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {p.findings.map((f, i) => (
            <li key={i} className="flex gap-2 text-xs text-[var(--ink-2)]">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--ink-3)]" />
              {f}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--line-2)] pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
          Opportunity
        </span>
        <p className="min-w-0 flex-1 text-xs text-[var(--ink)]">{p.opportunity}</p>
        {p.recommendedAgents.length > 0 ? (
          <Link
            href={`${base}/agents`}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] hover:underline"
          >
            {AGENT_META[p.recommendedAgents[0]].short} agent
            <ArrowRight className="h-3 w-3" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
