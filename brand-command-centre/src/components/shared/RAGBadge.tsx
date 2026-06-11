import { cn, ragStyles } from "@/lib/utils";
import type { RAGStatus } from "@/types/analysis";

export function RAGBadge({
  status,
  className,
}: {
  status: RAGStatus;
  className?: string;
}) {
  const s = ragStyles(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        s.bg,
        s.text,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
