import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b mb-8">
      <div className="space-y-1">
        {eyebrow && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/70">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "primary" | "gold" | "success" | "warning" | "destructive";
}) {
  const toneCls: Record<string, string> = {
    default: "bg-card",
    primary: "bg-primary text-primary-foreground",
    gold: "bg-gradient-gold text-gold-foreground",
    success: "bg-success/10 border-success/30",
    warning: "bg-warning/15 border-warning/40",
    destructive: "bg-destructive/10 border-destructive/30",
  };
  return (
    <div className={`rounded-xl border p-5 shadow-soft ${toneCls[tone]}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-70">
        {label}
      </div>
      <div className="mt-1.5 font-display text-2xl md:text-3xl font-semibold num">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs opacity-70">{hint}</div>}
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card p-5 shadow-soft ${className}`}>
      {children}
    </div>
  );
}
