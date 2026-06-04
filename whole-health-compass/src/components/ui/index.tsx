import { useId, useState, type ReactNode, type ButtonHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/* ── Button ─────────────────────────────────────────────────────────────── */

type Variant = "primary" | "accent" | "outline" | "ghost" | "soft";
type Size = "sm" | "md" | "lg";

export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985]";
  const sizes: Record<Size, string> = {
    sm: "h-9 px-3.5 text-sm",
    md: "h-11 px-5 text-[0.95rem]",
    lg: "h-13 px-7 text-base py-3.5",
  };
  const variants: Record<Variant, string> = {
    primary: "bg-primary text-primary-foreground shadow-soft hover:shadow-card hover:brightness-110",
    accent: "bg-accent text-accent-foreground shadow-soft hover:shadow-card hover:brightness-105",
    outline: "border border-border bg-card text-foreground hover:bg-muted",
    ghost: "text-foreground hover:bg-muted",
    soft: "bg-primary-soft text-primary hover:brightness-95",
  };
  return cn(base, sizes[size], variants[variant]);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(buttonClasses(variant, size), className)} {...props} />;
}

/* ── Card ───────────────────────────────────────────────────────────────── */

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-soft", className)} {...props}>
      {children}
    </div>
  );
}

/* ── Eyebrow / section label ────────────────────────────────────────────── */

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── Pill ───────────────────────────────────────────────────────────────── */

export function Pill({
  children,
  tint = "muted",
  className,
}: {
  children: ReactNode;
  tint?: "muted" | "primary" | "accent" | "west" | "tcm" | "ayur" | "success";
  className?: string;
}) {
  const tints: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent",
    west: "bg-west-soft text-west",
    tcm: "bg-tcm-soft text-tcm",
    ayur: "bg-ayur-soft text-ayur",
    success: "bg-success/12 text-success",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", tints[tint], className)}>
      {children}
    </span>
  );
}

/* ── Form fields ────────────────────────────────────────────────────────── */

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
      {children}
      {hint && <span className="ml-2 font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}

const fieldClasses =
  "w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-[0.95rem] text-foreground placeholder:text-muted-foreground/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, props.className)} {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClasses, "min-h-[104px] resize-y leading-relaxed", props.className)} {...props} />;
}

/* ── Progress ───────────────────────────────────────────────────────────── */

export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      {label && <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${Math.max(4, value)}%` }} />
      </div>
    </div>
  );
}

/* ── Callout ────────────────────────────────────────────────────────────── */

export function Callout({
  tone = "info",
  icon,
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "safe";
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const tones: Record<string, string> = {
    info: "border-primary/20 bg-primary-soft/60",
    warning: "border-warning/30 bg-warning-soft",
    safe: "border-border bg-surface",
  };
  return (
    <div className={cn("rounded-lg border p-4", tones[tone], className)}>
      <div className="flex gap-3">
        {icon && <div className="mt-0.5 shrink-0 text-primary">{icon}</div>}
        <div className="min-w-0 text-sm leading-relaxed text-foreground/90">
          {title && <div className="mb-1 font-semibold text-foreground">{title}</div>}
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Tabs (controlled, accessible) ──────────────────────────────────────── */

export type TabItem = { key: string; label: ReactNode; content: ReactNode };

export function Tabs({ items, ariaLabel }: { items: TabItem[]; ariaLabel?: string }) {
  const [active, setActive] = useState(items[0]?.key);
  return (
    <div>
      <div role="tablist" aria-label={ariaLabel} className="mb-4 flex gap-1.5 overflow-x-auto rounded-xl bg-muted p-1.5">
        {items.map((it) => {
          const selected = it.key === active;
          return (
            <button
              key={it.key}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(it.key)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all",
                selected ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {it.label}
            </button>
          );
        })}
      </div>
      {items.map(
        (it) =>
          it.key === active && (
            <div key={it.key} role="tabpanel" className="animate-fade-in">
              {it.content}
            </div>
          ),
      )}
    </div>
  );
}

/* ── Accordion ──────────────────────────────────────────────────────────── */

export function Accordion({ items }: { items: { q: ReactNode; a: ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const base = useId();
  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              aria-expanded={isOpen}
              aria-controls={`${base}-${i}`}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[0.95rem] font-medium hover:bg-muted/50"
            >
              {it.q}
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div id={`${base}-${i}`} className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground animate-fade-in">
                {it.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
