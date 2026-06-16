"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Lock, RotateCcw, Sparkles } from "lucide-react";
import type { Line, Product, Vibe } from "@/lib/types";
import { products } from "@/data/products";
import { useBox } from "@/components/providers/BoxProvider";
import { useAgeGate } from "@/components/providers/AgeGateProvider";
import { PackFront } from "@/components/brand/PackFront";
import { Button, LinkButton } from "@/components/ui/Button";

type Goal = "everyday" | "cut" | "energy";

interface Choice<T> {
  value: T;
  label: string;
  hint: string;
}

const GOALS: Choice<Goal>[] = [
  { value: "everyday", label: "An everyday treat", hint: "Something sweet, minus the guilt" },
  { value: "cut", label: "Smash a craving on a cut", hint: "Big flavour, tiny sugar" },
  { value: "energy", label: "A clean energy hit", hint: "Caffeine + focus, no jitters" },
];

const MOMENTS: Choice<Vibe>[] = [
  { value: "tropical", label: "The afternoon slump", hint: "3pm needs a lift" },
  { value: "fruity", label: "Post-gym refuel", hint: "Earned it" },
  { value: "nostalgic", label: "Movie on the sofa", hint: "Pass the pack" },
  { value: "sour", label: "Deep-work session", hint: "Heads down" },
];

const VIBES: Choice<Vibe>[] = [
  { value: "fruity", label: "Fruity & bright", hint: "Berries, the classics" },
  { value: "sour", label: "Sour & sharp", hint: "Pucker up" },
  { value: "nostalgic", label: "Classic & nostalgic", hint: "Tastes like back then" },
  { value: "tropical", label: "Tropical & sunny", hint: "Holiday in a pack" },
];

const GOAL_LINE: Record<Goal, Line> = {
  everyday: "EVERYDAY",
  cut: "EVERYDAY",
  energy: "FUEL",
};

function recommend(goal: Goal, momentVibe: Vibe, vibe: Vibe): Product {
  const line = GOAL_LINE[goal];
  let best = products[0];
  let bestScore = -Infinity;
  for (const p of products) {
    let score = 0;
    if (p.line === line) score += 4;
    if (p.vibe === vibe) score += 3;
    if (p.vibe === momentVibe) score += 1;
    if (p.hero) score += 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

const STEPS = 3;

export function Quiz() {
  const reduce = useReducedMotion();
  const box = useBox();
  const { confirmed, requireAge } = useAgeGate();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [moment, setMoment] = useState<Vibe | null>(null);
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [result, setResult] = useState<Product | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [added, setAdded] = useState(false);

  const step = goal === null ? 0 : moment === null ? 1 : vibe === null ? 2 : 3;

  function finish(g: Goal, m: Vibe, v: Vibe) {
    const pick = recommend(g, m, v);
    setResult(pick);
    setAdded(false);
    if (pick.line === "FUEL" && !confirmed) {
      setUnlocked(false);
      requireAge(() => setUnlocked(true));
    } else {
      setUnlocked(true);
    }
  }

  function pickGoal(g: Goal) {
    setGoal(g);
  }
  function pickMoment(m: Vibe) {
    setMoment(m);
  }
  function pickVibe(v: Vibe) {
    setVibe(v);
    if (goal && moment) finish(goal, moment, v);
  }

  function reset() {
    setGoal(null);
    setMoment(null);
    setVibe(null);
    setResult(null);
    setUnlocked(false);
    setAdded(false);
  }

  function unlockFuel() {
    if (result) requireAge(() => setUnlocked(true));
  }

  function addToBox() {
    if (!result) return;
    box.add(result.id);
    setAdded(true);
  }

  return (
    <section id="quiz" className="relative overflow-hidden bg-pine py-20 text-white lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 candy-dots opacity-[0.06]"
        style={{ color: "#FFFFFF" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(229,68,109,0.5), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-5">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sun">
            <Sparkles size={14} strokeWidth={2.5} />
            Find my DOSE
          </span>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.05] sm:text-4xl lg:text-5xl">
            Three taps. One perfect pack.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/70">
            Tell us the vibe and we&apos;ll match you to your DOSE. No quiz fatigue, promise.
          </p>
        </div>

        {/* progress dots */}
        {!result && (
          <div className="mt-8 flex items-center justify-center gap-2" aria-hidden="true">
            {Array.from({ length: STEPS }).map((_, i) => (
              <span
                key={i}
                className={[
                  "h-2 rounded-full transition-all duration-300",
                  i < step ? "w-8 bg-sun" : i === step ? "w-8 bg-raspberry" : "w-2 bg-white/25",
                ].join(" ")}
              />
            ))}
          </div>
        )}

        <div className="relative mt-8">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key={`q-${step}`}
                initial={reduce ? false : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                transition={{ duration: 0.28 }}
              >
                {step === 0 && (
                  <Question
                    eyebrow="Question 1 of 3"
                    title="What are you after?"
                    choices={GOALS}
                    onPick={pickGoal}
                    cols={1}
                  />
                )}
                {step === 1 && (
                  <Question
                    eyebrow="Question 2 of 3"
                    title="When does it hit?"
                    choices={MOMENTS}
                    onPick={pickMoment}
                    cols={2}
                  />
                )}
                {step === 2 && (
                  <Question
                    eyebrow="Question 3 of 3"
                    title="Pick your flavour mood."
                    choices={VIBES}
                    onPick={pickVibe}
                    cols={2}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={reduce ? false : { opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
              >
                {unlocked ? (
                  <Reveal
                    product={result}
                    added={added}
                    onAdd={addToBox}
                    onReset={reset}
                  />
                ) : (
                  <LockedFuel product={result} onUnlock={unlockFuel} onReset={reset} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Question<T extends string>({
  eyebrow,
  title,
  choices,
  onPick,
  cols,
}: {
  eyebrow: string;
  title: string;
  choices: Choice<T>[];
  onPick: (value: T) => void;
  cols: 1 | 2;
}) {
  return (
    <fieldset>
      <legend className="text-center">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-sun">{eyebrow}</span>
        <span className="mt-2 block font-display text-2xl font-extrabold sm:text-3xl">{title}</span>
      </legend>
      <div
        className={[
          "mt-7 grid gap-3",
          cols === 2 ? "sm:grid-cols-2" : "mx-auto max-w-md",
        ].join(" ")}
      >
        {choices.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onPick(c.value)}
            className="group flex items-center justify-between gap-3 rounded-gummy border-2 border-white/10 bg-white/[0.06] px-5 py-4 text-left transition-all hover:border-sun/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
          >
            <span>
              <span className="block font-bold">{c.label}</span>
              <span className="mt-0.5 block text-sm text-white/55">{c.hint}</span>
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-sun transition-all group-hover:bg-sun group-hover:text-pine">
              <ArrowRight size={18} strokeWidth={2.5} />
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Reveal({
  product,
  added,
  onAdd,
  onReset,
}: {
  product: Product;
  added: boolean;
  onAdd: () => void;
  onReset: () => void;
}) {
  return (
    <div className="grid items-center gap-7 rounded-gummy bg-white/[0.06] p-6 sm:p-8 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="mx-auto w-full max-w-[15rem]">
        <PackFront product={product} variant="full" className="shadow-lift" />
      </div>
      <div className="text-center lg:text-left">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-sun">
          Your match
        </span>
        <h3 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">{product.name}</h3>
        <p className="mt-1 text-sm font-semibold text-sun">
          {product.line} · {product.bigStat}
        </p>
        <p className="mx-auto mt-3 max-w-sm text-base text-white/75 lg:mx-0">{product.blurb}</p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
          {added ? (
            <LinkButton href="#build" variant="sun" size="lg">
              <Check size={18} strokeWidth={3} />
              Added — view your box
            </LinkButton>
          ) : (
            <Button onClick={onAdd} variant="primary" size="lg">
              Add to my box
              <ArrowRight size={18} strokeWidth={2.5} />
            </Button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
          >
            <RotateCcw size={15} strokeWidth={2.5} />
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}

function LockedFuel({
  product,
  onUnlock,
  onReset,
}: {
  product: Product;
  onUnlock: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md rounded-gummy bg-white/[0.06] p-7 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sun/15 text-sun">
        <Lock size={24} strokeWidth={2.5} />
      </span>
      <h3 className="mt-4 font-display text-2xl font-extrabold">Your match is a FUEL pack</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm text-white/70">
        FUEL packs have {product.active.toLowerCase()}, so we keep them 16+. Confirm your age to
        see your pick.
      </p>
      <div className="mt-6 flex flex-col items-center gap-2.5">
        <Button onClick={onUnlock} variant="sun" size="lg" className="w-full sm:w-auto">
          I&apos;m 16 or over — reveal it
        </Button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
        >
          <RotateCcw size={15} strokeWidth={2.5} />
          Start over
        </button>
      </div>
    </div>
  );
}
