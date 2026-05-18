import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, FileCode, ClipboardCopy, Share2, BookOpen, ExternalLink } from "lucide-react";
import { METRIC_PROVENANCE, MetricKey, confidenceLabel, DataConfidence } from "@/data/areas";
import { METHODOLOGY_VERSION, METHODOLOGY_VERSION_DATE, METHODOLOGY_CHANGELOG } from "@/data/methodologyVersion";
import CalculationNotesDrawer from "@/components/CalculationNotesDrawer";
import { cn } from "@/lib/utils";
import { copyText, shareLink } from "@/lib/share";
import {
  buildMethodologyMarkdown,
  downloadMethodologyPdf,
  downloadMethodologyCsv,
  downloadMethodologyMarkdown,
  METHODOLOGY_INTRO,
} from "@/lib/methodologyExport";
import { toast } from "@/hooks/use-toast";

const ORDER: MetricKey[] = [
  "medianPrice", "growth5y", "yield", "crime",
  "schools", "transport", "green",
  "commute", "schoolBreakdown", "investment",
];

const fmtDate = (iso: string) => {
  const d = new Date(iso.length === 7 ? iso + "-01" : iso);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

const confTone = (c: DataConfidence) =>
  c === "high" ? "border-success/40 text-success"
  : c === "medium" ? "border-warning/50 text-warning"
  : "border-muted-foreground/40 text-muted-foreground";

interface Props {
  /** Optional anchor URL for "Share" button (defaults to the current page + #methodology). */
  shareUrl?: string;
}

export default function MethodologySection({ shareUrl }: Props) {
  const url = shareUrl ?? (typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}#methodology` : "");
  const md = useMemo(() => buildMethodologyMarkdown(), []);

  return (
    <Card id="methodology" className="p-6 shadow-soft scroll-mt-20">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" /> Data methodology
          </p>
          <h3 className="font-serif text-2xl font-bold text-brand mt-1">How every score is calculated</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-widest border-brand/40 text-brand">
              v{METHODOLOGY_VERSION}
            </Badge>
            <span className="text-[11px] text-muted-foreground">released {METHODOLOGY_VERSION_DATE}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{METHODOLOGY_INTRO}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline" size="sm"
            className="border-brand/30 text-brand hover:bg-brand-muted"
            onClick={() => { shareLink(url, "Data methodology"); }}
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export methodology
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground font-normal">
                Download
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { downloadMethodologyPdf(); toast({ title: "PDF downloaded" }); }}>
                <FileText className="w-4 h-4 mr-2" /> PDF report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { downloadMethodologyCsv(); toast({ title: "CSV downloaded" }); }}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { downloadMethodologyMarkdown(); toast({ title: "Markdown downloaded" }); }}>
                <FileCode className="w-4 h-4 mr-2" /> Markdown
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => copyText(md, "Methodology copied")}>
                <ClipboardCopy className="w-4 h-4 mr-2" /> Copy as text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left font-normal px-3 py-2">Metric</th>
              <th className="text-left font-normal px-3 py-2">Source</th>
              <th className="text-left font-normal px-3 py-2 whitespace-nowrap">Last updated</th>
              <th className="text-left font-normal px-3 py-2">Confidence</th>
              <th className="text-left font-normal px-3 py-2">Method</th>
              <th className="text-left font-normal px-3 py-2 whitespace-nowrap">Calc notes</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((k) => {
              const p = METRIC_PROVENANCE[k];
              return (
                <tr key={k} id={`methodology-${k}`} className="border-t align-top scroll-mt-24 [&:target]:bg-brand-muted/40 transition-colors">
                  <td className="px-3 py-3 font-serif font-bold text-brand whitespace-nowrap">{p.label}</td>
                  <td className="px-3 py-3">
                    {p.sourceUrl ? (
                      <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-dotted hover:text-brand">
                        {p.source} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : <span className="text-foreground">{p.source}</span>}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{fmtDate(p.lastUpdated)}</td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={cn("font-normal text-[10px] uppercase tracking-widest", confTone(p.confidence))}>
                      {confidenceLabel(p.confidence)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground leading-relaxed">{p.method}</td>
                  <td className="px-3 py-3">
                    <CalculationNotesDrawer metric={k} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-md border border-success/30 bg-success/5">
          <p className="font-semibold text-success mb-1">High confidence</p>
          <p className="text-muted-foreground">Direct from a named primary source (ONS, Land Registry, Ofsted, data.police.uk).</p>
        </div>
        <div className="p-3 rounded-md border border-warning/40 bg-warning/5">
          <p className="font-semibold text-warning mb-1">Medium confidence</p>
          <p className="text-muted-foreground">Modelled from official inputs with documented assumptions (yield blends, PTAL).</p>
        </div>
        <div className="p-3 rounded-md border border-muted-foreground/30 bg-muted/30">
          <p className="font-semibold text-foreground mb-1">Modelled estimate</p>
          <p className="text-muted-foreground">Regional benchmark used where direct measurement isn't available - directional only.</p>
        </div>
      </div>

      <div className="mt-8 pt-5 border-t">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Methodology changelog</p>
            <h4 className="font-serif text-lg font-bold text-brand">What changed and when</h4>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">Embedded in every export</span>
        </div>
        <ol className="space-y-3">
          {METHODOLOGY_CHANGELOG.map((e) => (
            <li key={e.version} className="grid sm:grid-cols-[120px_1fr] gap-3 text-sm">
              <div className="flex sm:flex-col gap-2 sm:gap-0.5 items-baseline sm:items-start">
                <Badge variant="outline" className="font-mono text-[10px] tracking-widest border-brand/30 text-brand">
                  v{e.version}
                </Badge>
                <span className="text-[11px] text-muted-foreground">{e.date}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">{e.summary}</p>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground list-disc pl-4">
                  {e.changes.map((c, idx) => <li key={idx}>{c}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
