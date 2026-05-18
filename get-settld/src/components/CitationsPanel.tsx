import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Database, ExternalLink, ShieldCheck, ChevronRight, GitBranch } from "lucide-react";
import { Citation, citationsForSource, resolveCitations } from "@/lib/citations";
import type { ScoreTrace } from "@/lib/autoScore";

interface TraceContext {
  trace: ScoreTrace;
  /** Where this trace appears (e.g. "Appreciation · Transport factor") */
  location?: string;
}

interface Props {
  /** Source strings drawn from each ScoreTrace.source used on the page */
  sources?: string[];
  /** Optional explicit citations override (skips resolveCitations) */
  citations?: Citation[];
  /** Score traces on this page - enables drill-down from a citation to the
   *  specific score inputs/formulae it feeds. */
  traces?: TraceContext[];
  title?: string;
  description?: string;
}

export default function CitationsPanel({
  sources = [],
  citations,
  traces = [],
  title = "Live-data citations",
  description = "Click any dataset to see exactly which score inputs it feeds.",
}: Props) {
  const tracesSources = useMemo(
    () => Array.from(new Set([...sources, ...traces.map((t) => t.trace.source)])),
    [sources, traces],
  );
  const list = citations ?? resolveCitations(tracesSources);
  const [active, setActive] = useState<Citation | null>(null);

  if (!list.length) return null;

  // For the active citation, find every trace whose source resolves to it.
  const activeTraces = active
    ? traces.filter((t) =>
        citationsForSource(t.trace.source).some((c) => c.id === active.id),
      )
    : [];

  return (
    <>
      <Card className="p-6 shadow-soft">
        <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-brand" />
            <h4 className="font-serif font-bold text-brand">{title}</h4>
          </div>
          <Badge className="bg-brand-muted text-brand border-0 gap-1">
            <ShieldCheck className="w-3 h-3" /> {list.length} live source{list.length === 1 ? "" : "s"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{description}</p>

        <ul className="divide-y">
          {list.map((c) => {
            const feedsCount = traces.filter((t) =>
              citationsForSource(t.trace.source).some((x) => x.id === c.id),
            ).length;
            return (
              <li key={c.id} className="py-4 first:pt-2 last:pb-0">
                <button
                  type="button"
                  onClick={() => setActive(c)}
                  className="w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md"
                  aria-label={`Drill into ${c.dataset}`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm text-foreground group-hover:text-brand transition-colors">
                        {c.dataset}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.publisher} · {c.licence}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Last updated</p>
                      <p className="font-mono text-xs font-semibold text-brand">{c.lastUpdated}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Refresh: {c.refresh}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-md bg-muted/40 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Field mapping
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-brand font-semibold">
                        {feedsCount > 0 ? (
                          <>
                            <GitBranch className="w-3 h-3" />
                            Feeds {feedsCount} score{feedsCount === 1 ? "" : "s"} · drill in
                          </>
                        ) : (
                          <>Tap to drill in</>
                        )}
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {c.fieldMapping.map((f) => (
                        <li key={f.datasetField} className="grid grid-cols-12 gap-2 text-[11px]">
                          <code className="col-span-5 font-mono text-foreground break-words">
                            {f.datasetField}
                          </code>
                          <span className="col-span-1 text-muted-foreground text-center">→</span>
                          <span className="col-span-6 text-muted-foreground">{f.mappedTo}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>

                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline mt-2"
                >
                  View source <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            );
          })}
        </ul>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-brand flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {active.dataset}
                </DialogTitle>
                <DialogDescription>
                  {active.publisher} · {active.licence} · last updated{" "}
                  <span className="font-mono">{active.lastUpdated}</span> · refresh{" "}
                  {active.refresh}
                </DialogDescription>
              </DialogHeader>

              <section className="mt-2">
                <h5 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Dataset → internal mapping
                </h5>
                <div className="rounded-md bg-muted/40 p-3 space-y-1.5">
                  {active.fieldMapping.map((f) => (
                    <div key={f.datasetField} className="grid grid-cols-12 gap-2 text-[11px]">
                      <code className="col-span-5 font-mono text-foreground break-words">
                        {f.datasetField}
                      </code>
                      <span className="col-span-1 text-muted-foreground text-center">→</span>
                      <span className="col-span-6 text-muted-foreground">{f.mappedTo}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-4">
                <h5 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Score inputs this dataset feeds on this page ({activeTraces.length})
                </h5>
                {activeTraces.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No score traces on this page resolve to this dataset directly. The
                    citation is shown because the underlying composite uses it upstream.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {activeTraces.map((t, idx) => (
                      <li
                        key={`${t.trace.label}-${idx}`}
                        className="rounded-md border bg-background p-3"
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-sm text-foreground">
                            {t.trace.label}
                          </p>
                          <div className="flex items-center gap-2">
                            {t.location && (
                              <Badge variant="outline" className="text-[10px]">
                                {t.location}
                              </Badge>
                            )}
                            <Badge className="bg-brand-muted text-brand border-0 font-mono text-[10px]">
                              score {t.trace.value}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 mb-1">
                          Inputs
                        </p>
                        <ul className="space-y-1">
                          {t.trace.inputs.map((inp, i) => (
                            <li
                              key={`${inp.label}-${i}`}
                              className="grid grid-cols-12 gap-2 text-[11px]"
                            >
                              <span className="col-span-7 text-muted-foreground">
                                {inp.label}
                              </span>
                              <span className="col-span-3 font-mono text-foreground text-right">
                                {String(inp.raw)}
                              </span>
                              <span className="col-span-2 font-mono text-brand text-right">
                                {inp.weight !== undefined ? `×${inp.weight}` : "-"}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Formula
                          </div>
                          <code className="text-[11px] font-mono text-foreground bg-muted/40 rounded px-2 py-1 block break-words">
                            {t.trace.formula}
                          </code>
                          <div className="text-[10px] text-muted-foreground">
                            Trace source: <span className="italic">{t.trace.source}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="mt-4 flex justify-between items-center gap-2 flex-wrap">
                <a
                  href={active.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
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
