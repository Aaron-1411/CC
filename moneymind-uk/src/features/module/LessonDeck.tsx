import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, TrendingUp } from "lucide-react";
import { clsx } from "clsx";
import type { LessonSection } from "../../lib/types";
import { XP_REWARDS } from "../../lib/storage";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Callout } from "../../components/Callout";
import { Markdown } from "../../components/Markdown";

interface LessonDeckProps {
  sections: LessonSection[];
  lessonDone: boolean;
  onComplete: () => void;
  onNext: () => void;
}

// One concept per card. Chunks a long lesson into a paced, swipeable deck —
// lower cognitive load, more motion, a small hit of progress on every advance.
export function LessonDeck({ sections, lessonDone, onComplete, onNext }: LessonDeckProps) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);

  const total = sections.length;
  const s = sections[i];
  const atEnd = i >= total - 1;

  function go(n: number) {
    if (n < 0 || n >= total) return;
    setDir(n > i ? 1 : -1);
    setI(n);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Segmented progress */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {sections.map((_, idx) => (
            <button
              key={idx}
              onClick={() => go(idx)}
              aria-label={`Go to section ${idx + 1}`}
              className={clsx(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                idx < i ? "bg-emerald-500" : idx === i ? "bg-emerald-400" : "bg-navy-100",
              )}
            />
          ))}
        </div>
        <span className="shrink-0 text-xs font-semibold text-navy-400 tabular-nums">
          {i + 1} / {total}
        </span>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={i}
            custom={dir}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -28 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            <Card className="flex min-h-[15rem] flex-col gap-3">
              <h2 className="text-lg font-bold text-navy-900">{s.heading}</h2>
              <Markdown>{s.body}</Markdown>
              {s.callout &&
                (s.callout.type === "figure" ? (
                  <FigureStat text={s.callout.text} />
                ) : (
                  <Callout type={s.callout.type} text={s.callout.text} />
                ))}
              {s.govLink && (
                <a
                  href={s.govLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden /> {s.govLink.label}
                </a>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" disabled={i === 0} onClick={() => go(i - 1)}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </Button>
        {!atEnd ? (
          <Button onClick={() => go(i + 1)}>
            Next <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button
            onClick={() => {
              if (!lessonDone) onComplete();
              onNext();
            }}
          >
            {lessonDone ? (
              <>
                Next: Quiz <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            ) : (
              <>
                Mark complete (+{XP_REWARDS.lesson} XP) <CheckCircle2 className="h-4 w-4" aria-hidden />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// Key figures shouldn't hide inside a paragraph — pull them out as a visual,
// animated stat tile so the number that matters gets the attention.
function FigureStat({ text }: { text: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white">
        <TrendingUp className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-emerald-600">Key figure</div>
        <p className="mt-0.5 text-sm leading-relaxed text-navy-700">{text}</p>
      </div>
    </motion.div>
  );
}
