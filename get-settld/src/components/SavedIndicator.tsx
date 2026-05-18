import { Check, Loader2 } from "lucide-react";
import type { SaveStatus } from "@/hooks/use-autosave";
import { cn } from "@/lib/utils";

export default function SavedIndicator({ status, className }: { status: SaveStatus; className?: string }) {
  if (status === "idle") return null;
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground", className)}
      role="status"
      aria-live="polite"
    >
      {status === "saving" ? (
        <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>
      ) : (
        <><Check className="h-3 w-3 text-success" /> Saved</>
      )}
    </span>
  );
}
