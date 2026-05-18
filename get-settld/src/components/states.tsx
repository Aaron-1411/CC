// Standard loading / empty / error primitives — use these instead of bespoke
// per-page variants. Keeps spacing, tone and iconography consistent.
import { ReactNode } from "react";
import { Loader2, Inbox, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Loading…",
  rows = 0,
  className,
}: { label?: string; rows?: number; className?: string }) {
  if (rows > 0) {
    return (
      <div className={cn("space-y-2", className)} role="status" aria-live="polite">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }
  return (
    <div
      className={cn("flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground", className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: typeof Inbox;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}>
      <Icon className="h-8 w-8 text-brand/40 mb-3" aria-hidden />
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  return (
    <div
      role="alert"
      className={cn("flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4", className)}
    >
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1 text-sm">
        <p className="font-medium text-destructive">{title}</p>
        {description && <p className="text-muted-foreground leading-relaxed">{description}</p>}
        {onRetry && (
          <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Try again
          </Button>
        )}
      </div>
    </div>
  );
}
