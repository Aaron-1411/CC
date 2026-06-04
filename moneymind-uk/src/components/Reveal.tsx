import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

// The scroll workhorse: fade + small rise the first time an element enters the
// viewport, then it stays put. Upcoming content sits invisible below the fold,
// so the eye only has the current block to deal with — motion that also lowers
// cognitive load. Honors reduced-motion (instant, no travel).
export function Reveal({ children, delay = 0, y = 22, className }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
