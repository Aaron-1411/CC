import Link from "next/link";
import { Search, BarChart2, GitMerge, ShieldCheck, ChevronRight, Users, PoundSterling, Clock, Gift, FileText } from "lucide-react";

const tools = [
  {
    step: "1",
    icon: Search,
    title: "Find Lost Pensions",
    desc: "Enter your employment history and get a personalised action plan showing exactly which schemes to chase and how.",
    href: "/find",
    cta: "Start finding →",
    color: "bg-indigo-50 border-indigo-200",
    iconColor: "text-indigo-600",
  },
  {
    step: "2",
    icon: PoundSterling,
    title: "Track Everything",
    desc: "Add every pot you find. See your total, pension health score, and type breakdown in one dashboard — no account needed.",
    href: "/track",
    cta: "Open tracker →",
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
  },
  {
    step: "3",
    icon: BarChart2,
    title: "Project Your Future",
    desc: "Three sliders. One clear number. See what your retirement income looks like — in today's money, with or without the State Pension.",
    href: "/project",
    cta: "Run projection →",
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    step: "4",
    icon: Gift,
    title: "Tax Relief Calculator",
    desc: "See exactly how much the government is adding to your pot every month — and what salary sacrifice is really worth.",
    href: "/tax-relief",
    cta: "Calculate →",
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
  },
  {
    step: "5",
    icon: FileText,
    title: "NI Gaps Calculator",
    desc: "Buying a missing NI year costs £824 but adds £328/yr to your State Pension forever. See if it's worth it for you in under a minute.",
    href: "/ni-gaps",
    cta: "Check NI gaps →",
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    step: "6",
    icon: GitMerge,
    title: "Consolidate",
    desc: "Not sure whether to merge your pots? Take a 5-question quiz and get a plain-English recommendation, then follow the step-by-step guide.",
    href: "/consolidate",
    cta: "Take the quiz →",
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
  },
];

const stats = [
  { icon: PoundSterling, value: "£31.1bn", label: "lost in unclaimed UK pensions" },
  { icon: Users, value: "2.8M+", label: "pension pots have been lost" },
  { icon: Clock, value: "11 jobs", label: "average person holds in a lifetime" },
];

const faqs = [
  { q: "Is this free?", a: "Yes — every tool is completely free. No subscription, no paywall, no catch." },
  { q: "Is my data safe?", a: "All data you enter stays in your browser. Nothing is sent to our servers." },
  { q: "Can you actually find my pension for me?", a: "We give you a personalised action plan and link directly to the Government's official Pension Tracing Service — the authoritative route to trace any lost scheme." },
  { q: "What if I have a State Pension too?", a: "The projection tool includes your State Pension entitlement alongside private pots so you see the complete picture." },
  { q: "Is this financial advice?", a: "No. Everything here is guidance and illustration only. For advice tailored to your situation, speak to a regulated financial adviser or use the free MoneyHelper service." },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          <span className="inline-block bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-6">
            Free · No account needed · Everything stays in your browser
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-3xl mx-auto">
            Find every pension you&apos;ve ever had
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
            The average UK worker changes jobs 11 times. That&apos;s 11 chances to lose a pension.
            We help you track them all down, see what they&apos;re worth, and bring them together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/find" className="bg-white text-indigo-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
              Find my pensions <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/tax-relief" className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors">
              See my tax relief
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map(s => (
            <div key={s.value} className="flex flex-col items-center">
              <s.icon className="w-8 h-8 text-indigo-400 mb-3" />
              <span className="text-3xl font-bold text-gray-900">{s.value}</span>
              <span className="text-gray-500 mt-1 text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tools grid */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-3">Five tools. One complete picture.</h2>
        <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">Start anywhere — but most people start with the pension finder.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map(t => (
            <Link key={t.href} href={t.href}
              className={`group border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md transition-all ${t.color}`}>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-white text-gray-500 font-bold text-sm flex items-center justify-center shadow-sm">{t.step}</span>
                <t.icon className={`w-5 h-5 ${t.iconColor}`} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">{t.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{t.desc}</p>
              </div>
              <span className={`text-sm font-semibold mt-auto ${t.iconColor}`}>{t.cta}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-indigo-50 border-y border-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <ShieldCheck className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">No sign-up. No selling your data. Ever.</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Everything runs in your browser. We built this because we were frustrated by how hard it is to get a simple, honest picture of your own retirement savings.
          </p>
          <Link href="/find" className="bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-800 transition-colors">
            Start for free →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Common questions</h2>
        <div className="flex flex-col gap-4">
          {faqs.map(f => (
            <div key={f.q} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-2">{f.q}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
