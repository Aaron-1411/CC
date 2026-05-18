// Tiny pill showing how recently a live number was updated, e.g.
// <FreshnessPill source="BoE" updatedAt={iso} />  →  "BoE · 2h ago"
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

function relative(iso: string | number | Date | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  return `${mo}mo ago`;
}

export default function FreshnessPill({
  source,
  updatedAt,
  className,
}: { source: string; updatedAt?: string | number | Date; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1 font-normal text-[10px] text-muted-foreground", className)}>
      <Clock className="h-2.5 w-2.5" aria-hidden />
      <span>{source} · updated {relative(updatedAt)}</span>
    </Badge>
  );
}
