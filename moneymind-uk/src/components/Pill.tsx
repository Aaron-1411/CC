import { clsx } from "clsx";
import type { ModuleStatus } from "../lib/gamification";

type PillVariant = "success" | "warning" | "neutral" | "info";

interface PillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  className?: string;
}

const variantClasses: Record<PillVariant, string> = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  neutral: "bg-navy-100 text-navy-600",
  info: "bg-blue-100 text-blue-700",
};

export function Pill({ children, variant = "neutral", className }: PillProps) {
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", variantClasses[variant], className)}>
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: ModuleStatus }) {
  const map: Record<ModuleStatus, { label: string; variant: PillVariant }> = {
    "not-started": { label: "Not started", variant: "neutral" },
    "in-progress": { label: "In progress", variant: "warning" },
    complete: { label: "Complete", variant: "success" },
  };
  const { label, variant } = map[status];
  return <Pill variant={variant}>{label}</Pill>;
}
