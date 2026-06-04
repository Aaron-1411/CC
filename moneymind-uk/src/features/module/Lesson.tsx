import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, ExternalLink, TrendingUp } from "lucide-react";
import type { LessonSection } from "../../lib/types";
import { XP_REWARDS } from "../../lib/storage";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Callout } from "../../components/Callout";
import { Markdown } from "../../components/Markdown";
import { Reveal } from "../../components/Reveal";
import { CountUp } from "../../components/CountUp";

interface LessonProps {
  sections: LessonSection[];
  lessonDone: boolean;
  onComplete: () => void;
  onNext: () => void;
}

// A scrolling lesson, not a wall of text. Each concept fades + rises as it
// enters the viewport (upcoming sections sit invisible below the fold, so the
// eye only ever has the current block to process — engagement AND lower
// cognitive load at once). Key figures pull out into a stat tile whose number
// counts up the moment it scrolls into view. Reduced-motion users get instant,
// travel-free reveals everywhere via the shared Reveal/CountUp components.
export function Lesson({ sections, lessonDone, onComplete, onNext }: LessonProps) {
  const total = sections.length;

  return (
    <div className="flex flex-col gap-5">
      {sections.map((s, i) => (
        <Reveal key={i} delay={0}>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white tabular-nums">
                {i + 1}
              </span>
              <h2 className="text-lg font-bold text-navy-900">{s.heading}</h2>
            </div>
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
        </Reveal>
      ))}

      <Reveal delay={0.05}>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-sm text-navy-500">
            {lessonDone ? "Lesson complete — ready for the quiz?" : `That's all ${total} sections.`}
          </p>
          <Button
            onClick={() => {
              if (!lessonDone) onComplete();
              onNext();
            }}
          >
            {lessonDone ? (
              <>Next: Quiz</>
            ) : (
              <>
                Mark complete (+{XP_REWARDS.lesson} XP) <CheckCircle2 className="h-4 w-4" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </Reveal>
    </div>
  );
}

// Pull the headline number out of the callout text and count it up on scroll.
// We keep the surrounding words intact (prefix/suffix) so context is preserved.
const NUM_RE = /£\s?[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?\s?%|\d[\d,]*(?:\.\d+)?/;

function FigureStat({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const match = text.match(NUM_RE);

  let prefix = text;
  let suffix = "";
  let numericValue: number | null = null;
  let isMoney = false;
  let isPercent = false;

  if (match && match.index !== undefined) {
    const raw = match[0];
    prefix = text.slice(0, match.index);
    suffix = text.slice(match.index + raw.length);
    isMoney = raw.includes("£");
    isPercent = raw.includes("%");
    const parsed = parseFloat(raw.replace(/[£,%\s]/g, ""));
    if (!Number.isNaN(parsed)) numericValue = parsed;
  }

  const format = (v: number) => {
    const rounded = Math.round(v);
    const body = rounded.toLocaleString("en-GB");
    if (isMoney) return `£${body}`;
    if (isPercent) return `${body}%`;
    return body;
  };

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white">
        <TrendingUp className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-emerald-600">Key figure</div>
        {numericValue !== null ? (
          <p className="mt-0.5 text-sm leading-relaxed text-navy-700">
            {prefix}
            <span className="font-bold text-emerald-700">
              <CountUp value={numericValue} format={format} startOnView />
            </span>
            {suffix}
          </p>
        ) : (
          <p className="mt-0.5 text-sm leading-relaxed text-navy-700">{text}</p>
        )}
      </div>
    </motion.div>
  );
}
