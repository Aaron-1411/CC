import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Zap } from "lucide-react";
import type { QuizQuestion, ModuleId } from "../../lib/types";
import { XP_REWARDS } from "../../lib/storage";
import { ProgressBar } from "../../components/ProgressBar";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";

interface QuizProps {
  questions: QuizQuestion[];
  moduleId: ModuleId;
  alreadyDone: boolean;
  onComplete: (score: number) => void;
}

type AnswerState = { selectedIndex: number } | null;

export function Quiz({ questions, moduleId: _moduleId, alreadyDone, onComplete }: QuizProps) {
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState<AnswerState>(null);
  const [scores, setScores] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  if (questions.length === 0) {
    return (
      <Card className="text-center py-12 text-navy-500">
        <p>Quiz questions are being prepared — check back soon.</p>
      </Card>
    );
  }

  const q = questions[current];
  const pct = Math.round((current / questions.length) * 100);
  const isCorrect = answer !== null && answer.selectedIndex === q.correctIndex;
  const totalCorrect = scores.filter(Boolean).length;

  function handleAnswer(idx: number) {
    if (answer !== null) return;
    setAnswer({ selectedIndex: idx });
  }

  function handleNext() {
    const correct = answer?.selectedIndex === q.correctIndex;
    const nextScores = [...scores, correct];

    if (current + 1 >= questions.length) {
      setScores(nextScores);
      setDone(true);
      onComplete(nextScores.filter(Boolean).length);
    } else {
      setScores(nextScores);
      setAnswer(null);
      setCurrent((c) => c + 1);
    }
  }

  function handleRestart() {
    setCurrent(0);
    setAnswer(null);
    setScores([]);
    setDone(false);
  }

  if (done) {
    const n = questions.length;
    const pctScore = Math.round((totalCorrect / n) * 100);
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="text-center py-10">
          <div className="text-5xl font-bold text-navy-900 mb-2">
            {totalCorrect}/{n}
          </div>
          <div className="text-lg text-navy-600 mb-1">{pctScore}% correct</div>
          {!alreadyDone && (
            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full mt-2 mb-4">
              <Zap className="h-3.5 w-3.5" aria-hidden />+{XP_REWARDS.quiz} XP earned
            </div>
          )}
          <p className="text-navy-500 text-sm mb-6">
            {pctScore === 100
              ? "Perfect score! Outstanding work."
              : pctScore >= 60
              ? "Good effort — review the lesson for anything you missed."
              : "Keep at it — re-read the lesson and try again."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={handleRestart}>Try again</Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center gap-3 text-sm text-navy-500">
        <span className="shrink-0">
          {current + 1} / {questions.length}
        </span>
        <ProgressBar value={pct} label={`Question ${current + 1} of ${questions.length}`} className="flex-1" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22 }}
        >
          <Card>
            <p className="font-semibold text-navy-900 text-lg leading-snug mb-5">{q.question}</p>
            <div className="flex flex-col gap-2.5">
              {q.options.map((opt, idx) => {
                let variant: "default" | "correct" | "wrong" | "dimmed" = "default";
                if (answer !== null) {
                  if (idx === q.correctIndex) variant = "correct";
                  else if (idx === answer.selectedIndex) variant = "wrong";
                  else variant = "dimmed";
                }
                return (
                  <AnswerButton
                    key={idx}
                    label={opt}
                    variant={variant}
                    disabled={answer !== null}
                    onClick={() => handleAnswer(idx)}
                  />
                );
              })}
            </div>

            {/* Explanation */}
            {answer !== null && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-5 flex gap-3 rounded-xl p-4 text-sm ${isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
              >
                {isCorrect
                  ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                  : <XCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />}
                <span>{q.explanation}</span>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {answer !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
          <Button onClick={handleNext}>
            {current + 1 >= questions.length ? "See results" : "Next question"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function AnswerButton({
  label,
  variant,
  disabled,
  onClick,
}: {
  label: string;
  variant: "default" | "correct" | "wrong" | "dimmed";
  disabled: boolean;
  onClick: () => void;
}) {
  const cls = {
    default: "border border-navy-200 bg-white text-navy-700 hover:border-emerald-400 hover:bg-emerald-50",
    correct: "border-2 border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold",
    wrong: "border-2 border-red-400 bg-red-50 text-red-800 font-semibold",
    dimmed: "border border-navy-100 bg-navy-50 text-navy-400",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${cls}`}
    >
      {label}
    </button>
  );
}
