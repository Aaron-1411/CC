import type { AvailabilityMap, CuisineId } from "@/contract/types";
import { CUISINES } from "@/data/cuisines";

interface CuisinePickerProps {
  selected: CuisineId[];
  availability?: AvailabilityMap;
  onToggle: (id: CuisineId) => void;
}

export function CuisinePicker({ selected, availability, onToggle }: CuisinePickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {CUISINES.map((c) => {
        const isOn = selected.includes(c.id);
        const count = availability?.[c.id];
        const noneHere = count === 0;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            aria-pressed={isOn}
            className={[
              "flex min-h-[44px] items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left text-sm font-medium transition",
              "active:scale-[0.97]",
              isOn
                ? "border-amber-300/60 bg-amber-300/15 text-amber-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
              noneHere ? "opacity-50" : "",
            ].join(" ")}
            title={noneHere ? "No spots nearby right now" : c.label}
          >
            <span className="text-lg leading-none">{c.emoji}</span>
            <span className="truncate">{c.label}</span>
            {typeof count === "number" && (
              <span className="ml-auto shrink-0 text-xs text-slate-400">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
