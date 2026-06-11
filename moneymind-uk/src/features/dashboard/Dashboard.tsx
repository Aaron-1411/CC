import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronRight,
  Flame,
  Lightbulb,
  Lock,
  PoundSterling,
  Sparkles,
  Trophy,
} from "lucide-react";
import { modules, modulesByTier } from "../../content/modules";
import { TIERS, moneyMinuteForDate, personaInfo, type TierInfo } from "../../content/tiers";
import type { CourseModule, ProgressState } from "../../lib/types";
import {
  completedModuleCount,
  currentRank,
  getModuleStatus,
  isGraduate,
  isTierComplete,
  isTierUnlocked,
  type ModuleStatus,
} from "../../lib/gamification";
import { Icon } from "../../components/Icon";
import { PageContainer } from "../../components/PageContainer";

interface DashboardProps {
  progress: ProgressState;
}

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function Dashboard({ progress }: DashboardProps) {
  const graduate = isGraduate(progress);
  const rank = currentRank(progress);
  const done = completedModuleCount(progress);
  const total = modules.length;

  // The single obvious next action — the in-progress module first, otherwise the
  // next unlocked one. This is the one node the whole page points at.
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

  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <PageContainer className="py-8 lg:py-12">
      {/* ── Slim status header ───────────────────────────────── */}
      <header className="mx-auto flex max-w-md items-center justify-between gap-4 lg:max-w-3xl">
        <div>
          <h1 className="text-xl font-bold text-navy-900 sm:text-2xl">Your money course</h1>
          <p className="text-sm text-navy-500">
            {done} of {total} lessons · {rank}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {progress.streak.count > 0 && (
            <Stat icon={Flame} value={`${progress.streak.count}`} tone="amber" />
          )}
          {progress.moneyFound > 0 && (
            <Stat icon={PoundSterling} value={gbp.format(progress.moneyFound)} tone="emerald" />
          )}
        </div>
      </header>

      {/* Thin overall progress line */}
      <div className="mx-auto mt-3 max-w-md lg:max-w-3xl">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {graduate && (
        <div className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 p-5 text-white shadow-card lg:max-w-3xl">
          <Trophy className="h-8 w-8 shrink-0 text-white/90" aria-hidden />
          <div>
            <div className="font-bold">MoneyMind Graduate</div>
            <div className="text-sm text-amber-50">
              Every module done across all four tiers. Revisit any time.
            </div>
          </div>
        </div>
      )}

      {/* ── Responsive body: centered path + desktop explore rail ── */}
      <div className="mt-8 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-10 lg:items-start">
        {/* The learning path — the one column everything points at */}
        <div className="mx-auto w-full max-w-sm lg:max-w-md lg:justify-self-center">
          {TIERS.map((tier) => {
            const unlocked = isTierUnlocked(tier.tier, progress);
            const complete = isTierComplete(tier.tier, progress);
            const tmods = modulesByTier(tier.tier);
            return (
              <section key={tier.tier} aria-label={`Tier ${tier.tier}: ${tier.name}`}>
                <TierDivider tier={tier} unlocked={unlocked} complete={complete} />
                <ol className="flex flex-col items-center">
                  {tmods.map((mod) => (
                    <PathNode
                      key={mod.id}
                      mod={mod}
                      status={getModuleStatus(mod.id, progress)}
                      locked={!unlocked}
                      current={nextUp?.id === mod.id}
                      startedAny={startedAny}
                    />
                  ))}
                </ol>
              </section>
            );
          })}
        </div>

        {/* ── Explore rail: stacks under the path on mobile, sticky
              sidebar on desktop so the wide screen isn't wasted ── */}
        <aside className="mx-auto mt-10 w-full max-w-sm space-y-3 lg:mt-0 lg:max-w-none lg:sticky lg:top-12">
          {/* Desktop-only at-a-glance progress recap */}
          <div className="hidden rounded-2xl border border-navy-100 bg-white p-4 shadow-card lg:block">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-navy-400">
                Progress
              </span>
              <span className="text-sm font-bold tabular-nums text-emerald-600">{pct}%</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-navy-900">{rank}</p>
            <p className="text-xs text-navy-500">
              {done} of {total} lessons complete
            </p>
          </div>

          <MoneyMinute />

          {progress.persona ? (
            <QuietLink
              to="/start"
              icon="Sparkles"
              label={`Path: ${personaInfo(progress.persona)?.label ?? "Personalised"}`}
              sub="Change your focus"
            />
          ) : (
            <QuietLink to="/start" icon="Sparkles" label="Pick your path" sub="A 20-second quiz" />
          )}

          <QuietLink
            to="/kids"
            icon="PiggyBank"
            label="MoneyMind Kids"
            sub="Money basics for ages 5–16"
          />
        </aside>
      </div>
    </PageContainer>
  );
}

// ── Small header stat chip ────────────────────────────────────────────────────
function Stat({
  icon: IconCmp,
  value,
  tone,
}: {
  icon: typeof Flame;
  value: string;
  tone: "amber" | "emerald";
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums ${tones[tone]}`}
    >
      <IconCmp className="h-4 w-4" aria-hidden />
      {value}
    </span>
  );
}

// ── Tier divider (quiet chunking label) ───────────────────────────────────────
function TierDivider({
  tier,
  unlocked,
  complete,
}: {
  tier: TierInfo;
  unlocked: boolean;
  complete: boolean;
}) {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-navy-100" />
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${tier.badgeBg} ${tier.accent}`}
      >
        {complete ? (
          <Check className="h-3.5 w-3.5" aria-hidden />
        ) : !unlocked ? (
          <Lock className="h-3.5 w-3.5" aria-hidden />
        ) : null}
        Tier {tier.tier} · {tier.name}
      </span>
      <span className="h-px flex-1 bg-navy-100" />
    </div>
  );
}

// ── A single node on the path ─────────────────────────────────────────────────
function PathNode({
  mod,
  status,
  locked,
  current,
  startedAny,
}: {
  mod: CourseModule;
  status: ModuleStatus;
  locked: boolean;
  current: boolean;
  startedAny: boolean;
}) {
  const reduce = useReducedMotion();
  const complete = status === "complete";

  // The trail line that runs into this node from above — green once you've
  // cleared this node, otherwise a calm grey.
  const connector = (
    <span
      className={`h-6 w-1 rounded-full ${complete ? "bg-emerald-300" : "bg-navy-100"}`}
      aria-hidden
    />
  );

  // Circle styling per state.
  let circle: string;
  let glyph: React.ReactNode;
  if (locked) {
    circle = "h-14 w-14 bg-navy-50 text-navy-300";
    glyph = <Lock className="h-5 w-5" aria-hidden />;
  } else if (complete) {
    circle = "h-14 w-14 bg-emerald-500 text-white shadow-card";
    glyph = <Check className="h-6 w-6" aria-hidden />;
  } else if (current) {
    circle =
      "h-20 w-20 bg-white text-emerald-600 shadow-card ring-4 ring-emerald-200";
    glyph = <Icon name={mod.icon} className="h-8 w-8" />;
  } else {
    circle = "h-14 w-14 bg-white text-navy-500 shadow-card ring-1 ring-navy-100";
    glyph = <Icon name={mod.icon} className="h-6 w-6" />;
  }

  const body = (
    <span className="flex flex-col items-center">
      {/* Bobbing focal callout — only on the one current node */}
      {current && (
        <motion.span
          animate={reduce ? undefined : { y: [0, -4, 0] }}
          transition={reduce ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="mb-2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-card"
        >
          {startedAny ? "Continue" : "Start"}
        </motion.span>
      )}
      <span className={`grid place-items-center rounded-full transition ${circle}`}>{glyph}</span>
      <span
        className={`mt-2 max-w-[8rem] text-center text-xs font-semibold leading-tight ${
          locked ? "text-navy-300" : current ? "text-navy-900" : "text-navy-600"
        }`}
      >
        {mod.title}
      </span>
    </span>
  );

  return (
    <li className="flex flex-col items-center">
      {connector}
      {locked ? (
        <span aria-disabled className="cursor-default opacity-70">
          {body}
        </span>
      ) : (
        <Link
          to={`/module/${mod.slug}`}
          aria-label={`${mod.title} — ${status}`}
          className="rounded-2xl outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {body}
        </Link>
      )}
    </li>
  );
}

// ── Quiet secondary link ──────────────────────────────────────────────────────
function QuietLink({
  to,
  icon,
  label,
  sub,
}: {
  to: string;
  icon: string;
  label: string;
  sub: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-navy-100 bg-white px-4 py-3 shadow-card transition-colors hover:bg-navy-50"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy-50 text-emerald-600">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-navy-900">{label}</span>
        <span className="block text-xs text-navy-400">{sub}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-navy-300 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

// ── Daily Money Minute (quiet, collapsible) ───────────────────────────────────
function MoneyMinute() {
  const card = moneyMinuteForDate();
  const [revealed, setRevealed] = useState(false);
  const linked = card.moduleSlug ? modules.find((m) => m.slug === card.moduleSlug) : undefined;

  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
        <Lightbulb className="h-4 w-4" aria-hidden /> Today's money minute
      </div>
      <p className="mt-2 text-sm font-semibold text-navy-900">{card.prompt}</p>
      {revealed ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-navy-600">{card.detail}</p>
          {linked && (
            <Link
              to={`/module/${linked.slug}`}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
            >
              Learn more <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
        >
          Reveal <Sparkles className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
