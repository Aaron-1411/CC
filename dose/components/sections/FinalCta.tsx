"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Gift } from "lucide-react";
import { COLORS } from "@/lib/brand";
import type { AccentColor } from "@/lib/types";
import type { GummyShape } from "@/components/brand/Gummy";
import { Gummy } from "@/components/brand/Gummy";
import { WaitlistForm } from "@/components/ui/WaitlistForm";

interface Float {
  shape: GummyShape;
  color: AccentColor;
  size: number;
  top: string;
  left?: string;
  right?: string;
  rotate: number;
}

const FLOATS: Float[] = [
  { shape: "bear", color: "raspberry", size: 54, top: "16%", left: "8%", rotate: -14 },
  { shape: "worm", color: "sun", size: 70, top: "62%", left: "5%", rotate: 10 },
  { shape: "bean", color: "mint", size: 46, top: "22%", right: "9%", rotate: -6 },
  { shape: "bottle", color: "sun", size: 48, top: "70%", right: "7%", rotate: 16 },
];

const PERKS = ["First dibs on the drop", "Founder pricing", "Vote on next flavours"];

export function FinalCta() {
  const reduce = useReducedMotion();

  return (
    <section
      id="waitlist"
      className="relative overflow-hidden bg-pine py-20 text-white lg:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 candy-dots opacity-[0.06]"
        style={{ color: COLORS.white }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(242,193,78,0.4), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {FLOATS.map((f, i) => (
          <motion.div
            key={i}
            className="absolute hidden md:block"
            style={{ top: f.top, left: f.left, right: f.right }}
            animate={reduce ? undefined : { y: [0, -12, 0], rotate: [f.rotate, f.rotate + 5, f.rotate] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          >
            <Gummy shape={f.shape} color={f.color} size={f.size} className="drop-shadow-lg" />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-xl px-5 text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sun">
          <Gift size={14} strokeWidth={2.5} />
          The first drop is coming
        </span>
        <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.05] sm:text-4xl lg:text-5xl">
          Be first to eat
          <br />
          <span className="text-sun">the whole pack.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-white/70">
          We&apos;re not on shelves yet. Join the waitlist and you&apos;ll get the first batch
          before anyone else — plus a say in what we make next.
        </p>

        <div className="mx-auto mt-7 max-w-md">
          <WaitlistForm tone="dark" source="footer-cta" />
          <p className="mt-3 text-xs text-white/45">
            No spam, just sweets. Unsubscribe in one tap.
          </p>
        </div>

        <ul className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {PERKS.map((p) => (
            <li
              key={p}
              className="rounded-pill bg-white/[0.07] px-3.5 py-1.5 text-xs font-semibold text-white/80"
            >
              {p}
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
