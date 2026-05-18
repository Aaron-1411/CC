import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Section, StatCard } from "@/components/ui-bits";
import { DetailTable, TypePill } from "@/components/DetailTable";
import { buildRecommendations, computeGoalProgress, scoreFinancialHealth, suggestAllocation, type Recommendation } from "@/lib/strategy";
import { fmtGBP, fmtPct } from "@/lib/uk-tax";
import { Sparkles, Target, ArrowRight, AlertTriangle, TrendingUp, ShieldCheck } from "lucide-react";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";

export const Route = createFileRoute("/strategy")({
  head: () => ({
    meta: [
      { title: "Strategy & Optimisations — Sterling" },
      { name: "description", content: "Personalised recommendations and a long-term financial strategy based on your goals." },
    ],
  }),
  component: StrategyPage,
});

const PRIO_TONE: Record<Recommendation["priority"], "warning" | "primary" | "default" | "success"> = {
  critical: "warning",
  high: "primary",
  medium: "default",
  low: "default",
};

function StrategyPage() {
  const [s, set] = useStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const recs = buildRecommendations(s);
  const goals = computeGoalProgress(s);
  const health = scoreFinancialHealth(s);
  const horizon = Math.max(1, s.goals.retirementAge - s.profile.age);
  const allocation = suggestAllocation(s.goals.riskAppetite, horizon);

  const setGoal = <K extends keyof typeof s.goals>(k: K, v: (typeof s.goals)[K]) =>
    set((st) => ({ ...st, goals: { ...st.goals, [k]: v } }));

  return (
    <div ref={reportRef}>
      <PageHeader
        eyebrow="Personalised plan"
        title="Your strategy & optimisations"
        description="What to do next, in order, to make the most of your money — based on UK tax rules and your goals."
      >
        <DownloadPdfButton
          targetRef={reportRef}
          filename={`sterling-strategy-${new Date().toISOString().slice(0, 10)}.pdf`}
        />
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Financial health"
          value={`${health.score}/100`}
          hint={health.score >= 75 ? "Looking strong" : health.score >= 50 ? "Solid foundations" : "Room to improve"}
          tone={health.score >= 75 ? "success" : health.score >= 50 ? "primary" : "warning"}
        />
        <StatCard label="Top actions" value={recs.filter((r) => r.priority === "critical" || r.priority === "high").length} hint="High-impact moves to make" />
        <StatCard label="Goals on track" value={`${goals.filter((g) => g.onTrack === true).length}/${goals.length}`} />
        <StatCard label="Years to retirement" value={horizon} hint={`Targeting age ${s.goals.retirementAge}`} />
      </div>

      <Section title="Financial health pillars" description="Five quick checks that drive most of your long-term outcomes.">
        <div className="grid md:grid-cols-5 gap-2">
          {health.pillars.map((p) => (
            <Card key={p.label} className="!p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{p.label}</div>
              <div className="mt-1 font-display text-xl font-semibold">{Math.round(p.score)}</div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${p.score >= 75 ? "bg-success" : p.score >= 50 ? "bg-primary" : "bg-warning"}`}
                  style={{ width: `${Math.min(100, p.score)}%` }}
                />
              </div>
              <div className="mt-1.5 text-[11px] text-muted-foreground leading-tight">{p.note}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Your long-term goals"
        description="Set what you're aiming for — every recommendation is tuned to these."
      >
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <Card>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Retirement</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Retire at age">
                <input type="number" className="ipt num" value={s.goals.retirementAge} onChange={(e) => setGoal("retirementAge", +e.target.value)} />
              </Field>
              <Field label="Income wanted (£/yr, today's money)">
                <input type="number" className="ipt num" value={s.goals.retirementIncome} onChange={(e) => setGoal("retirementIncome", +e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Safety net & risk</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Emergency fund (months)">
                <input type="number" className="ipt num" value={s.goals.emergencyFundMonths} onChange={(e) => setGoal("emergencyFundMonths", +e.target.value)} />
              </Field>
              <Field label="Risk appetite">
                <select className="ipt" value={s.goals.riskAppetite} onChange={(e) => setGoal("riskAppetite", e.target.value as any)}>
                  <option value="cautious">Cautious — less ups and downs</option>
                  <option value="balanced">Balanced — middle ground</option>
                  <option value="growth">Growth — long horizon, can stomach drops</option>
                </select>
              </Field>
            </div>
          </Card>

          <Card className="md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> House purchase goal</h4>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={s.goals.housePurchase.enabled} onChange={(e) => setGoal("housePurchase", { ...s.goals.housePurchase, enabled: e.target.checked })} />
                Active
              </label>
            </div>
            {s.goals.housePurchase.enabled && (
              <div className="grid grid-cols-3 gap-3">
                <Field label="Target property price (£)">
                  <input type="number" className="ipt num" value={s.goals.housePurchase.targetPrice} onChange={(e) => setGoal("housePurchase", { ...s.goals.housePurchase, targetPrice: +e.target.value })} />
                </Field>
                <Field label="Deposit needed (£)">
                  <input type="number" className="ipt num" value={s.goals.housePurchase.targetDeposit} onChange={(e) => setGoal("housePurchase", { ...s.goals.housePurchase, targetDeposit: +e.target.value })} />
                </Field>
                <Field label="By year">
                  <input type="number" className="ipt num" value={s.goals.housePurchase.targetYear} onChange={(e) => setGoal("housePurchase", { ...s.goals.housePurchase, targetYear: +e.target.value })} />
                </Field>
              </div>
            )}
          </Card>
        </div>

        <DetailTable
          caption="Where you stand against each goal right now."
          columns={[
            { key: "name", header: "Goal", render: (r: any) => <span className="font-medium">{r.name}</span> },
            { key: "progress", header: "Progress", hint: "How far along you are", render: (r: any) => (
              <div className="min-w-[120px]">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${r.onTrack === true ? "bg-success" : r.onTrack === false ? "bg-warning" : "bg-primary"}`} style={{ width: `${r.pct * 100}%` }} />
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{(r.pct * 100).toFixed(0)}%</div>
              </div>
            )},
            { key: "current", header: "Today", align: "right", render: (r: any) => <span>{fmtGBP(r.current)}</span> },
            { key: "target", header: "Target", align: "right", render: (r: any) => <span className="font-semibold">{fmtGBP(r.target)}</span> },
            { key: "monthly", header: "Monthly to reach", hint: "Rough £/mo to get there at zero growth", align: "right", render: (r: any) => <span>{r.monthlyNeeded != null ? fmtGBP(r.monthlyNeeded) : "—"}</span> },
            { key: "status", header: "Status", render: (r: any) => r.onTrack === true ? <TypePill tone="success">On track</TypePill> : r.onTrack === false ? <TypePill tone="warning">Behind</TypePill> : <TypePill>Tracking</TypePill> },
          ]}
          rows={goals as any}
          empty="Set a goal above to see progress."
        />
      </Section>

      <Section
        title="Recommended actions, in priority order"
        description="What to focus on next. The order considers tax efficiency, free money, and your goals."
      >
        {recs.length === 0 ? (
          <Card><p className="text-sm text-muted-foreground">Excellent — no obvious optimisations right now. Keep contributions on autopilot and review yearly.</p></Card>
        ) : (
          <div className="space-y-3">
            {recs.map((r, i) => (
              <Card key={r.id}>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{r.title}</h4>
                      <TypePill tone={PRIO_TONE[r.priority]}>{r.priority}</TypePill>
                      <TypePill>{r.category}</TypePill>
                      <span className="text-[10px] text-muted-foreground">· {r.effort}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5"><span className="text-foreground/80 font-medium">Why:</span> {r.why}</p>
                    <p className="text-sm mt-1.5"><span className="text-foreground/80 font-medium">Do this:</span> {r.action}</p>
                    {r.estimatedBenefit && (
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-gradient-gold text-gold-foreground text-xs font-semibold px-2.5 py-1 rounded">
                        <TrendingUp className="h-3 w-3" /> {r.estimatedBenefit}
                      </div>
                    )}
                    {r.ctaRoute && (
                      <div className="mt-2">
                        <Link to={r.ctaRoute as any} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                          {r.ctaLabel ?? "Open"} <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Suggested asset mix"
        description={`Rough glide-path for a ${s.goals.riskAppetite} investor with ~${horizon} years to your main goal. General guidance, not personal advice.`}
      >
        <DetailTable
          columns={[
            { key: "name", header: "Asset", render: (r: any) => <span className="font-medium">{r.name}</span> },
            { key: "pct", header: "Suggested %", align: "right", render: (r: any) => <span className="font-semibold">{r.pct.toFixed(0)}%</span> },
            { key: "note", header: "Why", render: (r: any) => <span className="text-muted-foreground text-xs">{r.note}</span> },
          ]}
          rows={allocation.map((a, i) => ({ id: i, ...a }))}
        />
      </Section>

      <div className="rounded-lg bg-muted/40 border border-dashed p-3 text-xs text-muted-foreground flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-warning-foreground shrink-0 mt-0.5" />
        <p>General UK guidance for the 2025/26 tax year, not personal financial advice. For complex situations (high income, IHT, business owners), speak to a regulated adviser.</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}
