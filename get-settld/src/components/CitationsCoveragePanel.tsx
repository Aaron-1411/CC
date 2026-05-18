import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { citationsForSource } from "@/lib/citations";
import type { ScoreTrace } from "@/lib/autoScore";

interface TraceContext {
  trace: ScoreTrace;
  location?: string;
}

interface Props {
  traces: TraceContext[];
  title?: string;
}

/** Audits every ScoreTrace on a page and surfaces any whose `source` string
 *  does NOT resolve to a citation in the central registry. Helps engineers
 *  catch un-cited inputs before shipping. */
export default function CitationsCoveragePanel({
  traces,
  title = "Citations coverage",
}: Props) {
  const { covered, gaps } = useMemo(() => {
    const covered: TraceContext[] = [];
    const gaps: TraceContext[] = [];
    for (const t of traces) {
      const hits = citationsForSource(t.trace.source);
      (hits.length ? covered : gaps).push(t);
    }
    return { covered, gaps };
  }, [traces]);

  if (!traces.length) return null;
  const pct = Math.round((covered.length / traces.length) * 100);
  const allGood = gaps.length === 0;

  return (
    <Card className="p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          {allGood ? (
            <ShieldCheck className="w-4 h-4 text-success" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-warning" />
          )}
          <h4 className="font-serif font-bold text-brand">{title}</h4>
        </div>
        <Badge
          className={`border-0 gap-1 ${
            allGood ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
          }`}
        >
          {covered.length}/{traces.length} cited · {pct}%
        </Badge>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
        <div
          className={`h-full ${allGood ? "bg-success" : "bg-warning"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {allGood ? (
        <p className="text-xs text-muted-foreground">
          Every score trace on this page resolves to a registered citation.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            The following traces declare a data source that is not mapped to any
            entry in <code className="font-mono">src/lib/citations.ts</code>. Add
            a citation or update <code className="font-mono">citationsForSource()</code>{" "}
            keyword matches.
          </p>
          <ul className="space-y-2">
            {gaps.map((g, i) => (
              <li
                key={`${g.trace.label}-${i}`}
                className="rounded-md border border-warning/40 bg-warning/5 p-3"
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-foreground">
                    {g.trace.label}
                  </p>
                  {g.location && (
                    <Badge variant="outline" className="text-[10px]">
                      {g.location}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Declared source:{" "}
                  <span className="font-mono text-foreground">
                    {g.trace.source || "(empty)"}
                  </span>
                </p>
                <p className="text-[10px] text-warning mt-1">
                  No citation match · field mapping missing
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
