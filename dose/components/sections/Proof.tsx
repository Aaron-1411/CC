"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Star } from "lucide-react";
import type { AccentColor } from "@/lib/types";
import { Gummy } from "@/components/brand/Gummy";

interface Shout {
  quote: string;
  name: string;
  handle: string;
  accent: AccentColor;
}

// TODO(ugc): swap for real customer photos + verified reviews when commerce + a
// review provider (Okendo / Trustpilot) are wired up. Copy is placeholder.
const SHOUTS: Shout[] = [
  {
    quote: "Ate the whole pack on the sofa and felt zero guilt. This is witchcraft.",
    name: "Priya N.",
    handle: "@priyaeats",
    accent: "raspberry",
  },
  {
    quote: "On a cut and these got me through. Tastes like cheating, the macros say otherwise.",
    name: "Marcus L.",
    handle: "@marcuslifts",
    accent: "sun",
  },
  {
    quote: "The cola ones taste exactly like the real thing. I'm slightly suspicious, honestly.",
    name: "Dani R.",
    handle: "@daniruns",
    accent: "pine",
  },
  {
    quote: "FUEL packs replaced my 3pm energy drink. Smooth lift, no shakes, no 5pm crash.",
    name: "Tom B.",
    handle: "@tombuilds",
    accent: "mint",
  },
  {
    quote: "My kids think it's a treat. I know it's two grams of sugar. Everybody wins.",
    name: "Hannah K.",
    handle: "@hannahandco",
    accent: "raspberry",
  },
];

const STATS = [
  { value: "12,000+", label: "on the waitlist" },
  { value: "Up to 93%", label: "less sugar" },
  { value: "4.9 / 5", label: "early tester rating" },
];

const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

export function Proof() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-white py-20 lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 candy-dots opacity-[0.04]"
        style={{ color: "#1B3A2F" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-pill bg-mint px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-pine">
            <Star size={14} strokeWidth={2.5} className="fill-raspberry text-raspberry" />
            The early crowd
          </span>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.05] text-pine sm:text-4xl lg:text-5xl">
            People are already
            <br />
            <span className="text-raspberry">eating the whole pack.</span>
          </h2>
        </div>

        {/* stats bar */}
        <motion.dl
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-9 flex max-w-2xl flex-col divide-y divide-pine/10 rounded-gummy bg-mint-light p-2 text-center sm:flex-row sm:divide-x sm:divide-y-0"
        >
          {STATS.map((s) => (
            <div key={s.label} className="flex-1 px-4 py-4">
              <dt className="font-display text-2xl font-extrabold text-pine sm:text-3xl">
                {s.value}
              </dt>
              <dd className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink/55">
                {s.label}
              </dd>
            </div>
          ))}
        </motion.dl>

        {/* shout-out wall */}
        <motion.ul
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={grid}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {SHOUTS.map((s) => (
            <motion.li
              key={s.handle}
              variants={card}
              className="flex flex-col gap-4 rounded-gummy border border-pine/10 bg-white p-6 shadow-soft"
            >
              <p className="text-base font-semibold leading-relaxed text-pine">
                &ldquo;{s.quote}&rdquo;
              </p>
              <div className="mt-auto flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint-light">
                  <Gummy shape="bear" color={s.accent} size={28} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">{s.name}</span>
                  <span className="block text-xs font-medium text-ink/50">{s.handle}</span>
                </span>
              </div>
            </motion.li>
          ))}

          {/* UGC placeholder tile */}
          <motion.li
            variants={card}
            className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-gummy border-2 border-dashed border-pine/15 bg-mint-light/60 p-6 text-center"
          >
            <span className="font-display text-lg font-extrabold text-pine">Your pack here</span>
            <p className="text-xs font-medium text-ink/55">
              {/* TODO(ugc): real customer photos drop into this grid post-launch. */}
              Tag <span className="font-bold text-raspberry">#mydose</span> and you might land on the
              wall.
            </p>
          </motion.li>
        </motion.ul>
      </div>
    </section>
  );
}
