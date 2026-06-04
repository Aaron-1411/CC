import { AlertCircle, Lightbulb, TrendingUp } from "lucide-react";
import { clsx } from "clsx";

type CalloutType = "tip" | "warning" | "figure";

interface CalloutProps {
  type: CalloutType;
  text: string;
  className?: string;
}

const config: Record<CalloutType, { icon: React.ReactNode; bg: string; border: string; text: string; label: string }> = {
  tip: {
    icon: <Lightbulb className="h-4 w-4 shrink-0" />,
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-800",
    label: "Tip",
  },
  warning: {
    icon: <AlertCircle className="h-4 w-4 shrink-0" />,
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-800",
    label: "Watch out",
  },
  figure: {
    icon: <TrendingUp className="h-4 w-4 shrink-0" />,
    bg: "bg-navy-50",
    border: "border-navy-200",
    text: "text-navy-700",
    label: "Figure",
  },
};

export function Callout({ type, text, className }: CalloutProps) {
  const { icon, bg, border, text: textClass, label } = config[type];
  return (
    <div className={clsx("flex gap-3 rounded-xl border p-4 text-sm", bg, border, textClass, className)}>
      <span className="mt-0.5">{icon}</span>
      <div>
        <span className="font-semibold mr-1">{label}:</span>
        {text}
      </div>
    </div>
  );
}
