"use client";
import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, RotateCcw, ChevronRight } from "lucide-react";

type Answer = "yes" | "no" | null;

const QUESTIONS = [
  { q: "Do you have more than one pension pot?", yesBlocks: false },
  { q: "Does any pension have a guaranteed annuity rate (GAR) or defined-benefit promise?", yesBlocks: true },
  { q: "Are any of your pots still receiving employer contributions?", yesBlocks: true },
  { q: "Are your current providers charging more than 0.75% annual management fee?", yesBlocks: false },
  { q: "Is your total pension value over £10,000?", yesBlocks: false },
];

function getVerdict(answers: Answer[]): { title: string; body: string; colour: string; icon: React.ReactNode } {
  const blockingYes = [1, 2].filter(i => answers[i] === "yes").length;
  const goodSignals = [0, 3, 4].filter(i => answers[i] === "yes").length;
  if (blockingYes > 0) return {
    title: "Proceed with caution — get advice first",
    body: "You have at least one pension that may carry safeguarded benefits or live employer contributions. Consolidating carelessly could cost you significantly. Use the free MoneyHelper service before doing anything.",
    colour: "bg-amber-50 border-amber-300",
    icon: <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />,
  };
  if (goodSignals >= 2) return {
    title: "Consolidation looks like a good move",
    body: "Based on your answers, merging your pots is likely to reduce fees and simplify your finances. Use the step-by-step guide below to get started.",
    colour: "bg-green-50 border-green-300",
    icon: <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />,
  };
  return {
    title: "It depends — worth investigating",
    body: "No clear answer from your responses. The key questions are: what fees are you paying, and are there any guarantees attached? Compare your current charges before deciding.",
    colour: "bg-indigo-50 border-indigo-200",
    icon: <XCircle className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />,
  };
}

export default function ConsolidateQuiz() {
  const [answers, setAnswers] = useState<Answer[]>(Array(QUESTIONS.length).fill(null));
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);

  const answer = (val: Answer) => {
    const next = [...answers];
    next[current] = val;
    setAnswers(next);
    if (current < QUESTIONS.length - 1) {
      setTimeout(() => setCurrent(current + 1), 220);
    } else {
      setTimeout(() => setDone(true), 220);
    }
  };

  const reset = () => { setAnswers(Array(QUESTIONS.length).fill(null)); setCurrent(0); setDone(false); };
  const verdict = done ? getVerdict(answers) : null;
  const progress = ((current + (done ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-12">
      <div className="flex items-start justify-between mb-1">
        <h2 className="font-bold text-xl">Should I consolidate? Quick quiz</h2>
        {(current > 0 || done) && (
          <button onClick={reset} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-4">
        {done ? "Here's your recommendation:" : `Question ${current + 1} of ${QUESTIONS.length}`}
      </p>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div
          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!done ? (
        <div className="flex flex-col gap-4">
          <p className="text-base font-medium text-gray-900">{QUESTIONS[current].q}</p>
          <div className="flex gap-3">
            {(["yes", "no"] as const).map(val => (
              <button
                key={val}
                onClick={() => answer(val)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                  answers[current] === val
                    ? val === "yes"
                      ? "bg-indigo-700 text-white border-indigo-700"
                      : "bg-gray-800 text-white border-gray-800"
                    : "border-gray-200 text-gray-700 hover:border-indigo-400 hover:text-indigo-700"
                }`}
              >
                {val === "yes" ? "Yes" : "No"}
              </button>
            ))}
          </div>
          {current < QUESTIONS.length - 1 && answers[current] && (
            <button
              onClick={() => setCurrent(current + 1)}
              className="flex items-center gap-1 text-sm text-indigo-600 font-medium self-end"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : verdict && (
        <div className={`border rounded-xl p-5 flex gap-4 ${verdict.colour}`}>
          {verdict.icon}
          <div>
            <h3 className="font-bold text-gray-900 mb-1">{verdict.title}</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{verdict.body}</p>
          </div>
        </div>
      )}

      {/* Answered summary dots */}
      <div className="flex gap-1.5 mt-5">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
            i < current || done
              ? answers[i] === "yes" ? "bg-indigo-500" : "bg-gray-400"
              : i === current ? "bg-indigo-300" : "bg-gray-200"
          }`} />
        ))}
      </div>
    </div>
  );
}
