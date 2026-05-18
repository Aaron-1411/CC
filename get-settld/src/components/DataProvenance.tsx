import { Info, ShieldCheck, ShieldAlert, Sparkles, FunctionSquare, BookOpen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { METRIC_PROVENANCE, MetricKey, DataConfidence, confidenceLabel } from "@/data/areas";
import CalculationNotesDrawer from "@/components/CalculationNotesDrawer";
import { cn } from "@/lib/utils";

const dotColor = (c: DataConfidence) =>
  c === "high" ? "bg-success" : c === "medium" ? "bg-warning" : "bg-muted-foreground";

const ConfIcon = ({ c, className }: { c: DataConfidence; className?: string }) =>
  c === "high" ? <ShieldCheck className={cn("w-3.5 h-3.5 text-success", className)} />
  : c === "medium" ? <ShieldAlert className={cn("w-3.5 h-3.5 text-warning", className)} />
  : <Sparkles className={cn("w-3.5 h-3.5 text-muted-foreground", className)} />;

const fmtDate = (iso: string) => {
  const d = new Date(iso.length === 7 ? iso + "-01" : iso);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

interface Props {
  metric: MetricKey;
  /** Override confidence (e.g. synthetic area downgrades to "low"). */
  overrideConfidence?: DataConfidence;
  className?: string;
}

export default function DataProvenance({ metric, overrideConfidence, className }: Props) {
  const p = METRIC_PROVENANCE[metric];
  const c = overrideConfidence ?? p.confidence;
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Data source for ${p.label}`}
        className={cn(
          "inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors",
          className,
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColor(c))} aria-hidden />
        <Info className="w-3 h-3" />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 p-3 text-xs">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-serif font-bold text-brand text-sm leading-tight">{p.label}</p>
          <Badge variant="outline" className="gap-1 font-normal">
            <ConfIcon c={c} />
            {confidenceLabel(c)}
          </Badge>
        </div>
        <dl className="space-y-1.5">
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Source</dt>
            <dd className="text-foreground">
              {p.sourceUrl ? (
                <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-brand">
                  {p.source}
                </a>
              ) : p.source}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Last updated</dt>
            <dd className="font-mono text-foreground">{fmtDate(p.lastUpdated)}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Method</dt>
            <dd className="text-muted-foreground leading-relaxed">{p.method}</dd>
          </div>
          {c === "low" && (
            <p className="mt-2 pt-2 border-t text-muted-foreground italic">
              This area is a regional-benchmark estimate, not a direct measurement. Use directional only.
            </p>
          )}
          <div className="mt-2 pt-2 border-t space-y-1.5">
            <CalculationNotesDrawer metric={metric} overrideConfidence={overrideConfidence}>
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded border border-brand/30 bg-brand-muted/40 px-2 py-1 text-[10px] uppercase tracking-widest text-brand hover:bg-brand-muted transition-colors"
              >
                <FunctionSquare className="w-3 h-3" /> View calculation notes
              </button>
            </CalculationNotesDrawer>
            <a
              href={`#methodology-${metric}`}
              className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] text-brand hover:underline"
            >
              <BookOpen className="w-3 h-3" /> Learn how this score works
            </a>
          </div>
        </dl>
      </PopoverContent>
    </Popover>
  );
}

export function ConfidenceBadge({ confidence, className }: { confidence: DataConfidence; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-normal text-[10px] uppercase tracking-widest",
        confidence === "high" && "border-success/40 text-success",
        confidence === "medium" && "border-warning/50 text-warning",
        confidence === "low" && "border-muted-foreground/40 text-muted-foreground",
        className,
      )}
    >
      <ConfIcon c={confidence} />
      {confidenceLabel(confidence)}
    </Badge>
  );
}
