"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COLORS } from "@/lib/brand";
import { Wordmark } from "@/components/brand/Wordmark";
import { Gummy } from "@/components/brand/Gummy";

interface AgeGateContextValue {
  /** True once the visitor has confirmed they're 16+ this session. */
  confirmed: boolean;
  /**
   * Run `action` if already confirmed, otherwise open the gate and run it on
   * confirmation. Used to guard any FUEL (caffeine, 16+) interaction.
   */
  requireAge: (action?: () => void) => void;
}

const AgeGateContext = createContext<AgeGateContextValue | null>(null);

export function AgeGateProvider({ children }: { children: React.ReactNode }) {
  const [confirmed, setConfirmed] = useState(false);
  const [open, setOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const requireAge = useCallback(
    (action?: () => void) => {
      if (confirmed) {
        action?.();
        return;
      }
      pendingAction.current = action ?? null;
      setOpen(true);
    },
    [confirmed],
  );

  const confirm = useCallback(() => {
    setConfirmed(true);
    setOpen(false);
    pendingAction.current?.();
    pendingAction.current = null;
  }, []);

  const deny = useCallback(() => {
    setOpen(false);
    pendingAction.current = null;
  }, []);

  return (
    <AgeGateContext.Provider value={{ confirmed, requireAge }}>
      {children}
      <AnimatePresence>
        {open && <AgeGateModal onConfirm={confirm} onDeny={deny} />}
      </AnimatePresence>
    </AgeGateContext.Provider>
  );
}

function AgeGateModal({
  onConfirm,
  onDeny,
}: {
  onConfirm: () => void;
  onDeny: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      {/* scrim */}
      <button
        type="button"
        aria-label="Close"
        onClick={onDeny}
        className="absolute inset-0 cursor-default bg-[rgba(15,28,22,0.6)] backdrop-blur-sm"
        tabIndex={-1}
      />

      <motion.div
        className="relative w-full max-w-sm overflow-hidden rounded-gummy bg-white p-7 text-center shadow-lift"
        initial={{ scale: 0.85, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <div
          className="pointer-events-none absolute inset-0 candy-dots opacity-[0.05]"
          style={{ color: COLORS.pine }}
          aria-hidden="true"
        />

        <div className="relative">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Gummy shape="bottle" color="sun" size={30} />
            <Wordmark variant="horizontal" height={20} />
          </div>

          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-full border-[3px] text-base font-extrabold"
            style={{ borderColor: COLORS.sun, color: COLORS.pine }}
            aria-hidden="true"
          >
            16+
          </span>

          <h2
            id="age-gate-title"
            className="mt-4 font-display text-2xl font-extrabold text-pine"
          >
            Quick one — are you 16 or over?
          </h2>
          <p className="mt-2 text-sm text-ink/70">
            FUEL packs contain caffeine, so we keep them 16+. EVERYDAY treats are
            for all ages.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-pill bg-raspberry px-5 py-3 text-sm font-bold text-white shadow-soft transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Yep, I&apos;m 16 or over
            </button>
            <button
              type="button"
              onClick={onDeny}
              className="rounded-pill px-5 py-2.5 text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
            >
              Not yet — show me EVERYDAY
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function useAgeGate(): AgeGateContextValue {
  const ctx = useContext(AgeGateContext);
  if (!ctx) throw new Error("useAgeGate must be used within an AgeGateProvider");
  return ctx;
}
