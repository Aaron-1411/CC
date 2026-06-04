import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface CountUpProps {
  value: number;
  format?: (v: number) => string;
  duration?: number;
  className?: string;
}

// Animates only when the value CHANGES (not on every mount), so navigating back
// to a page doesn't replay a count-up. Reduced-motion users see the final value.
export function CountUp({ value, format, duration = 0.7, className }: CountUpProps) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (reduce || prev.current === value) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce, duration]);

  const text = format ? format(display) : Math.round(display).toLocaleString("en-GB");
  return <span className={className}>{text}</span>;
}
