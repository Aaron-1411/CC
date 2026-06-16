"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Eye, FlaskConical, Leaf, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { heroProduct } from "@/data/products";

interface Pillar {
  icon: LucideIcon;
  title: string;
  body: string;
}

const PILLARS: Pillar[] = [
  {
    icon: ShieldCheck,
    title: "Third-party tested",
    body: "Every batch goes to an independent UK lab before it goes near a pack. We publish the numbers, not just the nice ones.",
  },
  {
    icon: Eye,
    title: "Nothing hidden",
    body: "Full ingredient list on the front, not buried in 4pt grey. If you can't pronounce it, it's probably not in here.",
  },
  {
    icon: FlaskConical,
    title: "Real lab numbers",
    body: "The sugar and calorie figures are measured, not estimated off a spreadsheet. What the label says is what's in the pack.",
  },
  {
    icon: Leaf,
    title: "No weird aftertaste",
    body: "We sweeten with a blend that behaves like sugar on your tongue — no cooling hit, no chemical finish, no regret.",
  },
];

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 24 } },
};

function NutritionRow({
  label,
  value,
  sub,
  strong,
}: {
  label: string;
  value: string;
  sub?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-pine/10 py-3 last:border-b-0">
      <span className={strong ? "font-display text-base font-extrabold text-pine" : "text-sm text-ink/70"}>
        {label}
      </span>
      <span className="text-right">
        <span className={strong ? "font-display text-2xl font-extrabold text-raspberry" : "text-sm font-bold text-pine"}>
          {value}
        </span>
        {sub && <span className="ml-2 text-xs font-medium text-ink/45">{sub}</span>}
      </span>
    </div>
  );
}

export function Honesty() {
  const reduce = useReducedMotion();
  const saved = heroProduct.normalSugarGrams - heroProduct.sugarGrams;

  return (
    <section id="honesty" className="relative overflow-hidden bg-mint-light py-20 lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 candy-dots opacity-[0.04]"
        style={{ color: "#1B3A2F" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* ---- copy + honesty pillars ---- */}
          <div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-pill bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-pine shadow-soft">
                <span className="h-2 w-2 rounded-full bg-raspberry" />
                No funny business
              </span>
              <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.05] text-pine sm:text-4xl lg:text-5xl">
                What&apos;s actually
                <br />
                <span className="text-raspberry">in it.</span>
              </h2>
              <p className="mt-4 max-w-md text-base text-ink/70">
                &ldquo;Better for you&rdquo; only means something if you can check the receipts. So
                here are ours — every number measured, tested, and printed where you can read it.
              </p>
            </motion.div>

            <motion.ul
              className="mt-9 grid gap-x-6 gap-y-7 sm:grid-cols-2"
              variants={list}
              initial={reduce ? false : "hidden"}
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              {PILLARS.map((p) => {
                const Icon = p.icon;
                return (
                  <motion.li key={p.title} variants={item} className="flex gap-3.5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-gummy bg-pine text-sun shadow-soft">
                      <Icon size={20} strokeWidth={2.25} />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-extrabold text-pine">{p.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink/65">{p.body}</p>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>

          {/* ---- the honest label card ---- */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
            className="rounded-gummy bg-white p-6 shadow-lift sm:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-raspberry">
                  Per pack
                </p>
                <p className="mt-1 font-display text-xl font-extrabold text-pine">
                  {heroProduct.name}
                </p>
              </div>
              <span className="rounded-pill bg-mint px-3 py-1.5 text-xs font-bold text-pine">
                {heroProduct.line}
              </span>
            </div>

            <div className="mt-5">
              <NutritionRow
                label="Sugar"
                value={`${heroProduct.sugarGrams}g`}
                sub={`was ${heroProduct.normalSugarGrams}g`}
                strong
              />
              <NutritionRow label="Calories" value={`${heroProduct.calories} kcal`} />
              <NutritionRow label="Added active" value={heroProduct.active} />
              <NutritionRow label="Artificial colours" value="None" />
              <NutritionRow label="Suitable for" value="All ages · Veggie" />
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-gummy bg-pine px-4 py-3.5 text-white">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sun text-pine">
                <ShieldCheck size={20} strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{saved}g less sugar, independently checked.</p>
                {/* TODO(lab-results): link to the real batch certificate / COA when lab portal lands. */}
                <a
                  href="#honesty"
                  className="text-xs font-semibold text-sun underline decoration-sun/40 underline-offset-2 hover:decoration-sun"
                >
                  See the latest batch report
                </a>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-ink/45">
              Every DOSE pack carries its own full breakdown. Numbers shown are for one pack as sold.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
