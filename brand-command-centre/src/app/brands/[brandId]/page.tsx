import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Inbox as InboxIcon,
  Zap,
  CheckCircle2,
  Activity,
  AlertCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  getBrand,
  getLatestAudit,
  getAgentsStatus,
  getInboxItems,
  getRecentRuns,
  getPublishedCount,
  pillarsFromAudit,
  opportunitiesFromAudit,
  ragCounts,
  avgScore,
} from "@/lib/queries";
import { getPillar } from "@/lib/pillars";
import { AGENT_META, type AgentType, type InboxItemType } from "@/types/agents";
import { itemTypeLabel, timeAgo } from "@/lib/utils";
import type { Impact, Effort } from "@/types/analysis";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const impactChip: Record<Impact, string> = {
  HIGH: "text-[var(--good)] bg-[var(--good-bg)]",
  MEDIUM: "text-[var(--warn)] bg-[var(--warn-bg)]",
  LOW: "text-[var(--ink-3)] bg-[var(--panel-2)]",
};
const effortLabel: Record<Effort, string> = { LOW: "Low effort", MEDIUM: "Medium effort", HIGH: "High effort" };

export default async function BrandHome({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const base = `/brands/${brandId}`;

  const [brand, audit, agents, pending, runs, publishedCount] = await Promise.all([
    getBrand(brandId),
    getLatestAudit(brandId),
    getAgentsStatus(brandId),
    getInboxItems(brandId, { status: "PENDING" }),
    getRecentRuns(brandId, undefined, 6),
    getPublishedCount(brandId),
  ]);

  const pillars = pillarsFromAudit(audit);
  const rag = ragCounts(pillars);
  const score = avgScore(pillars);
  const opportunities = opportunitiesFromAudit(audit)
    .slice()
    .sort((a, b) => impactRank(b.impact) - impactRank(a.impact))
    .slice(0, 5);
  const enabledCount = agents.filter((a) => a.enabled).length;
  const hasAudit = pillars.length > 0;

  const stats = [
    {
      label: "Needs review",
      value: pending.length,
      href: `${base}/inbox`,
      icon: InboxIcon,
      accent: pending.length > 0,
    },
    {
      label: "Brand health",
      value: hasAudit ? `${score}` : "—",
      suffix: hasAudit ? "/100" : "",
      href: `${base}/audit`,
      icon: ClipboardList,
    },
    {
      label: "Agents on",
      value: `${enabledCount}`,
      suffix: `/${agents.length}`,
      href: `${base}/agents`,
      icon: Zap,
    },
    {
      label: "Published",
      value: publishedCount,
      href: `${base}/history`,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--ink)]">{brand?.name}</h1>
        <p className="mt-1 text-sm text-[var(--ink-2)]">
          {hasAudit
            ? "Here's where things stand and what wants your attention."
            : "Run your first audit to light up the dashboard and get agent recommendations."}
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group flex flex-col rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 transition hover:border-[var(--ink-3)]"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-[var(--ink-3)]" />
                <ArrowRight className="h-3.5 w-3.5 text-[var(--ink-3)] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>
              <span className="mt-3 text-2xl font-semibold tracking-tight text-[var(--ink)]">
                {s.value}
                {s.suffix ? (
                  <span className="text-base font-normal text-[var(--ink-3)]">{s.suffix}</span>
                ) : null}
              </span>
              <span
                className={
                  "mt-0.5 text-xs " +
                  (s.accent ? "font-medium text-[var(--accent)]" : "text-[var(--ink-2)]")
                }
              >
                {s.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* RAG strip */}
      {hasAudit ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm">
          <span className="text-[var(--ink-2)]">Audit signal</span>
          <RagPill count={rag.green} label="On track" color="var(--good)" />
          <RagPill count={rag.amber} label="Needs work" color="var(--warn)" />
          <RagPill count={rag.red} label="Critical" color="var(--bad)" />
          <Link
            href={`${base}/audit`}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
          >
            Full audit <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Priority actions + activity */}
        <div className="space-y-5 lg:col-span-2">
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--ink)]">Priority actions</h2>
              {hasAudit ? (
                <Link
                  href={`${base}/audit`}
                  className="text-xs font-medium text-[var(--ink-3)] hover:text-[var(--ink)]"
                >
                  View all
                </Link>
              ) : null}
            </div>

            {opportunities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel)] px-5 py-8 text-center">
                <p className="text-sm font-medium text-[var(--ink)]">
                  {hasAudit ? "No open opportunities — nice work." : "No audit yet"}
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--ink-2)]">
                  {hasAudit
                    ? "Your pillars are in good shape. Keep the agents running to stay ahead."
                    : "An audit scores 13 pillars and hands you a ranked to-do list."}
                </p>
                {!hasAudit ? (
                  <Link
                    href={`${base}/audit`}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    <ClipboardList className="h-4 w-4" /> Run audit
                  </Link>
                ) : null}
              </div>
            ) : (
              <ul className="space-y-2">
                {opportunities.map((o, i) => {
                  const agent = o.recommendedAgent
                    ? AGENT_META[o.recommendedAgent]
                    : null;
                  const pillar = getPillar(o.pillarId);
                  return (
                    <li
                      key={i}
                      className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--ink)]">{o.title}</p>
                          <p className="mt-0.5 text-xs text-[var(--ink-2)]">{o.action}</p>
                        </div>
                        <span
                          className={
                            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                            impactChip[o.impact]
                          }
                        >
                          {o.impact} impact
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-3)]">
                        {pillar ? <span>Pillar {pillar.id} · {pillar.name}</span> : null}
                        <span>·</span>
                        <span>{effortLabel[o.effort]}</span>
                        {agent ? (
                          <Link
                            href={`${base}/agents`}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-[var(--panel-2)] px-2 py-1 font-medium text-[var(--ink-2)] transition hover:text-[var(--ink)]"
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: agent.colour }}
                            />
                            {agent.short} agent
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
              <Activity className="h-4 w-4 text-[var(--ink-3)]" /> Recent activity
            </h2>
            {runs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel)] px-4 py-6 text-center text-sm text-[var(--ink-2)]">
                No agent runs yet. Switch an agent on, or hit “Run now”.
              </p>
            ) : (
              <ul className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)]">
                {runs.map((r) => {
                  const meta = AGENT_META[r.agentType as AgentType];
                  return (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 border-b border-[var(--line-2)] px-4 py-2.5 last:border-0"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: meta?.colour ?? "var(--ink-3)" }}
                      />
                      <span className="text-sm text-[var(--ink)]">{meta?.label ?? r.agentType}</span>
                      <RunStatus status={r.status} itemCount={r.itemCount} error={r.error} />
                      <span className="ml-auto text-xs text-[var(--ink-3)]">
                        {timeAgo(r.startedAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Needs your review */}
        <section className="lg:col-span-1">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Needs your review</h2>
            {pending.length > 0 ? (
              <Link
                href={`${base}/inbox`}
                className="text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Open inbox
              </Link>
            ) : null}
          </div>

          {pending.length === 0 ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-5 py-8 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-[var(--good)]" />
              <p className="mt-2 text-sm font-medium text-[var(--ink)]">Inbox zero</p>
              <p className="mt-0.5 text-xs text-[var(--ink-2)]">
                Nothing waiting. Agents will drop new work here as they run.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {pending.slice(0, 6).map((item) => {
                const meta = AGENT_META[item.agentType as AgentType];
                return (
                  <li key={item.id}>
                    <Link
                      href={`${base}/inbox`}
                      className="group flex flex-col gap-1 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3 transition hover:border-[var(--ink-3)]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: meta?.colour ?? "var(--ink-3)" }}
                        />
                        <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-3)]">
                          {itemTypeLabel(item.type as InboxItemType)}
                        </span>
                        <span className="ml-auto text-[11px] text-[var(--ink-3)]">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm font-medium text-[var(--ink)]">
                        {item.title}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function impactRank(i: Impact): number {
  return i === "HIGH" ? 3 : i === "MEDIUM" ? 2 : 1;
}

function RagPill({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--ink-2)]">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="font-semibold text-[var(--ink)]">{count}</span> {label}
    </span>
  );
}

function RunStatus({
  status,
  itemCount,
  error,
}: {
  status: string;
  itemCount: number;
  error: string | null;
}) {
  if (status === "COMPLETE") {
    return (
      <span className="text-xs text-[var(--ink-3)]">
        {itemCount > 0 ? `${itemCount} item${itemCount === 1 ? "" : "s"}` : "no new items"}
      </span>
    );
  }
  if (status === "RUNNING") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--ink-3)]">
        <Clock className="h-3 w-3 animate-pulse" /> running
      </span>
    );
  }
  if (status === "SKIPPED") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--warn)]">
        <AlertCircle className="h-3 w-3" /> skipped
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-[var(--bad)]"
      title={error ?? undefined}
    >
      <XCircle className="h-3 w-3" /> failed
    </span>
  );
}
