import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Section } from "@/components/ui-bits";
import { computeOpportunities, type Opportunity } from "@/lib/eligibility";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/eligibility")({
  head: () => ({
    meta: [
      { title: "Eligibility — Sterling" },
      { name: "description", content: "Personalised list of UK schemes, allowances and reliefs you qualify for." },
    ],
  }),
  component: EligibilityPage,
});

const CATS: Opportunity["category"][] = ["ISA", "Pension", "Tax", "Property", "Family", "Savings"];

function EligibilityPage() {
  const [s] = useStore();
  const opps = computeOpportunities(s);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? opps : opps.filter((o) => o.category === filter);
  const counts = {
    eligible: opps.filter((o) => o.status === "eligible").length,
    review: opps.filter((o) => o.status === "review").length,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Personalised"
        title="UK schemes & eligibility"
        description={`${counts.eligible} schemes you qualify for · ${counts.review} need review · based on your profile.`}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <Pill active={filter === "all"} onClick={() => setFilter("all")}>All ({opps.length})</Pill>
        {CATS.map((c) => {
          const n = opps.filter((o) => o.category === c).length;
          if (n === 0) return null;
          return <Pill key={c} active={filter === c} onClick={() => setFilter(c)}>{c} ({n})</Pill>;
        })}
      </div>

      <Section title="Opportunities">
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((o) => (
            <Card key={o.id}>
              <div className="flex items-start gap-3">
                <StatusIcon status={o.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{o.title}</h4>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">{o.category}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{o.summary}</p>
                  <p className="text-xs text-foreground/80 mt-2 leading-relaxed">{o.details}</p>
                  {o.potentialBenefit && (
                    <div className="mt-3 inline-block bg-gradient-gold text-gold-foreground text-xs font-semibold px-2.5 py-1 rounded">
                      {o.potentialBenefit}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <p className="text-xs text-muted-foreground text-center mt-8">
        Information is based on UK rules for the {`2025/26`} tax year and is general guidance, not personal financial advice.
      </p>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function StatusIcon({ status }: { status: Opportunity["status"] }) {
  if (status === "eligible") return <div className="h-9 w-9 rounded-lg bg-success/15 text-success flex items-center justify-center shrink-0"><CheckCircle2 className="h-5 w-5" /></div>;
  if (status === "review") return <div className="h-9 w-9 rounded-lg bg-warning/20 text-warning-foreground flex items-center justify-center shrink-0"><AlertCircle className="h-5 w-5" /></div>;
  return <div className="h-9 w-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0"><XCircle className="h-5 w-5" /></div>;
}
