import * as React from "react";
import { Input } from "@/components/ui/input";

export interface NumberInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number;
  onChange: (n: number) => void;
  /** Value used when the field is cleared (default 0). */
  emptyValue?: number;
  /** Allow decimals (default true). */
  allowDecimal?: boolean;
}

/**
 * Number input that avoids the "stuck leading zero" issue by tracking the
 * raw string buffer locally. Empty string yields `emptyValue` (default 0)
 * via onChange, but the field stays visually empty so the user can type freely.
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, emptyValue = 0, allowDecimal = true, onBlur, onFocus, ...rest }, ref) => {
    const [buffer, setBuffer] = React.useState<string>(
      Number.isFinite(value) ? String(value) : ""
    );
    const focusedRef = React.useRef(false);

    // Sync external value -> buffer when not focused (so parent updates flow in).
    React.useEffect(() => {
      if (focusedRef.current) return;
      const next = Number.isFinite(value) ? String(value) : "";
      setBuffer((prev) => (Number(prev) === value && prev !== "" ? prev : next));
    }, [value]);

    return (
      <Input
        {...rest}
        ref={ref}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        value={buffer}
        onFocus={(e) => {
          focusedRef.current = true;
          // Select all so typing replaces seed value cleanly.
          e.currentTarget.select();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          focusedRef.current = false;
          if (buffer === "" || buffer === "-" || buffer === ".") {
            setBuffer(String(emptyValue));
            onChange(emptyValue);
          } else {
            const n = Number(buffer);
            if (Number.isFinite(n)) setBuffer(String(n));
          }
          onBlur?.(e);
        }}
        onChange={(e) => {
          const raw = e.target.value;
          // Allow empty, optional minus, digits, single decimal.
          const pattern = allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
          if (!pattern.test(raw)) return;
          // Strip leading zeros (but keep "0", "0.", "-0").
          let cleaned = raw;
          if (/^-?0\d/.test(cleaned)) {
            cleaned = cleaned.replace(/^(-?)0+/, "$1");
            if (cleaned === "" || cleaned === "-") cleaned = cleaned + "0";
          }
          setBuffer(cleaned);
          if (cleaned === "" || cleaned === "-" || cleaned === ".") {
            onChange(emptyValue);
            return;
          }
          const n = Number(cleaned);
          if (Number.isFinite(n)) onChange(n);
        }}
      />
    );
  }
);
NumberInput.displayName = "NumberInput";
