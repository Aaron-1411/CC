"use client";
import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, RotateCcw } from "lucide-react";

type Answer = "yes" | "no" | null;

const QUESTIONS = [
  { q: "Do you have more than one pension pot?", yesIsGood: true },
  { q: "Does any of your pensions have a guaranteed annuity rate (GAR) or defined-benefit promise?", yesIsGood: false },
  { q: "Are any of your pots still receiving employer contributions?", yesIsGood: false },
  { q: "Are your current providers charging more than 0.75% annual management fee?", yesIsGood: true },
  { q: "Is your total pension value over £10,000?", yesIsGood: true },
];

function getVerdict(answers: Answer[]): { title: string; body: string; colour: string; icon: React.ReactNode } {
  const blockingYes = [1, 2].filter(i => answers[i] === "yes").length;
  const goodSignals = [0, 3, 4].filter(i => answers[i] === "yes").length;

  if (blockingYes > 0) {
    return {
      title: "Proceed with caution — get advice first",
      body: "You have at least one pension that may carry safeguarded benefits or ongoing employer contributions. Consolidating carelessly could cost you significantly. Speak to a regulated adviser or use the free MoneyHelper service before doing anything.",
      colour: "bg-amber-50 border-amber-300",
      icon: <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />,
    };
  }
  if (goodSignals >= 2) {
    return {
      title: "Consolidation looks like a good move",
      body: "Based on your answers, consolidating your pots is likely to reduce fees, simplify your finances, and give you a clearer picture of your retirement savings. Use our step-by-step guide below to get started.",
      colour: "bg-green-50 border-green-300",
      icon: <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />,
    };
  }
  return {
    title: "It depends — worth investigating",
    body: "There's no clear-cut answer based on your responses. The key questions are: what fees are you paying, and are there any guarantees attached? Use the guide below and compare your current charges before deciding.",
    colour: "bg-indigo-50 border-indigo-200",
    icon: <XCircle className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />,
  };
}

export default function ConsolidateQuiz() {
  const [answers, setAnswers] = useState<Answer[]>(Array(QUESTIONS.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every(a => a !== null);
  const verdict = submitted ? getVerdict(answers) : null;

  function reset() {
    setAnswers(Array(QUESTIONS.length).fill(null));
    setSubmitted(false);
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-12">
      <h2 className="font-bold text-xl mb-1">Should I consolidate? Quick quiz</h2>
      <p className="text-gray-500 text-sm mb-6">Answer 5 questions to get a personalised recommendation.</p>

      <div className="flex flex-col gap-5">
        {QUESTIONS.map((item, i) => (
          <div key={i} className={`rounded-xl border p-4 transition-colors ${answers[i] ? "border-indigo-200 bg-indigo-50/50" : "border-gray-200"}`}>
            <p className="text-sm font-medium text-gray-800 mb-3">{i + 1}. {item.q}</p>
            <div className="flex gap-3">
              {(["yes", "no"] as const).map(val => (
                <button
                  key={val}
                  onClick={() => {
                    const next = [...answers];
                    next[i] = val;
                    setAnswers(next);
                    setSubmitted(false);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                    answers[i] === val
                      ? val === "yes" ? "bg-indigo-700 text-white border-indigo-700" : "bg-gray-700 text-white border-gray-700"
                      : "border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-700"
                  }`}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
          className="bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Get my recommendation
        </button>
        {submitted && (
          <button onClick={reset} className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        )}
      </div>

      {verdict && (
        <div className={`mt-6 border rounded-xl p-5 flex gap-4 ${verdict.colour}`}>
          {verdict.icon}
          <div>
            <h3 className="font-bold text-gray-900 mb-1">{verdict.title}</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{verdict.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
