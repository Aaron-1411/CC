import Link from "next/link";
import { Search, BarChart2, GitMerge, ShieldCheck, ChevronRight, Users, PoundSterling, Clock } from "lucide-react";

const steps = [
  { icon: Search, title: "Find Lost Pots", desc: "Tell us where you've worked and we'll show you exactly how to track down any pension schemes you may have lost touch with." },
  { icon: BarChart2, title: "See the Numbers", desc: "Get plain-English projections — no jargon. We'll show you what each pot could be worth at retirement based on real assumptions." },
  { icon: GitMerge, title: "Consolidate & Simplify", desc: "Guided step-by-step help to move scattered pensions into one place so you stop paying multiple sets of fees." },
];

const stats = [
  { icon: PoundSterling, value: "£31.1bn", label: "lost in unclaimed UK pensions" },
  { icon: Users, value: "2.8M+", label: "pension pots that have been lost" },
  { icon: Clock, value: "11 jobs", label: "average person holds in a lifetime" },
];

const faqs = [
  { q: "Is this free?", a: "Yes. The core tools — pension finder, tracker, and projections — are completely free to use." },
  { q: "Is my data safe?", a: "All data you enter stays in your browser. We don't store personal details on our servers." },
  { q: "Can you actually find my pension for me?", a: "We give you a personalised action plan and link you directly to the UK Government's Pension Tracing Service, which is the official route to trace any lost scheme." },
  { q: "What if I have a state pension too?", a: "Our projection tool includes your State Pension entitlement alongside workplace and personal pots so you see the full picture." },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          <span className="inline-block bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-6">
            Free · No account needed · Takes 5 minutes
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-3xl mx-auto">
            Find every pension you've ever had
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
            The average UK worker changes jobs 11 times. That's 11 chances to lose a pension. We help you track them all down, see what they're worth, and bring them together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/find"
              className="bg-white text-indigo-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
            >
              Find my pensions <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/project"
              className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
            >
              Run a projection
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.value} className="flex flex-col items-center">
              <s.icon className="w-8 h-8 text-indigo-500 mb-3" />
              <span className="text-3xl font-bold text-gray-900">{s.value}</span>
              <span className="text-gray-500 mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
        <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">Three steps. No jargon. No financial adviser needed.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg">{i + 1}</span>
                <s.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-indigo-50 border-y border-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <ShieldCheck className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">No sign-up. No selling your data. Ever.</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            We built this because we were frustrated by how hard it is to get a simple picture of your own retirement savings. Everything runs in your browser.
          </p>
          <Link href="/find" className="bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-800 transition-colors">
            Start for free →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Common questions</h2>
        <div className="flex flex-col gap-6">
          {faqs.map((f) => (
            <div key={f.q} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-2">{f.q}</h3>
              <p className="text-gray-500">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
