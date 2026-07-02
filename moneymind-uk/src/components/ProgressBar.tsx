import { clsx } from "clsx";

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  size?: "sm" | "md";
  color?: "emerald" | "navy";
  className?: string;
}

export function ProgressBar({ value, label, size = "md", color = "emerald", className }: ProgressBarProps) {
  const h = size === "sm" ? "h-1.5" : "h-2.5";
  const fill = color === "emerald" ? "bg-emerald-500" : "bg-navy-700";
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={clsx("w-full", className)} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={clsx("w-full bg-navy-100 rounded-full overflow-hidden", h)}>
        <div
          className={clsx("h-full rounded-full transition-[width] duration-500 ease-out", fill)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
