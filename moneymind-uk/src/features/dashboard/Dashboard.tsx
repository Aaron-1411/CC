import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Flame,
  Lock,
  PoundSterling,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { modules, modulesByTier } from "../../content/modules";
import {
  TIERS,
  moneyMinuteForDate,
  personaInfo,
  type TierInfo,
} from "../../content/tiers";
import type { ProgressState } from "../../lib/types";
import {
  currentRank,
  getLevelInfo,
  getLevelProgress,
  getModuleStatus,
  isGraduate,
  isTierComplete,
  isTierUnlocked,
  overallProgress,
  tierProgress,
} from "../../lib/gamification";
import { Card } from "../../components/Card";
import { CountUp } from "../../components/CountUp";
import { Reveal } from "../../components/Reveal";
import { ProgressBar } from "../../components/ProgressBar";
import { StatusPill } from "../../components/Pill";
import { Icon } from "../../components/Icon";
import { PageContainer } from "../../components/PageContainer";

interface DashboardProps {
  progress: ProgressState;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function Dashboard({ progress }: DashboardProps) {
  const graduate = isGraduate(progress);
  const rank = currentRank(progress);
  const { title: levelTitle, nextLevelXp } = getLevelInfo(progress.xp);
  const levelPct = getLevelProgress(progress.xp);
  const pct = overallProgress(progress);
  const persona = progress.persona ? personaInfo(progress.persona) : undefined;
  const floatIds = new Set(persona?.floatIds ?? []);

  // The single obvious next action — in-progress module first, else the next
  // unlocked one. Gives returning users one clear target instead of 23 cards.
  const nextUp = useMemo(() => {
    const open = modules.filter(
      (m) => isTierUnlocked(m.tier, progress) && getModuleStatus(m.id, progress) !== "complete",
    );
    return open.find((m) => getModuleStatus(m.id, progress) === "in-progress") ?? open[0];
  }, [progress]);
  const startedAny =
    progress.completedLessons.length > 0 ||
    Object.keys(progress.quizScores).length > 0 ||
    progress.questsCompleted.length > 0;

  return (
    <PageContainer className="py-8">
      {/* ───────────────────────── HUD ───────────────────────── */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 lg:grid-cols-3">
        {/* Money Found hero */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card padding="lg" className="h-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-100">
              Money found so far
            </div>
            <div className="mt-2 flex items-center gap-2">
              <PoundSterling className="h-8 w-8 text-emerald-200" aria-hidden />
              <CountUp
                value={progress.moneyFound}
                format={(v) => gbp.format(v)}
                className="text-5xl font-bold tabular-nums"
                startOnView
              />
            </div>
            <p className="mt-2 max-w-md text-sm text-emerald-50">
              Real money you could unlock by completing quests — claimed allowances, switched bills and
              captured pension match. An estimate, never advice.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-semibold">
                <Trophy className="h-4 w-4" aria-hidden /> {rank}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-semibold">
                <Zap className="h-4 w-4" aria-hidden /> {progress.xp} XP
              </span>
              {progress.streak.count > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-semibold">
                  <Flame className="h-4 w-4" aria-hidden /> {progress.streak.count} day
                  {progress.streak.count !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Rank + overall progress */}
        <motion.div variants={item}>
          <Card className="flex h-full flex-col gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-navy-500">Your rank</div>
              <div className="text-2xl font-bold text-navy-900">{rank}</div>
              <div className="text-sm text-navy-400">{levelTitle}</div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-navy-400">
                <span>Course progress</span>
                <span className="font-semibold text-navy-600">{pct}%</span>
              </div>
              <ProgressBar value={pct} label="Course progress" />
            </div>
            <p className="text-xs text-navy-400">
              {nextLevelXp === null
                ? "Top XP level reached — nice work!"
                : `${nextLevelXp - progress.xp} XP to your next title.`}
            </p>
            <div className="mt-auto">
              <ProgressBar value={levelPct} size="sm" color="navy" label="XP to next title" />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ─────────────────── Continue / Next up ─────────────────── */}
      {nextUp && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <Link
            to={`/module/${nextUp.slug}`}
            className="group flex items-center gap-4 rounded-2xl bg-navy-900 p-5 text-white shadow-card transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-emerald-300">
              <Icon name={nextUp.icon} className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                {startedAny ? "Pick up where you left off" : "Start here"}
              </div>
              <div className="truncate text-lg font-bold">{nextUp.title}</div>
              <div className="text-sm text-navy-300">
                ~{nextUp.estMinutes} min · Tier {nextUp.tier}
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold transition-colors group-hover:bg-emerald-400">
              <span className="hidden sm:inline">{startedAny ? "Continue" : "Start"}</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        </motion.div>
      )}

      {/* ─────────────────── Persona on-ramp ─────────────────── */}
      <div className="mt-4">
        {persona ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy-100 bg-white px-4 py-3 text-sm shadow-card">
            <span className="flex items-center gap-2 text-navy-600">
              <Icon name={persona.icon} className="h-4 w-4 text-emerald-600" />
              Tailored for <span className="font-semibold text-navy-900">{persona.label}</span> — your
              most useful modules are highlighted below.
            </span>
            <Link to="/start" className="font-semibold text-emerald-700 hover:underline">
              Change path
            </Link>
          </div>
        ) : (
          <Link
            to="/start"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm shadow-card transition-colors hover:bg-emerald-100"
          >
            <span className="flex items-center gap-2 font-semibold text-emerald-900">
              <Sparkles className="h-4 w-4" aria-hidden /> Pick your path — a 20-second quiz that
              highlights the modules that matter most to you.
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              Start <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        )}
      </div>

      {/* ─────────────────── Money Minute ─────────────────── */}
      <div className="mt-4">
        <MoneyMinute />
      </div>

      {/* ─────────────────── For Kids ─────────────────── */}
      <div className="mt-4">
        <Link
          to="/kids"
          className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-white px-4 py-3 text-sm shadow-card transition-colors hover:from-sky-100"
        >
          <span className="flex items-center gap-2 font-semibold text-navy-800">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-100 text-sky-600">
              <Icon name="PiggyBank" className="h-4 w-4" />
            </span>
            Got kids? <span className="text-navy-600">MoneyMind Kids teaches ages 5–16 the money basics — simple and playful.</span>
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-sky-700">
            Explore <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </Link>
      </div>

      {/* ─────────────────── Graduate summit ─────────────────── */}
      {graduate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 p-8 text-center text-white shadow-card"
        >
          <Trophy className="mx-auto mb-3 h-12 w-12 text-white/90" aria-hidden />
          <h2 className="text-2xl font-bold">MoneyMind Graduate!</h2>
          <p className="mt-1 text-amber-50">
            You've completed every module across all four tiers. You know your money and your rights.
          </p>
        </motion.div>
      )}

      {/* ─────────────────── Journey map ─────────────────── */}
      <h2 className="mt-10 text-xl font-bold text-navy-900">Your journey</h2>
      <p className="text-sm text-navy-500">
        Four tiers, easy to advanced. Clear a tier to unlock the next — within a tier, take modules in
        any order.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {TIERS.map((tier) => (
          <TierBand
            key={tier.tier}
            tier={tier}
            progress={progress}
            floatIds={floatIds}
          />
        ))}
      </div>
    </PageContainer>
  );
}

// ── Tier band ───────────────────────────────────────────────────────────────
function TierBand({
  tier,
  progress,
  floatIds,
}: {
  tier: TierInfo;
  progress: ProgressState;
  floatIds: Set<number>;
}) {
  const unlocked = isTierUnlocked(tier.tier, progress);
  const complete = isTierComplete(tier.tier, progress);
  const tierPct = tierProgress(tier.tier, progress);

  // Float persona-recommended modules to the front, preserving play order.
  const mods = [...modulesByTier(tier.tier)].sort((a, b) => {
    const fa = floatIds.has(a.id) ? 0 : 1;
    const fb = floatIds.has(b.id) ? 0 : 1;
    return fa - fb;
  });

  return (
    <section aria-label={`Tier ${tier.tier}: ${tier.name}`}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full ${tier.badgeBg} ${tier.accent} px-3 py-1 text-xs font-bold uppercase tracking-wide`}
        >
          Tier {tier.tier} · {tier.name}
        </span>
        {tier.optional && (
          <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-500">
            Optional
          </span>
        )}
        {complete ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <Trophy className="h-3.5 w-3.5" aria-hidden /> {tier.rank} rank earned
          </span>
        ) : !unlocked ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-400">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Complete Tier {tier.tier - 1} to unlock
          </span>
        ) : (
          <span className="text-xs font-medium text-navy-400">{tierPct}% complete</span>
        )}
      </div>
      <p className="mb-4 text-sm text-navy-500">{tier.tagline}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mods.map((mod, idx) => {
          const status = getModuleStatus(mod.id, progress);
          const locked = !unlocked;
          const highlighted = floatIds.has(mod.id) && unlocked;
          const content = (
            <div className="flex h-full flex-col gap-3 p-6">
              <div className="flex items-start justify-between">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl ${
                    locked ? "bg-navy-50 text-navy-300" : "bg-navy-50 text-emerald-500"
                  }`}
                >
                  {locked ? <Lock className="h-4 w-4" aria-hidden /> : <Icon name={mod.icon} className="h-5 w-5" />}
                </div>
                {locked ? (
                  <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-400">
                    Locked
                  </span>
                ) : (
                  <StatusPill status={status} />
                )}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold leading-snug text-navy-900">{mod.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-navy-500">{mod.summary}</p>
                {highlighted && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    <Sparkles className="h-3 w-3" aria-hidden /> Recommended for you
                  </span>
                )}
              </div>
              {!locked && (
                <div className="flex items-center justify-between text-xs text-navy-400">
                  <span>~{mod.estMinutes} min</span>
                  <span className="flex items-center gap-1 font-medium text-emerald-600 group-hover:gap-2">
                    {status === "not-started" ? "Start" : status === "complete" ? "Review" : "Continue"}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </div>
              )}
            </div>
          );

          const cardClass = `block h-full rounded-2xl bg-white shadow-card ${
            highlighted ? "ring-2 ring-emerald-400" : ""
          }`;

          // Stagger reveals across the row, capped so later cards don't lag.
          const delay = Math.min(idx, 3) * 0.06;

          return (
            <Reveal key={mod.id} delay={delay} className="h-full">
              {locked ? (
                <div className={`${cardClass} opacity-60`} aria-disabled>
                  {content}
                </div>
              ) : (
                <Link
                  to={`/module/${mod.slug}`}
                  className={`group ${cardClass} transition-shadow duration-200 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`}
                  aria-label={`${mod.title} — ${status}`}
                >
                  {content}
                </Link>
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

// ── Daily Money Minute ────────────────────────────────────────────────────────
function MoneyMinute() {
  const card = moneyMinuteForDate();
  const [revealed, setRevealed] = useState(false);
  const linked = card.moduleSlug ? modules.find((m) => m.slug === card.moduleSlug) : undefined;

  return (
    <Card className="flex flex-col gap-3 border border-amber-100">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
        <Flame className="h-4 w-4" aria-hidden /> Today's Money Minute
      </div>
      <p className="font-semibold text-navy-900">{card.prompt}</p>
      {revealed ? (
        <p className="text-sm leading-relaxed text-navy-600">{card.detail}</p>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="self-start rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
        >
          Reveal
        </button>
      )}
      {revealed && linked && (
        <Link
          to={`/module/${linked.slug}`}
          className="inline-flex items-center gap-1 self-start text-sm font-semibold text-emerald-700 hover:underline"
        >
          Learn more in {linked.title} <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </Card>
  );
}
