import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getJob } from "@/lib/jobs.functions";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

type Evidence = { value?: string | null; confidence?: "high" | "medium" | "low"; source_url?: string | null; evidence_quote?: string | null };
type Plan = { name: string; monthly_price?: string | null; annual_price?: string | null; per_seat_or_usage?: string | null; included_quotas?: string | null; addon_costs?: string | null; target_user?: string | null; source_url?: string | null };
type Pricing = { currency?: string | null; tiers?: Plan[]; free_trial?: Evidence; money_back?: Evidence; regional_pricing_notes?: Evidence; discounts_promos?: string[] };
type Terms = { min_contract_length?: Evidence; auto_renewal?: Evidence; cancellation_notice?: Evidence; payment_terms?: Evidence; sla_uptime?: Evidence; overage_rates?: Evidence; enterprise_custom_terms_available?: Evidence; refund_policy?: Evidence };
type Capability = { name: string; classification: "parity" | "advantage" | "gap" | "unknown"; notes?: string | null; source_url?: string | null };
type Capabilities = { features?: Capability[]; integrations?: string[]; platforms?: string[]; limits?: string | null; security_compliance?: string[] };
type Proof = { type: "logo" | "case_study" | "review_score" | "award"; label: string; detail?: string | null; source_url?: string | null };
type Positioning = { tagline?: string | null; target_segments?: string[]; differentiators?: string[]; proof_points?: Proof[]; incentives_active?: string[]; partner_ecosystem?: string[] };

type Competitor = {
  name: string;
  url?: string | null;
  positioning_summary?: string | null;
  pricing?: Pricing;
  terms?: Terms;
  capabilities?: Capabilities;
  positioning?: Positioning;
  source_urls?: string[];
  overall_confidence?: "high" | "medium" | "low";
};

type ReportData = {
  id: string;
  subject_name: string;
  subject_url: string | null;
  subject_summary: string | null;
  competitors: Competitor[];
};

export const Route = createFileRoute("/app/research/$jobId")({
  head: () => ({ meta: [{ title: "Research report — Workbench" }] }),
  component: ResearchView,
});

function ResearchView() {
  const { jobId } = Route.useParams();
  const get = useServerFn(getJob);
  const { data, isLoading } = useQuery({
    queryKey: ["research", jobId],
    queryFn: () => get({ data: { id: jobId } }),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 3000;
      const hasAssistant = d.messages.some((m) => m.role === "assistant");
      return hasAssistant ? false : 3000;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const reportMsg = data.messages.find(
    (m) => m.role === "assistant" && (m.step_log as { kind?: string } | null)?.kind === "research",
  );
  const reportId = (reportMsg?.step_log as { report_id?: string } | null)?.report_id;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/app" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Jobs
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">{data.job.title}</h1>

      {reportId ? (
        <ReportBody reportId={reportId} />
      ) : (
        <div className="mt-8 flex items-center gap-2 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Researching across pricing, terms, capabilities, and positioning — this page will refresh automatically.
        </div>
      )}
    </div>
  );
}

function ReportBody({ reportId }: { reportId: string }) {
  const { data: report } = useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const mod = await import("@/lib/research.functions");
      return (await mod.getReport({ data: { id: reportId } })) as unknown as ReportData | null;
    },
  });

  if (!report) {
    return (
      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading report…
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {report.subject_summary ? (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Subject</h2>
          <p className="mt-2 text-sm whitespace-pre-wrap">{report.subject_summary.slice(0, 1200)}</p>
        </section>
      ) : null}

      <ComparisonMatrix competitors={report.competitors} />

      <section>
        <h2 className="text-xl font-semibold">Deep profiles</h2>
        <div className="mt-4 space-y-6">
          {report.competitors.map((c, i) => (
            <CompetitorCard key={i} c={c} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ComparisonMatrix({ competitors }: { competitors: Competitor[] }) {
  return (
    <section className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-xs">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Competitor</th>
            <th className="px-3 py-2 text-left font-medium">Tagline</th>
            <th className="px-3 py-2 text-left font-medium">Lowest tier</th>
            <th className="px-3 py-2 text-left font-medium">Contract</th>
            <th className="px-3 py-2 text-left font-medium">Free trial</th>
            <th className="px-3 py-2 text-left font-medium">Features</th>
            <th className="px-3 py-2 text-left font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {competitors.map((c, i) => {
            const lowestTier = c.pricing?.tiers?.[0];
            return (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.positioning?.tagline ?? "—"}</td>
                <td className="px-3 py-2">{lowestTier ? `${lowestTier.name}: ${lowestTier.monthly_price ?? lowestTier.annual_price ?? "—"}` : "—"}</td>
                <td className="px-3 py-2">{c.terms?.min_contract_length?.value ?? "—"}</td>
                <td className="px-3 py-2">{c.pricing?.free_trial?.value ?? "—"}</td>
                <td className="px-3 py-2">{c.capabilities?.features?.length ?? 0}</td>
                <td className="px-3 py-2"><Conf c={c.overall_confidence ?? "low"} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Conf({ c }: { c: "high" | "medium" | "low" }) {
  const cls = c === "high" ? "bg-emerald-500/10 text-emerald-600" : c === "low" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground";
  return <span className={`rounded px-2 py-0.5 text-[10px] uppercase ${cls}`}>{c}</span>;
}

function CompetitorCard({ c }: { c: Competitor }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{c.name}</h3>
          {c.url ? (
            <a href={c.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              {c.url} <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
        <Conf c={c.overall_confidence ?? "low"} />
      </div>
      {c.positioning?.tagline ? <p className="mt-3 text-sm italic">"{c.positioning.tagline}"</p> : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Axis title="Pricing & plans">
          {c.pricing?.tiers?.length ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground"><th className="text-left">Tier</th><th className="text-left">Monthly</th><th className="text-left">Annual</th><th className="text-left">Per</th></tr>
              </thead>
              <tbody>
                {c.pricing.tiers.map((t, i) => (
                  <tr key={i} className="border-t border-border/40">
                    <td className="py-1 font-medium">{t.name}</td>
                    <td>{t.monthly_price ?? "—"}</td>
                    <td>{t.annual_price ?? "—"}</td>
                    <td className="text-muted-foreground">{t.per_seat_or_usage ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty />}
          <KV k="Free trial" v={c.pricing?.free_trial?.value} />
          <KV k="Money back" v={c.pricing?.money_back?.value} />
          {c.pricing?.discounts_promos?.length ? <TagList items={c.pricing.discounts_promos} /> : null}
        </Axis>

        <Axis title="Contract & terms">
          <KV k="Min contract" v={c.terms?.min_contract_length?.value} />
          <KV k="Auto-renewal" v={c.terms?.auto_renewal?.value} />
          <KV k="Cancellation" v={c.terms?.cancellation_notice?.value} />
          <KV k="Payment terms" v={c.terms?.payment_terms?.value} />
          <KV k="SLA uptime" v={c.terms?.sla_uptime?.value} />
          <KV k="Refund policy" v={c.terms?.refund_policy?.value} />
        </Axis>

        <Axis title="Capabilities">
          {c.capabilities?.features?.length ? (
            <ul className="space-y-1 text-xs">
              {c.capabilities.features.slice(0, 12).map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <FeatureBadge cls={f.classification} />
                  <span>{f.name}</span>
                  {f.notes ? <span className="text-muted-foreground">— {f.notes}</span> : null}
                </li>
              ))}
            </ul>
          ) : <Empty />}
          {c.capabilities?.integrations?.length ? <KV k="Integrations" v={c.capabilities.integrations.slice(0, 8).join(", ")} /> : null}
          {c.capabilities?.security_compliance?.length ? <KV k="Compliance" v={c.capabilities.security_compliance.join(", ")} /> : null}
        </Axis>

        <Axis title="Positioning & GTM">
          {c.positioning?.target_segments?.length ? <KV k="Segments" v={c.positioning.target_segments.join(", ")} /> : null}
          {c.positioning?.differentiators?.length ? (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Differentiators</div>
              <ul className="list-inside list-disc text-xs">{c.positioning.differentiators.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </div>
          ) : null}
          {c.positioning?.proof_points?.length ? (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Proof points</div>
              <ul className="text-xs">{c.positioning.proof_points.map((p, i) => <li key={i}><span className="font-medium">[{p.type}]</span> {p.label}{p.detail ? ` — ${p.detail}` : ""}</li>)}</ul>
            </div>
          ) : null}
          {c.positioning?.incentives_active?.length ? <TagList items={c.positioning.incentives_active} /> : null}
        </Axis>
      </div>

      {c.source_urls?.length ? (
        <details className="mt-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer">Sources ({c.source_urls.length})</summary>
          <ul className="mt-1 space-y-0.5">
            {c.source_urls.slice(0, 30).map((u, i) => (
              <li key={i}>
                <a href={u} target="_blank" rel="noreferrer" className="hover:underline">{u}</a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function Axis({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-background/50 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}

function KV({ k, v }: { k: string; v?: string | null }) {
  if (!v) return null;
  return <div className="text-xs"><span className="font-medium text-muted-foreground">{k}:</span> {v}</div>;
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((s, i) => <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{s}</span>)}
    </div>
  );
}

function FeatureBadge({ cls }: { cls: Capability["classification"] }) {
  const map = {
    advantage: "bg-emerald-500/10 text-emerald-600",
    parity: "bg-muted text-muted-foreground",
    gap: "bg-red-500/10 text-red-600",
    unknown: "bg-amber-500/10 text-amber-600",
  } as const;
  return <span className={`rounded px-1.5 py-0.5 text-[9px] uppercase ${map[cls]}`}>{cls}</span>;
}

function Empty() {
  return <div className="text-xs text-muted-foreground">No data available.</div>;
}
