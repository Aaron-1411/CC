// "What data we used" panel — visible on Home and Decide.
// Lists every live source feeding the verdict, with last-updated timestamps,
// and lets users click each one to see exactly how it affects the verdict.
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Database, ExternalLink, ChevronRight, ShieldCheck } from "lucide-react";
import { CITATIONS, type Citation } from "@/lib/citations";

type ImpactRow = { factor: string; weight: number; effect: string };

interface DataSourceMeta {
  citation: Citation;
  /** One-liner summary shown in the list */
  oneLiner: string;
  /** Concrete effect on the verdict — surfaced in the drawer */
  verdictImpact: ImpactRow[];
}

// Curated list of the live sources that actually power the verdict.
// Weights here approximate how much the source moves the overall verdict score
// (0–1). They're indicative, sourced from src/lib/verdict.ts pillar weights.
const SOURCES: DataSourceMeta[] = [
  {
    citation: CITATIONS.landRegistryPPD,
    oneLiner: "Sold-price comparables for the AVM — the headline mid-valuation.",
    verdictImpact: [
      { factor: "Value vs. asking price", weight: 0.35, effect: "Drives the AVM mid-estimate (p10/p50/p90). Verdict turns red when asking is >10% over p50." },
      { factor: "Area benchmarks", weight: 0.05, effect: "12-month rolling median £/sqft used as the affordability anchor." },
    ],
  },
  {
    citation: CITATIONS.onsHPI,
    oneLiner: "House Price Index for the local authority — drives expected return bands.",
    verdictImpact: [
      { factor: "Expected return", weight: 0.10, effect: "5y geometric mean of LAD HPI used for the Monte-Carlo growth distribution." },
      { factor: "Time-decay weighting", weight: 0.05, effect: "HPI re-bases older sold comps to today's price level." },
    ],
  },
  {
    citation: CITATIONS.epcOpen,
    oneLiner: "EPC certificates — running costs and condition adjustment.",
    verdictImpact: [
      { factor: "True monthly cost", weight: 0.10, effect: "EPC-derived energy cost added to mortgage + council tax + insurance." },
      { factor: "AVM condition adjustment", weight: 0.05, effect: "D-or-worse EPC reduces comp price by ~3–7%." },
    ],
  },
  {
    citation: CITATIONS.policeUk,
    oneLiner: "Street-level crime — feeds the Safety pillar of right-fit.",
    verdictImpact: [
      { factor: "Right-fit safety score", weight: 0.07, effect: "All-crime count per 1,000 residents, normalised against national median." },
    ],
  },
  {
    citation: CITATIONS.dftPTAL,
    oneLiner: "Public-transport accessibility + journey times — commute scoring.",
    verdictImpact: [
      { factor: "Right-fit commute score", weight: 0.08, effect: "PTAL band + journey minutes to the nearest hub feed the commute weight." },
    ],
  },
];

interface Props {
  /** Compact = no drill-down, used inside dense pages. */
  compact?: boolean;
  /** Optional override of which citation IDs to show. */
  only?: Array<keyof typeof CITATIONS>;
  title?: string;
  description?: string;
}

export default function DataSourcesPanel({
  compact = false,
  only,
  title = "What data we used",
  description = "Every number in the verdict traces back to one of these public datasets. Tap any source to see exactly how it changes the answer.",
}: Props) {
  const [active, setActive] = useState<DataSourceMeta | null>(null);
  const list = only ? SOURCES.filter((s) => only.includes(s.citation.id as keyof typeof CITATIONS)) : SOURCES;

  return (
    <>
      <Card className="p-6 shadow-soft">
        <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="font-serif font-bold text-brand text-lg">{title}</h3>
          </div>
          <Badge className="bg-brand-muted text-primary border-0 gap-1">
            <ShieldCheck className="w-3 h-3" /> {list.length} live source{list.length === 1 ? "" : "s"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4 max-w-2xl">{description}</p>

        <ul className="grid gap-2 sm:grid-cols-2">
          {list.map((s) => (
            <li key={s.citation.id}>
              <button
                type="button"
                onClick={() => !compact && setActive(s)}
                disabled={compact}
                className="w-full text-left rounded-lg border border-border/70 bg-background p-3 hover:border-primary/40 hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors group disabled:cursor-default"
                aria-label={`See how ${s.citation.dataset} affects the verdict`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.citation.dataset}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{s.oneLiner}</p>
                  </div>
                  {!compact && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Updated {s.citation.lastUpdated}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{s.citation.refresh}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-brand flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  {active.citation.dataset}
                </DialogTitle>
                <DialogDescription>
                  {active.citation.publisher} · {active.citation.licence} · last updated{" "}
                  <span className="font-mono">{active.citation.lastUpdated}</span> · {active.citation.refresh.toLowerCase()}
                </DialogDescription>
              </DialogHeader>

              <section className="mt-3">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  How it changes the verdict
                </h4>
                <ul className="space-y-2">
                  {active.verdictImpact.map((row) => (
                    <li key={row.factor} className="rounded-md border bg-background p-3">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{row.factor}</p>
                        <Badge className="bg-brand-muted text-primary border-0 font-mono text-[10px]">
                          weight ×{row.weight.toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{row.effect}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-4">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Field mapping
                </h4>
                <div className="rounded-md bg-muted/40 p-3 space-y-1.5">
                  {active.citation.fieldMapping.map((f) => (
                    <div key={f.datasetField} className="grid grid-cols-12 gap-2 text-[11px]">
                      <code className="col-span-5 font-mono text-foreground break-words">{f.datasetField}</code>
                      <span className="col-span-1 text-muted-foreground text-center">→</span>
                      <span className="col-span-6 text-muted-foreground">{f.mappedTo}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="mt-4 flex justify-between items-center gap-2 flex-wrap">
                <a
                  href={active.citation.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Open dataset source <ExternalLink className="w-3 h-3" />
                </a>
                <Button size="sm" variant="outline" onClick={() => setActive(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
