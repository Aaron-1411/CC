import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

interface CountUpProps {
  value: number;
  format?: (v: number) => string;
  duration?: number;
  className?: string;
  // When true, the number starts at 0 and counts up the first time it scrolls
  // into view (dopamine on arrival). When false (default), it animates only
  // when the `value` prop CHANGES, so revisiting a page doesn't replay it.
  startOnView?: boolean;
}

export function CountUp({
  value,
  format,
  duration = 0.7,
  className,
  startOnView = false,
}: CountUpProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [display, setDisplay] = useState(startOnView ? 0 : value);
  const prev = useRef(startOnView ? 0 : value);
  const fired = useRef(false);

  // View-triggered mode: count 0 -> value once, when scrolled into view.
  useEffect(() => {
    if (!startOnView || fired.current) return;
    if (reduce) {
      setDisplay(value);
      fired.current = true;
      return;
    }
    if (!inView) return;
    fired.current = true;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [startOnView, inView, value, reduce, duration]);

  // Change-driven mode: animate from previous value to new value.
  useEffect(() => {
    if (startOnView) return;
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
  }, [value, reduce, duration, startOnView]);

  const text = format ? format(display) : Math.round(display).toLocaleString("en-GB");
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
