import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";

// ── number formatting ─────────────────────────────────────────────────────────
const gbpFmt = (decimals: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** Format a number as GBP. Defaults to whole pounds. */
export function gbp(n: number, decimals = 0): string {
  if (!isFinite(n)) return "—";
  return gbpFmt(decimals).format(n);
}

export function pct(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals).replace(/\.0$/, "")}%`;
}

// ── "mark tool used" helper — fires the callback exactly once ──────────────────
export function useFireOnce(fn: () => void): () => void {
  const fired = useRef(false);
  return useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    fn();
  }, [fn]);
}

// ── inputs ─────────────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}
export function Field({ label, hint, children }: FieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-navy-700">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-navy-400 leading-relaxed">{hint}</p>}
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  hint?: string;
}
export function NumberField({
  label,
  value,
  onChange,
  prefix = "£",
  suffix,
  min,
  max,
  placeholder,
  hint,
}: NumberFieldProps) {
  // Internal text state so the field can be cleared while typing.
  const [text, setText] = useState(value ? String(value) : "");
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <div className="relative flex items-center">
          {prefix && (
            <span className="pointer-events-none absolute left-3 text-navy-400 text-sm">{prefix}</span>
          )}
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={text}
            placeholder={placeholder}
            onChange={(e) => {
              const t = e.target.value;
              if (t !== "" && !/^\d*\.?\d*$/.test(t)) return; // digits + one dot only
              setText(t);
              let n = t === "" ? 0 : parseFloat(t);
              if (isNaN(n)) n = 0;
              if (min !== undefined && n < min) n = min;
              if (max !== undefined && n > max) n = max;
              onChange(n);
            }}
            className={clsx(
              "w-full rounded-xl border border-navy-200 bg-white py-2.5 text-navy-900 text-sm outline-none transition-colors",
              "focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500/40",
              prefix ? "pl-7" : "pl-3",
              suffix ? "pr-9" : "pr-3",
            )}
          />
          {suffix && <span className="pointer-events-none absolute right-3 text-navy-400 text-sm">{suffix}</span>}
        </div>
      )}
    </Field>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
}
export function SelectField<T extends string>({ label, value, onChange, options, hint }: SelectFieldProps<T>) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-navy-900 text-sm outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-700">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-emerald-500" : "bg-navy-200",
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}

// ── results display ──────────────────────────────────────────────────────────
export function ResultStat({
  label,
  value,
  accent = false,
  sub,
}: {
  label: string;
  value: string;
  accent?: boolean;
  sub?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl p-4",
        accent ? "bg-emerald-500 text-white" : "bg-navy-50 text-navy-900",
      )}
    >
      <div className={clsx("text-xs font-medium uppercase tracking-wide", accent ? "text-emerald-50" : "text-navy-500")}>
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className={clsx("mt-0.5 text-xs", accent ? "text-emerald-50" : "text-navy-400")}>{sub}</div>}
    </div>
  );
}

export function ResultRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={clsx("flex items-center justify-between py-2", strong ? "font-semibold text-navy-900" : "text-navy-600")}>
      <span className="text-sm">{label}</span>
      <span className="tabular-nums text-sm">{value}</span>
    </div>
  );
}

export function Assumptions({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 rounded-xl bg-navy-50 px-4 py-3 text-xs leading-relaxed text-navy-500">
      <span className="font-semibold text-navy-600">How this is worked out: </span>
      {children}
    </p>
  );
}
