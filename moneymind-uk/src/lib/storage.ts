import { useCallback, useEffect, useRef, useState } from "react";
import type { ModuleId, Persona, ProgressState } from "./types";

// Single persistence key. The `:v1` suffix lets us migrate the shape later
// without colliding with old data.
const STORAGE_KEY = "moneymind:progress:v1";

// XP economy (Shared Contract + curriculum additions). Exported so the
// gamification engine and UI display the same numbers — no second source.
export const XP_REWARDS = {
  lesson: 50,
  quiz: 100,
  tool: 25,
  moduleComplete: 150,
  quest: 75,
  perfectQuiz: 50,
} as const;

export const defaultProgress: ProgressState = {
  completedLessons: [],
  quizScores: {} as Record<ModuleId, number | undefined>,
  toolsUsed: [],
  questsCompleted: [],
  moneyFound: 0,
  persona: null,
  onboarded: false,
  xp: 0,
  badges: [],
  streak: { count: 0, lastOpenISO: "" },
};

export interface CompleteQuestOptions {
  moneyFound?: number;
  badgeId?: string;
}

export interface ProgressUpdaters {
  markLessonComplete: (id: ModuleId) => void;
  recordQuizScore: (id: ModuleId, score: number) => void;
  markToolUsed: (id: ModuleId) => void;
  completeQuest: (id: ModuleId, opts?: CompleteQuestOptions) => void;
  setPersona: (persona: Persona) => void;
  completeOnboarding: () => void;
  awardBadge: (badgeId: string) => void;
  bumpStreak: () => void;
  resetProgress: () => void;
}

// --- safe storage access (SSR-safe / private-mode / quota-safe) ---------------

function loadProgress(): ProgressState {
  if (typeof window === "undefined" || !window.localStorage) {
    return structuredCloneSafe(defaultProgress);
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredCloneSafe(defaultProgress);
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    // Merge over defaults so a partial / older payload never crashes the app.
    return {
      ...structuredCloneSafe(defaultProgress),
      ...parsed,
      quizScores: { ...defaultProgress.quizScores, ...(parsed.quizScores ?? {}) },
      streak: { ...defaultProgress.streak, ...(parsed.streak ?? {}) },
    };
  } catch {
    return structuredCloneSafe(defaultProgress);
  }
}

function saveProgress(state: ProgressState): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (e.g. Safari private mode) — fail silently;
    // progress simply won't persist this session.
  }
}

function structuredCloneSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// --- date helpers for the streak counter (local time, not UTC) ---------------

function localDateKey(d: Date): string {
  // en-CA renders as YYYY-MM-DD
  return d.toLocaleDateString("en-CA");
}

function isYesterday(prevKey: string, today: Date): boolean {
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  return prevKey === localDateKey(y);
}

// --- hook --------------------------------------------------------------------

export function useProgress(): [ProgressState, ProgressUpdaters] {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());

  // Persist on every change.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    saveProgress(progress);
  }, [progress]);

  // All mutations go through here so persistence stays in lock-step with state.
  const update = useCallback((mutate: (prev: ProgressState) => ProgressState) => {
    setProgress((prev) => {
      const next = mutate(prev);
      saveProgress(next);
      return next;
    });
  }, []);

  // Awards the 150 XP module-completion bonus exactly once — at the moment the
  // SECOND pillar (lesson + quiz) lands. Tools are optional bonus XP, not part
  // of completion (11 of 23 modules have no tool).
  const completionBonus = (s: ProgressState, id: ModuleId): number => {
    const done = s.completedLessons.includes(id) && s.quizScores[id] !== undefined;
    return done ? XP_REWARDS.moduleComplete : 0;
  };

  const markLessonComplete = useCallback(
    (id: ModuleId) =>
      update((prev) => {
        if (prev.completedLessons.includes(id)) return prev;
        const next: ProgressState = {
          ...prev,
          completedLessons: [...prev.completedLessons, id],
          xp: prev.xp + XP_REWARDS.lesson,
        };
        return { ...next, xp: next.xp + completionBonus(next, id) };
      }),
    [update],
  );

  const recordQuizScore = useCallback(
    (id: ModuleId, score: number) =>
      update((prev) => {
        const firstTime = prev.quizScores[id] === undefined;
        const best = Math.max(prev.quizScores[id] ?? 0, score);
        const perfectFirst = firstTime && score >= 100 ? XP_REWARDS.perfectQuiz : 0;
        const next: ProgressState = {
          ...prev,
          quizScores: { ...prev.quizScores, [id]: best },
          xp: prev.xp + (firstTime ? XP_REWARDS.quiz + perfectFirst : 0),
        };
        return firstTime ? { ...next, xp: next.xp + completionBonus(next, id) } : next;
      }),
    [update],
  );

  const markToolUsed = useCallback(
    (id: ModuleId) =>
      update((prev) => {
        if (prev.toolsUsed.includes(id)) return prev;
        return {
          ...prev,
          toolsUsed: [...prev.toolsUsed, id],
          xp: prev.xp + XP_REWARDS.tool,
        };
      }),
    [update],
  );

  const completeQuest = useCallback(
    (id: ModuleId, opts: CompleteQuestOptions = {}) =>
      update((prev) => {
        if (prev.questsCompleted.includes(id)) return prev;
        const badges =
          opts.badgeId && !prev.badges.includes(opts.badgeId)
            ? [...prev.badges, opts.badgeId]
            : prev.badges;
        return {
          ...prev,
          questsCompleted: [...prev.questsCompleted, id],
          moneyFound: prev.moneyFound + (opts.moneyFound ?? 0),
          xp: prev.xp + XP_REWARDS.quest,
          badges,
        };
      }),
    [update],
  );

  const setPersona = useCallback(
    (persona: Persona) => update((prev) => ({ ...prev, persona })),
    [update],
  );

  const completeOnboarding = useCallback(
    () => update((prev) => (prev.onboarded ? prev : { ...prev, onboarded: true })),
    [update],
  );

  const awardBadge = useCallback(
    (badgeId: string) =>
      update((prev) =>
        prev.badges.includes(badgeId)
          ? prev
          : { ...prev, badges: [...prev.badges, badgeId] },
      ),
    [update],
  );

  const bumpStreak = useCallback(
    () =>
      update((prev) => {
        const today = new Date();
        const todayKey = localDateKey(today);
        const last = prev.streak.lastOpenISO;
        if (last === todayKey) return prev; // already counted today
        const count = isYesterday(last, today) ? prev.streak.count + 1 : 1;
        return { ...prev, streak: { count, lastOpenISO: todayKey } };
      }),
    [update],
  );

  const resetProgress = useCallback(
    () => update(() => structuredCloneSafe(defaultProgress)),
    [update],
  );

  return [
    progress,
    {
      markLessonComplete,
      recordQuizScore,
      markToolUsed,
      completeQuest,
      setPersona,
      completeOnboarding,
      awardBadge,
      bumpStreak,
      resetProgress,
    },
  ];
}
