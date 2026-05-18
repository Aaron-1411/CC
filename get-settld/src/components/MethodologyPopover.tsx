import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { ScoreTrace } from "@/lib/autoScore";

interface Props {
  trace: ScoreTrace;
  /** Optional override for the trigger label (defaults to "How calculated") */
  triggerLabel?: string;
}

export default function MethodologyPopover({ trace, triggerLabel = "How calculated" }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-brand">
          <Info className="w-3 h-3 mr-1" /> {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Methodology</p>
        <h4 className="font-serif font-bold text-brand mt-0.5 mb-3">{trace.label}</h4>

        <div className="space-y-2 mb-3">
          {trace.inputs.map((i) => (
            <div key={i.label} className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-muted-foreground">{i.label}</span>
              <span className="font-mono font-semibold text-foreground">
                {i.raw}{i.weight !== undefined && <span className="text-muted-foreground ml-1">×{(i.weight * 100).toFixed(0)}%</span>}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t pt-2 space-y-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Formula</p>
            <code className="text-[11px] font-mono block mt-0.5 leading-snug text-foreground break-words">{trace.formula}</code>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Source</p>
            <p className="text-[11px] mt-0.5 text-foreground">{trace.source}</p>
          </div>
          <div className="bg-muted/40 rounded p-2 mt-2">
            <p className="text-[10px] uppercase tracking-widest text-brand">Result</p>
            <p className="font-mono font-bold text-brand text-lg">{trace.value}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
