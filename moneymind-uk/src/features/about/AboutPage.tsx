import { Award, Lock, PoundSterling, RotateCcw, ShieldCheck, Sparkles, Trophy, Zap } from "lucide-react";
import { clsx } from "clsx";
import { UK_FIGURES } from "../../content/constants";
import { badgeGroups } from "../../content/badges";
import { RANK_LADDER } from "../../content/tiers";
import type { ProgressState } from "../../lib/types";
import type { ProgressUpdaters } from "../../lib/storage";
import { XP_REWARDS } from "../../lib/storage";
import { currentRank, getLevelInfo, getLevelProgress } from "../../lib/gamification";
import { PageContainer } from "../../components/PageContainer";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { ProgressBar } from "../../components/ProgressBar";

interface AboutPageProps {
  progress: ProgressState;
  updaters: ProgressUpdaters;
}

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function AboutPage({ progress, updaters }: AboutPageProps) {
  const { title, nextLevelXp } = getLevelInfo(progress.xp);
  const levelPct = getLevelProgress(progress.xp);
  const rank = currentRank(progress);
  const earned = new Set(progress.badges);
  const groups = badgeGroups();
  const totalBadges = groups.reduce((n, g) => n + g.badges.length, 0);

  function handleReset() {
    if (window.confirm("Reset all your progress, XP and badges? This can't be undone.")) {
      updaters.resetProgress();
    }
  }

  return (
    <PageContainer narrow className="py-10">
      <h1 className="text-3xl font-bold text-navy-900">About MoneyMind UK</h1>
      <p className="mt-2 text-navy-500">
        A free, friendly course that helps everyday people in the UK understand their money and their
        rights — across 23 modules in four tiers, from payslips and benefits to pensions, debt and tax.
        Learn a topic, take a quick quiz, try a real calculator, apply it in the real world, and ask the
        AI tutor anything.
      </p>

      {/* Headline: Money Found + rank */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-2 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Money found</div>
          <div className="flex items-center gap-2">
            <PoundSterling className="h-7 w-7 text-emerald-200" aria-hidden />
            <span className="text-4xl font-bold tabular-nums">{gbp.format(progress.moneyFound)}</span>
          </div>
          <p className="text-sm text-emerald-50">Unlocked through real-world quests. An estimate, never advice.</p>
        </Card>
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-navy-500">Your rank</div>
              <div className="flex items-center gap-2 text-2xl font-bold text-navy-900">
                <Trophy className="h-6 w-6 text-emerald-500" aria-hidden /> {rank}
              </div>
              <div className="text-sm text-navy-400">{title}</div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-600">
              <Zap className="h-4 w-4" aria-hidden /> {progress.xp} XP
            </div>
          </div>
          <ProgressBar value={levelPct} label="Progress to next XP title" />
          <p className="text-sm text-navy-400">
            {nextLevelXp === null
              ? "You've reached the top XP title — nice work!"
              : `${nextLevelXp - progress.xp} XP to the next title.`}
          </p>
        </Card>
      </div>

      {/* Rank ladder */}
      <Card className="mt-6 flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-bold text-navy-900">
          <Trophy className="h-5 w-5 text-emerald-500" aria-hidden /> The rank ladder
        </h2>
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {RANK_LADDER.map((r) => {
            const active = r === rank;
            return (
              <li
                key={r}
                className={clsx(
                  "rounded-full px-3 py-1 font-semibold",
                  active ? "bg-navy-900 text-white" : "bg-navy-50 text-navy-500",
                )}
              >
                {r}
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-navy-400">
          Clear every module in a tier to earn its rank and unlock the next. Finish all four tiers to
          become a MoneyMind Graduate.
        </p>
      </Card>

      {/* How XP works */}
      <Card className="mt-6 flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-bold text-navy-900">
          <Sparkles className="h-5 w-5 text-emerald-500" aria-hidden /> How you earn XP
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          <XpRow label="Finish a lesson" xp={XP_REWARDS.lesson} />
          <XpRow label="Complete a quiz" xp={XP_REWARDS.quiz} />
          <XpRow label="Score 100% on a quiz" xp={XP_REWARDS.perfectQuiz} />
          <XpRow label="Use a tool" xp={XP_REWARDS.tool} />
          <XpRow label="Complete a real-world quest" xp={XP_REWARDS.quest} />
          <XpRow label="Finish a whole module" xp={XP_REWARDS.moduleComplete} />
        </ul>
      </Card>

      {/* Badges */}
      <h2 className="mt-8 flex items-center gap-2 text-xl font-bold text-navy-900">
        <Award className="h-5 w-5 text-emerald-500" aria-hidden /> Badges
        <span className="text-sm font-normal text-navy-400">({earned.size} of {totalBadges})</span>
      </h2>
      {groups.map((group) => (
        <div key={group.title} className="mt-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy-500">{group.title}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.badges.map((b) => {
              const unlocked = earned.has(b.id);
              return (
                <div
                  key={b.id}
                  className={clsx(
                    "flex items-start gap-3 rounded-2xl border p-4",
                    unlocked ? "border-emerald-200 bg-emerald-50" : "border-navy-100 bg-white",
                  )}
                >
                  <span
                    className={clsx(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                      unlocked ? "bg-emerald-500 text-white" : "bg-navy-100 text-navy-400",
                    )}
                  >
                    {unlocked ? <Award className="h-5 w-5" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
                  </span>
                  <div>
                    <div className={clsx("font-semibold", unlocked ? "text-emerald-900" : "text-navy-500")}>{b.label}</div>
                    <div className={clsx("text-sm", unlocked ? "text-emerald-700" : "text-navy-400")}>{b.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Privacy & data */}
      <Card className="mt-8 flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-bold text-navy-900">
          <ShieldCheck className="h-5 w-5 text-emerald-500" aria-hidden /> Your data & privacy
        </h2>
        <p className="text-sm leading-relaxed text-navy-500">
          MoneyMind works without an account. Your progress, XP and badges are saved only in this
          browser (using local storage) — nothing is sent to a server and there's no sign-up. Clearing
          your browser data, or the button below, will reset everything.
        </p>
        <div>
          <Button variant="danger" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Reset my progress
          </Button>
        </div>
      </Card>

      {/* Disclaimer */}
      <p className="mt-8 rounded-xl bg-navy-50 px-4 py-3 text-xs leading-relaxed text-navy-500">
        <span className="font-semibold text-navy-600">Important: </span>
        MoneyMind UK is an educational tool providing general information using {UK_FIGURES.taxYear} figures
        verified against gov.uk. It is <strong>not</strong> regulated financial, legal or tax advice. For
        decisions about your own situation, speak to a qualified adviser or use the official services on the
        Find Help page.
      </p>
    </PageContainer>
  );
}

function XpRow({ label, xp }: { label: string; xp: number }) {
  return (
    <li className="flex items-center justify-between rounded-xl bg-navy-50 px-3.5 py-2.5 text-sm">
      <span className="text-navy-700">{label}</span>
      <span className="font-semibold text-emerald-600 tabular-nums">+{xp} XP</span>
    </li>
  );
}
