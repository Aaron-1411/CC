import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ListChecks,
  PoundSterling,
  Sparkles,
  Target,
  Trophy,
  Wrench,
} from "lucide-react";
import { clsx } from "clsx";
import { getModuleBySlug, nextModule } from "../../content/modules";
import { tierInfo } from "../../content/tiers";
import type { ProgressState } from "../../lib/types";
import type { ProgressUpdaters } from "../../lib/storage";
import { getModuleStatus } from "../../lib/gamification";
import { PageContainer } from "../../components/PageContainer";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { StatusPill } from "../../components/Pill";
import { Lesson } from "./Lesson";
import { Quiz } from "../quiz/Quiz";
import { ToolRouter } from "../tools/ToolRouter";
import { TutorPanel } from "../tutor/TutorPanel";

type Step = "lesson" | "quiz" | "tool" | "quest";

interface ModulePageProps {
  progress: ProgressState;
  updaters: ProgressUpdaters;
}

export function ModulePage({ progress, updaters }: ModulePageProps) {
  const { slug } = useParams();
  const [step, setStep] = useState<Step>("lesson");
  const [tutorOpen, setTutorOpen] = useState(false);
  const [showTldr, setShowTldr] = useState(false);

  const mod = slug ? getModuleBySlug(slug) : undefined;

  if (!mod) {
    return (
      <PageContainer className="py-20 text-center">
        <h1 className="text-2xl font-bold text-navy-900">Module not found</h1>
        <p className="mt-2 text-navy-500">That course module doesn't exist or has moved.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </PageContainer>
    );
  }

  const tier = tierInfo(mod.tier);
  const lessonDone = progress.completedLessons.includes(mod.id);
  const quizDone = progress.quizScores[mod.id] !== undefined;
  const toolDone = progress.toolsUsed.includes(mod.id);
  const questDone = progress.questsCompleted.includes(mod.id);
  const status = getModuleStatus(mod.id, progress);
  const justComplete = status === "complete";
  const nextMod = nextModule(mod.id);

  const steps: { key: Step; label: string; icon: typeof BookOpen; done: boolean }[] = [
    { key: "lesson", label: "Learn", icon: BookOpen, done: lessonDone },
    { key: "quiz", label: "Quiz", icon: ListChecks, done: quizDone },
    ...(mod.tool ? [{ key: "tool" as const, label: "Tool", icon: Wrench, done: toolDone }] : []),
    { key: "quest", label: "Apply", icon: Target, done: questDone },
  ];
  const currentIndex = Math.max(0, steps.findIndex((s) => s.key === step));
  const doneCount = steps.filter((s) => s.done).length;

  function completeQuest() {
    if (!mod || questDone) return;
    updaters.completeQuest(mod.id, {
      moneyFound: mod.quest.moneyFound,
      badgeId: mod.quest.unlocksBadge,
    });
  }

  return (
    <PageContainer narrow className="py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All modules
      </Link>

      <div className="mt-4 flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-navy-50 text-emerald-500">
          <Icon name={mod.icon} className="h-6 w-6" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full ${tier.badgeBg} ${tier.accent} px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide`}>
              Tier {tier.tier} · {tier.name}
            </span>
            <span className="text-xs font-medium text-navy-400">{mod.code}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-navy-900">{mod.title}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-navy-400">
            <span>~{mod.estMinutes} min</span>
            <span aria-hidden>·</span>
            <StatusPill status={status} />
          </div>
        </div>
      </div>

      {/* TL;DR toggle */}
      <div className="mt-4">
        <button
          onClick={() => setShowTldr((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-navy-50 px-3 py-2 text-sm font-semibold text-navy-700 transition-[background-color,transform] duration-200 ease-out hover:bg-navy-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          aria-expanded={showTldr}
        >
          <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden />
          {showTldr ? "Hide the 30-second TL;DR" : "Show the 30-second TL;DR"}
        </button>
        {showTldr && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 overflow-hidden"
          >
            <Card className="bg-emerald-50 text-sm leading-relaxed text-emerald-900">{mod.tldr}</Card>
          </motion.div>
        )}
      </div>

      {/* Completion banner */}
      {justComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white"
        >
          <Trophy className="h-6 w-6 shrink-0" aria-hidden />
          <div className="text-sm">
            <div className="font-semibold">Module complete — badge earned: {mod.badge.label}</div>
            <div className="text-emerald-50">{mod.badge.description}</div>
          </div>
        </motion.div>
      )}

      {/* Step tabs */}
      <div className="sticky top-16 z-30 -mx-4 mt-6 bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-navy-400">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="text-xs font-medium tabular-nums text-navy-400">
            {doneCount}/{steps.length} done
          </span>
        </div>
        <div className="flex gap-2">
          {steps.map((s) => {
            const StepIcon = s.icon;
            const active = step === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setStep(s.key)}
                className={clsx(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-[background-color,transform] duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                  active ? "bg-navy-900 text-white" : "bg-white text-navy-600 hover:bg-navy-100",
                )}
                aria-current={active ? "step" : undefined}
              >
                {s.done ? (
                  <CheckCircle2 className={clsx("h-4 w-4", active ? "text-emerald-300" : "text-emerald-500")} aria-hidden />
                ) : (
                  <StepIcon className="h-4 w-4" aria-hidden />
                )}
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tutor button — deliberately quiet so it stays subordinate to each step's primary action */}
      <button
        onClick={() => setTutorOpen(true)}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-navy-100 bg-white px-4 py-3 text-left shadow-card transition-[background-color,transform] duration-200 ease-out hover:bg-navy-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <span className="text-sm">
          <span className="block font-semibold text-navy-800">Stuck? Ask the AI tutor</span>
          <span className="text-navy-500">Plain-English answers about {mod.title.toLowerCase()}.</span>
        </span>
      </button>

      {/* Step content */}
      <div className="mt-6">
        {step === "lesson" && (
          <Lesson
            sections={mod.lesson}
            lessonDone={lessonDone}
            onComplete={() => updaters.markLessonComplete(mod.id)}
            onNext={() => setStep("quiz")}
          />
        )}

        {step === "quiz" && (
          <div className="flex flex-col gap-5">
            <Quiz
              questions={mod.quiz}
              moduleId={mod.id}
              alreadyDone={quizDone}
              onComplete={(score) => updaters.recordQuizScore(mod.id, score)}
            />
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setStep(mod.tool ? "tool" : "quest")}>
                {mod.tool ? "Next: Try the tool" : "Next: Apply it"} <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}

        {step === "tool" && mod.tool && (
          <div className="flex flex-col gap-5">
            <Card>
              <ToolRouter tool={mod.tool} onUse={() => updaters.markToolUsed(mod.id)} />
            </Card>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setStep("quest")}>
                Next: Apply it <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}

        {step === "quest" && (
          <div className="flex flex-col gap-5">
            <Card className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                <Target className="h-4 w-4" aria-hidden /> Your real-world quest
              </div>
              <p className="text-lg font-semibold text-navy-900">{mod.quest.task}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden /> +{mod.quest.xp} XP
                </span>
                {mod.quest.moneyFound != null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                    <PoundSterling className="h-3.5 w-3.5" aria-hidden /> Could find ~£{mod.quest.moneyFound}
                  </span>
                )}
              </div>
              <p className="text-xs text-navy-400">
                Self-reported — tick it off once you've done it in real life. Estimates only, never advice.
              </p>
              {questDone ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> Quest completed — nice work!
                </span>
              ) : (
                <div>
                  <Button onClick={completeQuest}>
                    I've done this (+{mod.quest.xp} XP)
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              )}
            </Card>

            {justComplete && (
              <Card className="flex flex-col items-center gap-3 text-center">
                <Trophy className="h-8 w-8 text-emerald-500" aria-hidden />
                <p className="font-semibold text-navy-900">You've finished this module!</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to="/">
                    <Button variant="secondary">Back to dashboard</Button>
                  </Link>
                  {nextMod && (
                    <Link to={`/module/${nextMod.slug}`} onClick={() => setStep("lesson")}>
                      <Button>
                        Next module <ArrowRight className="h-4 w-4" aria-hidden />
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <TutorPanel
        open={tutorOpen}
        onClose={() => setTutorOpen(false)}
        moduleId={mod.id}
        moduleTitle={mod.title}
        suggestedQuestions={mod.suggestedQuestions}
      />
    </PageContainer>
  );
}
