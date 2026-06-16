"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ArrowRight, ShieldCheck, Sun, Zap } from "lucide-react";
import type { Product } from "@/lib/types";
import { everydayProducts, fuelProducts } from "@/data/products";
import { PackFront } from "@/components/brand/PackFront";
import { LinkButton } from "@/components/ui/Button";
import { useAgeGate } from "@/components/providers/AgeGateProvider";

const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const tileIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 24 } },
};

function PackGrid({
  products,
  reduce,
}: {
  products: Product[];
  reduce: boolean | null;
}) {
  return (
    <motion.ul
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      variants={grid}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {products.map((p) => (
        <motion.li key={p.id} variants={tileIn} className="min-w-0">
          <PackFront product={p} variant="tile" />
          <p className="mt-2 text-center text-xs font-semibold opacity-70">{p.name}</p>
        </motion.li>
      ))}
    </motion.ul>
  );
}

export function Lines() {
  const reduce = useReducedMotion();
  const { confirmed, requireAge } = useAgeGate();

  return (
    <section id="lines" className="relative overflow-hidden bg-mint-light">
      {/* ---- EVERYDAY world: bright, daily, all-ages ---- */}
      <div className="relative py-20 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0 candy-dots opacity-[0.04]"
          style={{ color: "#1B3A2F" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-pill bg-raspberry/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-raspberry">
                <Sun size={14} strokeWidth={2.5} />
                The everyday line
              </span>
              <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.05] text-pine sm:text-4xl lg:text-5xl">
                EVERYDAY
                <br />
                <span className="text-raspberry">for any-time sweet.</span>
              </h2>
              <p className="mt-4 max-w-md text-base text-ink/70">
                The treats you reach for without a second thought. Up to{" "}
                <span className="font-semibold text-ink">93% less sugar</span>, lightly fortified
                with everyday vitamins, and friendly for all ages. Eat the whole pack — that&apos;s
                the point.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {["All ages", "Lightly fortified", "Under 100 cal a pack"].map((t) => (
                  <li
                    key={t}
                    className="rounded-pill bg-white px-3 py-1.5 text-xs font-bold text-pine shadow-soft"
                  >
                    {t}
                  </li>
                ))}
              </ul>
              <LinkButton href="#build" variant="primary" size="lg" className="mt-7">
                Build an EVERYDAY box
                <ArrowRight size={18} strokeWidth={2.5} />
              </LinkButton>
            </motion.div>

            <PackGrid products={everydayProducts} reduce={reduce} />
          </div>
        </div>
      </div>

      {/* ---- FUEL world: dark, charged, 16+ ---- */}
      <div className="relative overflow-hidden bg-pine py-20 text-white lg:py-28">
        <div
          className="pointer-events-none absolute inset-0 candy-dots opacity-[0.06]"
          style={{ color: "#FFFFFF" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(242,193,78,0.45), transparent 70%)" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="order-2 lg:order-1">
              <PackGrid products={fuelProducts} reduce={reduce} />
            </div>

            <motion.div
              className="order-1 lg:order-2"
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-pill bg-sun/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sun">
                <Zap size={14} strokeWidth={2.5} />
                The fuel line
              </span>
              <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.05] sm:text-4xl lg:text-5xl">
                FUEL
                <br />
                <span className="text-sun">for when it counts.</span>
              </h2>
              <p className="mt-4 max-w-md text-base text-white/75">
                80mg of clean caffeine plus L-theanine for a smooth lift with no jitters and no
                comedown. Same low sugar, same big flavour — built for the 3pm wall and the
                deep-work sprint.
              </p>
              <div className="mt-5 flex items-center gap-3 rounded-gummy bg-white/[0.06] px-4 py-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 text-xs font-extrabold text-sun"
                  style={{ borderColor: "#F2C14E" }}
                  aria-hidden="true"
                >
                  16+
                </span>
                <p className="text-sm text-white/70">
                  Contains caffeine. We keep FUEL strictly 16+ — you&apos;ll confirm your age before
                  you can add it.
                </p>
              </div>
              {confirmed ? (
                <LinkButton href="#build" variant="sun" size="lg" className="mt-7">
                  Build a FUEL box
                  <ArrowRight size={18} strokeWidth={2.5} />
                </LinkButton>
              ) : (
                <LinkButton
                  href="#build"
                  variant="sun"
                  size="lg"
                  className="mt-7"
                  onClick={(e) => {
                    e.preventDefault();
                    requireAge(() => {
                      document.getElementById("build")?.scrollIntoView({ behavior: "smooth" });
                    });
                  }}
                >
                  <ShieldCheck size={18} strokeWidth={2.5} />
                  I&apos;m 16+ — show me FUEL
                </LinkButton>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
