// Shows "X of N checks complete" with a progress bar and a popover listing the
// missing inputs so users know how trustworthy the verdict is.
import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Check { id: string; label: React.ReactNode; complete: boolean; hint?: string }

export default function ConfidenceMeter({
  checks,
  className,
}: { checks: Check[]; className?: string }) {
  const total = checks.length;
  const done = checks.filter((c) => c.complete).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const tone = pct >= 80 ? "success" : pct >= 50 ? "amber" : "destructive";
  const toneClass =
    tone === "success" ? "text-success" : tone === "amber" ? "text-amber-600" : "text-destructive";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn("text-left w-full max-w-xs group", className)} aria-label="Confidence details">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            <span>Confidence</span>
            <span className={cn("font-mono", toneClass)}>{done}/{total} checks</span>
          </div>
          <Progress value={pct} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground mt-1 group-hover:text-foreground inline-flex items-center gap-1">
            <Info className="h-3 w-3" /> What's missing?
          </p>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <p className="text-xs font-semibold mb-2">Inputs feeding the result</p>
        <ul className="space-y-1.5">
          {checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-xs">
              {c.complete ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" aria-hidden />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" aria-hidden />
              )}
              <div className="min-w-0">
                <p className={c.complete ? "text-foreground" : "text-muted-foreground"}>{c.label}</p>
                {!c.complete && c.hint && <p className="text-[11px] text-muted-foreground/80">{c.hint}</p>}
              </div>
            </li>
          ))}
        </ul>
        {pct < 100 && (
          <Badge variant="outline" className="mt-3 text-[10px]">Verdict will sharpen as more data arrives</Badge>
        )}
      </PopoverContent>
    </Popover>
  );
}
