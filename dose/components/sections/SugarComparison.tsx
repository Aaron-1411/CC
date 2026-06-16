"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { heroProduct, SUGAR_CUBE_GRAMS } from "@/data/products";

const normalGrams = heroProduct.normalSugarGrams;
const doseGrams = heroProduct.sugarGrams;
const normalCubes = Math.ceil(normalGrams / SUGAR_CUBE_GRAMS);
const doseCubes = Math.max(1, Math.ceil(doseGrams / SUGAR_CUBE_GRAMS));
const savedCubes = normalCubes - doseCubes;

const stack: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cube: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.6 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 360, damping: 20 },
  },
};

function SugarCube({ tone = "normal" }: { tone?: "normal" | "dose" }) {
  return (
    <motion.span
      variants={cube}
      className={[
        "block h-7 w-7 rounded-[7px] border shadow-sm sm:h-8 sm:w-8",
        tone === "dose"
          ? "border-mint/70 bg-gradient-to-br from-white to-mint"
          : "border-raspberry/20 bg-gradient-to-br from-white to-[#FBE0E8]",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

function Column({
  label,
  sub,
  cubes,
  tone,
  highlight,
}: {
  label: string;
  sub: string;
  cubes: number;
  tone: "normal" | "dose";
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "flex flex-1 flex-col items-center rounded-gummy p-6 text-center",
        highlight ? "bg-pine text-white shadow-lift" : "bg-white shadow-soft",
      ].join(" ")}
    >
      <motion.div
        className="flex min-h-[8.5rem] flex-wrap content-end justify-center gap-1.5"
        variants={stack}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
      >
        {Array.from({ length: cubes }).map((_, i) => (
          <SugarCube key={i} tone={tone} />
        ))}
      </motion.div>

      <p
        className={[
          "mt-5 font-display text-2xl font-extrabold",
          highlight ? "text-white" : "text-pine",
        ].join(" ")}
      >
        {tone === "dose" ? doseGrams : normalGrams}g sugar
      </p>
      <p className={highlight ? "mt-1 text-sm text-white/70" : "mt-1 text-sm text-ink/60"}>
        {label}
      </p>
      <p
        className={[
          "mt-3 rounded-pill px-3 py-1 text-xs font-bold",
          highlight ? "bg-sun text-ink" : "bg-mint text-pine",
        ].join(" ")}
      >
        {sub}
      </p>
    </div>
  );
}

export function SugarComparison() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-mint-light py-20 lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 candy-dots opacity-[0.04]"
        style={{ color: "#1B3A2F" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-4xl px-5">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-pill bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-pine shadow-soft">
            <span className="h-2 w-2 rounded-full bg-raspberry" />
            Do the maths
          </span>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.05] text-pine sm:text-4xl lg:text-5xl">
            Same one pack.
            <br />
            <span className="text-raspberry">Wildly different sugar.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-ink/70">
            One pack of {heroProduct.name} vs the supermarket sweet it&apos;s replacing. Each cube
            is {SUGAR_CUBE_GRAMS}g of sugar.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row">
          <Column
            label="A normal sweet pack"
            sub={`${normalCubes} sugar cubes`}
            cubes={normalCubes}
            tone="normal"
          />
          <div className="flex items-center justify-center sm:flex-col">
            <span className="font-display text-2xl font-extrabold text-ink/30">vs</span>
          </div>
          <Column
            label={`One pack of ${heroProduct.name}`}
            sub={heroProduct.bigStat}
            cubes={doseCubes}
            tone="dose"
            highlight
          />
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-8 max-w-xl rounded-gummy bg-raspberry px-6 py-5 text-center text-white shadow-gummy"
        >
          <p className="font-display text-xl font-extrabold sm:text-2xl">
            That&apos;s {savedCubes} sugar cubes you&apos;re{" "}
            <span className="text-sun">not</span> eating.
          </p>
          <p className="mt-1 text-sm text-white/80">
            Every single pack. Eat the whole thing — that&apos;s the idea.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
