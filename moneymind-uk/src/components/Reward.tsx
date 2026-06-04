import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Award, PoundSterling, Zap } from "lucide-react";
import { clsx } from "clsx";
import { Confetti } from "./Confetti";
import { badgeGroups } from "../content/badges";
import type { ProgressState } from "../lib/types";

// ── Public API ────────────────────────────────────────────────────────────────
export type RewardEvent =
  | { kind: "xp"; amount: number }
  | { kind: "money"; amount: number }
  | { kind: "badge"; label: string; description?: string };

interface RewardCtx {
  celebrate: (e: RewardEvent) => void;
}
const Ctx = createContext<RewardCtx>({ celebrate: () => {} });
export const useReward = () => useContext(Ctx);

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

let _id = 0;
interface Toast {
  id: number;
  kind: "xp" | "money";
  amount: number;
}
interface BadgePop {
  id: number;
  label: string;
  description?: string;
}

// ── Provider ────────────────────────────────────────────────────────────────
export function RewardProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [badge, setBadge] = useState<BadgePop | null>(null);
  const queue = useRef<BadgePop[]>([]);

  // Show the next queued badge only when none is on screen.
  const pump = useCallback(() => {
    setBadge((cur) => cur ?? queue.current.shift() ?? null);
  }, []);

  const celebrate = useCallback(
    (e: RewardEvent) => {
      if (e.kind === "badge") {
        queue.current.push({ id: ++_id, label: e.label, description: e.description });
        pump();
        return;
      }
      const t: Toast = { id: ++_id, kind: e.kind, amount: e.amount };
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 1900);
    },
    [pump],
  );

  // Auto-dismiss the active badge, then surface any queued one.
  useEffect(() => {
    if (!badge) {
      const id = setTimeout(pump, 220);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setBadge(null), 3200);
    return () => clearTimeout(id);
  }, [badge, pump]);

  return (
    <Ctx.Provider value={{ celebrate }}>
      {children}
      <RewardLayer toasts={toasts} badge={badge} onDismiss={() => setBadge(null)} />
    </Ctx.Provider>
  );
}

// ── Overlay layer ─────────────────────────────────────────────────────────────
function RewardLayer({
  toasts,
  badge,
  onDismiss,
}: {
  toasts: Toast[];
  badge: BadgePop | null;
  onDismiss: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <>
      {/* Earn toasts — bottom centre, stacked */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[55] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.9 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.95 }}
              transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 420, damping: 28 }}
              className={clsx(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-card-hover",
                t.kind === "xp" ? "bg-navy-900" : "bg-emerald-600",
              )}
            >
              {t.kind === "xp" ? (
                <Zap className="h-4 w-4 text-emerald-300" aria-hidden />
              ) : (
                <PoundSterling className="h-4 w-4 text-emerald-100" aria-hidden />
              )}
              {t.kind === "xp" ? `+${t.amount} XP` : `+${gbp.format(t.amount)} found`}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Badge unlock — centre modal + confetti */}
      <AnimatePresence>
        {badge && (
          <motion.div
            key="badge-backdrop"
            className="fixed inset-0 z-[58] flex items-center justify-center bg-navy-900/30 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            role="dialog"
            aria-label={`Badge unlocked: ${badge.label}`}
          >
            <Confetti />
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 12 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 22 }}
              className="relative z-[59] w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-card-hover"
            >
              <motion.div
                className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                initial={reduce ? false : { rotate: -14, scale: 0.5 }}
                animate={reduce ? false : { rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 13, delay: 0.05 }}
              >
                <Award className="h-8 w-8" aria-hidden />
              </motion.div>
              <div className="mt-4 text-xs font-bold uppercase tracking-wide text-emerald-600">
                Badge unlocked
              </div>
              <div className="mt-1 text-lg font-bold text-navy-900">{badge.label}</div>
              {badge.description && <p className="mt-1 text-sm text-navy-500">{badge.description}</p>}
              <button
                onClick={onDismiss}
                className="mt-5 rounded-xl bg-navy-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
              >
                Nice!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Progress watcher ──────────────────────────────────────────────────────────
// Diffs progress on each change and fires the matching celebrations. Decoupled
// from the updaters, so every XP/money/badge gain anywhere in the app is felt.
const ALL_BADGES = new Map<string, { label: string; description: string }>();
for (const group of badgeGroups()) {
  for (const b of group.badges) ALL_BADGES.set(b.id, { label: b.label, description: b.description });
}

export function ProgressRewards({ progress }: { progress: ProgressState }) {
  const { celebrate } = useReward();
  const prev = useRef<{ xp: number; money: number; badges: Set<string> } | null>(null);

  useEffect(() => {
    const p = prev.current;
    // First run after load: snapshot only, never celebrate existing progress.
    if (p === null) {
      prev.current = { xp: progress.xp, money: progress.moneyFound, badges: new Set(progress.badges) };
      return;
    }
    if (progress.xp > p.xp) celebrate({ kind: "xp", amount: progress.xp - p.xp });
    if (progress.moneyFound > p.money) celebrate({ kind: "money", amount: progress.moneyFound - p.money });
    for (const id of progress.badges) {
      if (!p.badges.has(id)) {
        const meta = ALL_BADGES.get(id);
        celebrate({ kind: "badge", label: meta?.label ?? "New badge", description: meta?.description });
      }
    }
    prev.current = { xp: progress.xp, money: progress.moneyFound, badges: new Set(progress.badges) };
  }, [progress, celebrate]);

  return null;
}
