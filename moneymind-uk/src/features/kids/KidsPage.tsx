import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { kidBands, type KidBand, type KidTopic } from "../../content/kids";
import { PageContainer } from "../../components/PageContainer";
import { Icon } from "../../components/Icon";
import { Reveal } from "../../components/Reveal";
import { Markdown } from "../../components/Markdown";
import { KidWidgetView } from "./widgets";

export function KidsPage() {
  const [bandId, setBandId] = useState(kidBands[0].id);
  const band = kidBands.find((b) => b.id === bandId) ?? kidBands[0];

  return (
    <PageContainer className="py-10">
      {/* Hero */}
      <Reveal>
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
          <Sparkles className="h-4 w-4" aria-hidden /> MoneyMind Kids
        </div>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">
          Money, made simple — for ages 5 to 16
        </h1>
        <p className="mt-3 max-w-2xl text-navy-600">
          The money things children should pick up at school, one small idea at a time. Pick an age,
          read a little, and <span className="font-semibold text-navy-900">tap and play</span> with each idea.
          No accounts, no jargon, nothing scary.
        </p>
      </Reveal>

      {/* Age-band picker */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kidBands.map((b, i) => (
          <Reveal key={b.id} delay={Math.min(i, 3) * 0.05} className="h-full">
            <BandCard band={b} active={b.id === band.id} onClick={() => setBandId(b.id)} />
          </Reveal>
        ))}
      </div>

      {/* Selected band */}
      <AnimatePresence mode="wait">
        <motion.section
          key={band.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="mt-10"
          aria-label={`${band.ageLabel}: ${band.name}`}
        >
          <div className="mb-5 flex flex-wrap items-baseline gap-3">
            <h2 className="text-2xl font-bold text-navy-900">{band.name}</h2>
            <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-bold", band.theme.chipBg, band.theme.chipText)}>
              {band.ageLabel} · {band.keyStage}
            </span>
          </div>
          <p className="mb-6 max-w-2xl text-navy-600">{band.tagline}</p>

          <div className="flex flex-col gap-5">
            {band.topics.map((t, i) => (
              <Reveal key={t.id} delay={Math.min(i, 4) * 0.04}>
                <TopicCard topic={t} band={band} index={i} />
              </Reveal>
            ))}
          </div>
        </motion.section>
      </AnimatePresence>

      <Reveal>
        <p className="mt-10 rounded-2xl border border-navy-100 bg-white p-5 text-center text-sm text-navy-500 shadow-card">
          Grown-ups: this is general money education, not financial advice. Looking for the adult course?{" "}
          <a href="/" className="font-semibold text-emerald-700 hover:underline">Head to the dashboard.</a>
        </p>
      </Reveal>
    </PageContainer>
  );
}

function BandCard({ band, active, onClick }: { band: KidBand; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "group flex h-full w-full flex-col items-start gap-2 rounded-2xl border-2 bg-white p-4 text-left shadow-card transition-[box-shadow,border-color,transform] duration-150 ease-out hover:shadow-card-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        active ? clsx("ring-2", band.theme.ring, "border-transparent") : "border-transparent hover:border-navy-100",
      )}
    >
      <span className={clsx("grid h-10 w-10 place-items-center rounded-xl", band.theme.softBg, band.theme.accentText)}>
        <Icon name={band.icon} className="h-5 w-5" />
      </span>
      <span className={clsx("rounded-full px-2 py-0.5 text-[0.7rem] font-bold", band.theme.chipBg, band.theme.chipText)}>
        {band.ageLabel}
      </span>
      <span className="font-bold leading-snug text-navy-900">{band.name}</span>
    </button>
  );
}

function TopicCard({ topic, band, index }: { topic: KidTopic; band: KidBand; index: number }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-start gap-3">
          <span className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-xl", band.theme.softBg, band.theme.accentText)}>
            <Icon name={topic.icon} className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className={clsx("text-xs font-bold tabular-nums", band.theme.accentText)}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-bold leading-snug text-navy-900">{topic.title}</h3>
            </div>
            <p className="text-sm text-navy-500">{topic.intro}</p>
          </div>
        </div>

        <Markdown>{topic.explain}</Markdown>

        {topic.why && topic.whyTitle && <WhyReveal title={topic.whyTitle} body={topic.why} />}

        {topic.widget && <KidWidgetView kind={topic.widget} accentText={band.theme.accentText} />}

        {/* Remember strip */}
        <div className={clsx("flex items-start gap-2 rounded-xl px-4 py-3", band.theme.softBg)}>
          <span className={clsx("mt-0.5 text-xs font-bold uppercase tracking-wider", band.theme.accentText)}>
            Remember
          </span>
          <p className="text-sm font-semibold text-navy-800">{topic.remember}</p>
        </div>
      </div>
    </div>
  );
}

function WhyReveal({ title, body }: { title: string; body: string }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-navy-100">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-navy-700 transition-colors duration-150 ease-out hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        {title}
        <ChevronDown className={clsx("h-4 w-4 shrink-0 text-navy-400 transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-3 text-sm leading-relaxed text-navy-600">{body}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
