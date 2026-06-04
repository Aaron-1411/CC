import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["#10B981", "#34D399", "#FBBF24", "#0F172A", "#6EE7B7"];

// A cheap, transform/opacity-only confetti burst from screen centre. No deps,
// no canvas, no layout thrash. Suppressed entirely under reduced motion.
export function Confetti({ count = 28 }: { count?: number }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const dist = 130 + Math.random() * 170;
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 40,
          rotate: (Math.random() - 0.5) * 540,
          color: COLORS[i % COLORS.length],
          delay: Math.random() * 0.06,
          w: 6 + Math.random() * 6,
        };
      }),
    [count],
  );

  if (reduce) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 0.5, rotate: p.rotate }}
          transition={{ duration: 0.95, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.w,
            height: p.w * 0.6,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
