import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { PERSONAS } from "../../content/tiers";
import type { Persona } from "../../lib/types";
import type { ProgressUpdaters } from "../../lib/storage";
import { PageContainer } from "../../components/PageContainer";
import { Icon } from "../../components/Icon";

interface PersonaSelectProps {
  updaters: ProgressUpdaters;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function PersonaSelect({ updaters }: PersonaSelectProps) {
  const navigate = useNavigate();

  function choose(persona: Persona) {
    updaters.setPersona(persona);
    updaters.completeOnboarding();
    navigate("/");
  }

  function skip() {
    updaters.completeOnboarding();
    navigate("/");
  }

  return (
    <PageContainer narrow className="py-12">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> Pick your path
        </span>
        <h1 className="mt-4 text-3xl font-bold text-navy-900">What best describes you right now?</h1>
        <p className="mx-auto mt-2 max-w-lg text-navy-500">
          A 20-second choice so we can highlight the modules that matter most to you first. You can
          change it any time — and everything stays in this browser.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-8 grid gap-4 sm:grid-cols-2"
      >
        {PERSONAS.map((p) => (
          <motion.button
            key={p.id}
            variants={item}
            onClick={() => choose(p.id)}
            className="group flex items-start gap-4 rounded-2xl bg-white p-5 text-left shadow-card transition-shadow duration-200 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Icon name={p.icon} className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="flex items-center justify-between">
                <span className="font-semibold text-navy-900">{p.label}</span>
                <ChevronRight className="h-4 w-4 text-navy-300 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
              <span className="mt-0.5 block text-sm leading-relaxed text-navy-500">{p.blurb}</span>
            </span>
          </motion.button>
        ))}
      </motion.div>

      <div className="mt-8 text-center">
        <button onClick={skip} className="rounded-lg px-2 py-1 text-sm font-medium text-navy-500 transition-colors duration-150 ease-out hover:text-navy-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
          Skip for now — show me everything
        </button>
      </div>
    </PageContainer>
  );
}
