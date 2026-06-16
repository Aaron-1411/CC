"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { COLORS } from "@/lib/brand";
import type { AccentColor } from "@/lib/types";
import type { GummyShape } from "@/components/brand/Gummy";
import { Gummy } from "@/components/brand/Gummy";
import { Wordmark } from "@/components/brand/Wordmark";
import { PackFront } from "@/components/brand/PackFront";
import { LinkButton } from "@/components/ui/Button";
import { WaitlistForm } from "@/components/ui/WaitlistForm";
import { heroProduct } from "@/data/products";

interface Float {
  shape: GummyShape;
  color: AccentColor;
  size: number;
  /** Position as % — kept off the text column on mobile. */
  top: string;
  left?: string;
  right?: string;
  delay: number;
  rotate: number;
}

const FLOATS: Float[] = [
  { shape: "bear", color: "raspberry", size: 58, top: "12%", left: "6%", delay: 0, rotate: -12 },
  { shape: "worm", color: "sun", size: 76, top: "68%", left: "10%", delay: 0.6, rotate: 8 },
  { shape: "bottle", color: "pine", size: 50, top: "78%", right: "12%", delay: 0.3, rotate: 14 },
  { shape: "bean", color: "mint", size: 52, top: "20%", right: "8%", delay: 0.9, rotate: -8 },
  { shape: "bear", color: "sun", size: 40, top: "44%", right: "4%", delay: 1.2, rotate: 18 },
];

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-mint-light pt-10 pb-20 sm:pt-16 lg:pb-28">
      {/* soft candy texture wash */}
      <div
        className="pointer-events-none absolute inset-0 candy-dots opacity-[0.05]"
        style={{ color: COLORS.pine }}
        aria-hidden="true"
      />
      {/* warm glow behind the headline */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(242,193,78,0.35), transparent 70%)" }}
        aria-hidden="true"
      />

      {/* floating gummies — decorative, hidden from AT */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {FLOATS.map((f, i) => (
          <motion.div
            key={i}
            className="absolute hidden sm:block"
            style={{ top: f.top, left: f.left, right: f.right }}
            initial={reduce ? false : { opacity: 0, scale: 0.4, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3 + f.delay * 0.4, type: "spring", stiffness: 260, damping: 18 }}
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -14, 0], rotate: [f.rotate, f.rotate + 6, f.rotate] }}
              transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: f.delay }}
            >
              <Gummy shape={f.shape} color={f.color} size={f.size} className="drop-shadow-lg" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-[1.05fr_0.95fr]">
        {/* copy column */}
        <div className="relative z-10 text-center lg:text-left">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-pill bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-pine shadow-soft"
          >
            <span className="h-2 w-2 rounded-full bg-raspberry" />
            Low sugar. Full sweet.
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-6 flex justify-center lg:justify-start"
          >
            <Wordmark variant="horizontal" height={62} className="sm:hidden" />
            <Wordmark variant="horizontal" height={84} className="hidden sm:block" />
          </motion.div>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 font-display text-4xl font-extrabold leading-[1.02] text-pine sm:text-5xl lg:text-6xl"
          >
            Kick the sugar,
            <br />
            <span className="text-raspberry">keep the sweet.</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto mt-5 max-w-md text-base text-ink/70 sm:text-lg lg:mx-0"
          >
            Sweets that taste like the real thing — up to{" "}
            <span className="font-semibold text-ink">93% less sugar</span>, lightly
            fortified, and sold honestly. Eat the whole pack. That&apos;s the idea.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
          >
            <LinkButton href="#build" variant="primary" size="lg">
              Build my box
              <ArrowRight size={18} strokeWidth={2.5} />
            </LinkButton>
            <LinkButton href="#quiz" variant="outline" size="lg">
              Find my DOSE
            </LinkButton>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mx-auto mt-8 max-w-md lg:mx-0"
          >
            <p className="mb-2 text-sm font-semibold text-pine">
              Not launched yet — get on the list for the first drop.
            </p>
            <WaitlistForm tone="light" source="hero" />
          </motion.div>
        </div>

        {/* hero pack column */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.9, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 120, damping: 16 }}
          className="relative z-10 mx-auto w-full max-w-[18rem] sm:max-w-xs"
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <PackFront product={heroProduct} variant="full" className="shadow-lift" />
          </motion.div>
          {/* "the hero flavour" tag */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-pill bg-pine px-4 py-1.5 text-xs font-bold text-white shadow-gummy">
            Fan favourite ★ {heroProduct.name}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
