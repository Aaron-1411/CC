// Anchor a raw number with a one-line, plain-English benchmark.
// Example: <Comparator value="£525k" context="5.8× your income · typical max is 4.5×" tone="warn" />
import { cn } from "@/lib/utils";

type Tone = "good" | "warn" | "bad" | "neutral";

const toneClasses: Record<Tone, string> = {
  good: "text-success",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-destructive",
  neutral: "text-muted-foreground",
};

export default function Comparator({
  value,
  context,
  tone = "neutral",
  className,
}: { value: string; context: string; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex flex-col leading-tight", className)}>
      <span className="font-mono font-semibold text-foreground">{value}</span>
      <span className={cn("text-[11px]", toneClasses[tone])}>{context}</span>
    </span>
  );
}
