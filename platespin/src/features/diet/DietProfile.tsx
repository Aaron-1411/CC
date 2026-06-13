import { useState } from "react";
import type { DietId } from "@/contract/types";
import { DIETS } from "@/data/diets";

interface DietProfileProps {
  profile: DietId[];
  strictness: "only" | "any";
  onToggle: (id: DietId) => void;
  onStrictness: (s: "only" | "any") => void;
}

export function DietProfile({ profile, strictness, onToggle, onStrictness }: DietProfileProps) {
  const [open, setOpen] = useState(false);
  const activeCount = profile.length;
  const hasSafetyCritical = DIETS.some((d) => d.safetyCritical && profile.includes(d.id));

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <span className="text-base">🥗</span>
          Dietary requirements
          {activeCount > 0 && (
            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-medium text-emerald-200">
              {activeCount} active
            </span>
          )}
        </span>
        <span className="text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3 animate-pop-in space-y-3">
          <div className="flex flex-wrap gap-2">
            {DIETS.map((d) => {
              const on = profile.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onToggle(d.id)}
                  aria-pressed={on}
                  className={[
                    "flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition active:scale-[0.97]",
                    on
                      ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-100"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                  ].join(" ")}
                >
                  <span>{d.emoji}</span>
                  {d.label}
                  {d.safetyCritical && on && <span title="Allergy-class — advisory only">⚠️</span>}
                </button>
              );
            })}
          </div>

          {activeCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Match strictness:</span>
              <div className="inline-flex overflow-hidden rounded-lg border border-white/10">
                {(["any", "only"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onStrictness(s)}
                    className={[
                      "flex min-h-[40px] items-center px-3 py-1.5 font-medium transition",
                      strictness === s
                        ? "bg-emerald-400/20 text-emerald-100"
                        : "text-slate-400 hover:bg-white/5",
                    ].join(" ")}
                  >
                    {s === "any" ? "Some options" : "Fully compliant"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasSafetyCritical && (
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs leading-relaxed text-amber-200/90">
              ⚠️ Allergy-related filters rely on community data and are{" "}
              <strong>advisory only</strong>. PlateSpin can never confirm a venue is safe — always
              check directly with the restaurant before ordering.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
