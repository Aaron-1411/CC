import { ReactNode } from "react";
import { Calculator, ExternalLink, FunctionSquare } from "lucide-react";
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription,
  DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CALC_NOTES } from "@/data/calculationNotes";
import { METRIC_PROVENANCE, MetricKey, confidenceLabel, DataConfidence } from "@/data/areas";
import { cn } from "@/lib/utils";

interface Props {
  metric: MetricKey;
  /** Optional override for confidence (e.g. synthetic area). */
  overrideConfidence?: DataConfidence;
  /** Custom trigger; defaults to a small "fx" pill. */
  children?: ReactNode;
  className?: string;
}

const fmtDate = (iso: string) => {
  const d = new Date(iso.length === 7 ? iso + "-01" : iso);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

const confTone = (c: DataConfidence) =>
  c === "high" ? "border-success/40 text-success"
  : c === "medium" ? "border-warning/50 text-warning"
  : "border-muted-foreground/40 text-muted-foreground";

export default function CalculationNotesDrawer({ metric, overrideConfidence, children, className }: Props) {
  const note = CALC_NOTES[metric];
  const prov = METRIC_PROVENANCE[metric];
  const c = overrideConfidence ?? prov.confidence;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children ?? (
          <button
            type="button"
            aria-label={`Calculation notes for ${prov.label}`}
            className={cn(
              "inline-flex items-center gap-1 rounded border border-brand/20 bg-brand-muted/40 px-1.5 py-0.5",
              "text-[10px] uppercase tracking-widest text-brand hover:bg-brand-muted hover:border-brand/40 transition-colors",
              className,
            )}
          >
            <FunctionSquare className="w-3 h-3" /> fx
          </button>
        )}
      </DrawerTrigger>
      <DrawerContent className="max-h-[88vh]">
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader className="text-left">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Calculator className="w-3 h-3" /> Calculation notes
            </p>
            <DrawerTitle className="font-serif text-2xl text-brand">{prov.label}</DrawerTitle>
            <DrawerDescription className="text-sm">{note.summary}</DrawerDescription>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <Badge variant="outline" className={cn("font-normal text-[10px] uppercase tracking-widest", confTone(c))}>
                {confidenceLabel(c)}
              </Badge>
              <span className="text-muted-foreground">
                Source:&nbsp;
                {prov.sourceUrl ? (
                  <a href={prov.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline decoration-dotted hover:text-brand">
                    {prov.source} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : prov.source}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono text-muted-foreground">Updated {fmtDate(prov.lastUpdated)}</span>
            </div>
          </DrawerHeader>

          <ScrollArea className="px-4 pb-2 max-h-[60vh]">
            <Section title="Formula">
              <div className="space-y-1.5">
                {note.formulas.map((f, i) => (
                  <pre key={i} className="bg-muted/50 border rounded-md px-3 py-2 text-[12px] font-mono whitespace-pre-wrap leading-relaxed">
                    {f}
                  </pre>
                ))}
              </div>
            </Section>

            <Section title="Assumptions">
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/90 marker:text-brand/60">
                {note.assumptions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </Section>

            <Section title="Normalization">
              <ol className="list-decimal pl-5 space-y-1 text-sm text-foreground/90 marker:text-brand/60">
                {note.normalization.map((n, i) => <li key={i}>{n}</li>)}
              </ol>
            </Section>

            {note.example && (
              <Section title="Worked example">
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Inputs</p>
                  <ul className="font-mono text-xs text-foreground/90 space-y-0.5 mb-3">
                    {note.example.inputs.map((x, i) => <li key={i}>· {x}</li>)}
                  </ul>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Result</p>
                  <p className="font-serif font-bold text-brand">{note.example.result}</p>
                </div>
              </Section>
            )}

            {c === "low" && (
              <p className="mt-2 mb-4 text-xs italic text-muted-foreground">
                For this area, the metric uses a regional benchmark instead of a direct measurement.
                Treat the value as directional only.
              </p>
            )}
          </ScrollArea>

          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline" className="border-brand/30 text-brand hover:bg-brand-muted">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mt-4 first:mt-2">
    <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{title}</h4>
    {children}
  </div>
);
