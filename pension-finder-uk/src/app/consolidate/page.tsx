import Link from "next/link";
import { CheckCircle, AlertTriangle, ExternalLink, GitMerge, PoundSterling, Shield, Clock, ChevronRight } from "lucide-react";

const pros = [
  { title: "One set of fees", desc: "Multiple small pots each have their own annual management charge (AMC). Merging them means you pay one lot — often lower overall." },
  { title: "Easier to manage", desc: "One login, one statement, one provider to call. Far simpler than juggling five different app logins." },
  { title: "Better investment choice", desc: "Larger pots often unlock better fund choices and lower cost index funds with a modern provider." },
  { title: "Clearer projections", desc: "Seeing everything in one place makes it much easier to plan and model your retirement income." },
];

const cons = [
  { title: "Check for valuable guarantees first", desc: "Some older pension schemes — especially defined benefit (final salary) pensions — come with guarantees like a guaranteed annuity rate (GAR) that can be worth tens of thousands of pounds. Never transfer out of a DB scheme without regulated financial advice." },
  { title: "Watch the transfer fee", desc: "Some older providers charge an exit fee (usually capped at 1% for pots under £10k by FCA rules). Factor this in before switching." },
  { title: "You may lose employer contributions", desc: "If you're still employed at a company, consolidating that pension away may mean losing employer top-ups. Always check." },
  { title: "Protection limits", desc: "The FSCS protects up to £85,000 per authorised firm. Very large pots may warrant splitting." },
];

const steps = [
  {
    step: 1,
    title: "List all your pensions",
    desc: "Use the Pension Finder and our tracker to get every pot in one view. You need provider names, reference numbers, and current values.",
    cta: { href: "/find", label: "Use the Pension Finder" },
  },
  {
    step: 2,
    title: "Check for safeguarded benefits",
    desc: "Before anything else: does any pension have a guaranteed annuity rate, defined benefit promise, or enhanced protection? If yes — get regulated advice first. The Pension Advisory Service offers free guidance.",
    cta: { href: "https://www.moneyhelper.org.uk/en/pensions-and-retirement/pension-problems/free-and-impartial-help-with-pensions", label: "Free advice — MoneyHelper" },
    external: true,
  },
  {
    step: 3,
    title: "Choose your destination pension",
    desc: "Pick a low-cost modern provider to consolidate into. Look for: annual charge under 0.75%, good fund range, easy-to-use app. Popular options include Vanguard, Pension Bee, Nest, or your current employer's scheme.",
  },
  {
    step: 4,
    title: "Request transfers",
    desc: "Your new provider will usually handle this for you. You fill in a transfer form (often online), and they contact your old providers on your behalf. Most transfers take 4–8 weeks.",
  },
  {
    step: 5,
    title: "Verify and update your tracker",
    desc: "Once the transfer is confirmed, update your pension tracker. Keep a paper trail — save confirmation letters and reference numbers.",
    cta: { href: "/track", label: "Update my pensions" },
  },
];

const providers = [
  { name: "Pension Bee", type: "Personal pension / SIPP", note: "Simple app-based, good for consolidation. Annual fee ~0.5–0.95%.", url: "https://www.pensionbee.com" },
  { name: "Vanguard Personal Pension", type: "SIPP", note: "Very low cost (~0.15% fund + 0.15% platform). Self-directed. Min £100.", url: "https://www.vanguardinvestor.co.uk/what-we-offer/personal-pension" },
  { name: "Nest", type: "Workplace / personal", note: "Government-backed, no minimum, widely accepted for transfers.", url: "https://www.nestpensions.org.uk" },
  { name: "Hargreaves Lansdown", type: "SIPP", note: "Wide fund choice, good tools. Higher charges on smaller pots.", url: "https://www.hl.co.uk/pensions/sipp" },
];

export default function ConsolidatePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
          <GitMerge className="w-4 h-4" /> Consolidation Guide
        </div>
        <h1 className="text-3xl font-bold mb-3">Should you consolidate your pensions?</h1>
        <p className="text-gray-500 text-lg max-w-2xl">
          Most people with multiple jobs have multiple pension pots scattered across different providers. Here&apos;s an honest breakdown of when consolidating makes sense — and when it doesn&apos;t.
        </p>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
        <div>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-700"><CheckCircle className="w-5 h-5" /> Reasons to consolidate</h2>
          <div className="flex flex-col gap-3">
            {pros.map((p) => (
              <div key={p.title} className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-semibold text-green-900 mb-1">{p.title}</h3>
                <p className="text-sm text-green-800">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-amber-700"><AlertTriangle className="w-5 h-5" /> Watch out for</h2>
          <div className="flex flex-col gap-3">
            {cons.map((c) => (
              <div key={c.title} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="font-semibold text-amber-900 mb-1">{c.title}</h3>
                <p className="text-sm text-amber-800">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step by step */}
      <h2 className="text-2xl font-bold mb-6">How to consolidate — step by step</h2>
      <div className="flex flex-col gap-6 mb-14">
        {steps.map((s) => (
          <div key={s.step} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex gap-5">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg shrink-0">
              {s.step}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-3">{s.desc}</p>
              {s.cta && (
                s.external ? (
                  <a href={s.cta.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:underline">
                    {s.cta.label} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link href={s.cta.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:underline">
                    {s.cta.label} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Provider comparison */}
      <h2 className="text-2xl font-bold mb-4">Popular consolidation destinations</h2>
      <p className="text-gray-500 mb-6 text-sm">These are commonly used providers — not a personal recommendation. Compare charges carefully against your pot size.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
        {providers.map((p) => (
          <div key={p.name} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-gray-900">{p.name}</h3>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 shrink-0">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.type}</span>
            <p className="text-sm text-gray-500 mt-2">{p.note}</p>
          </div>
        ))}
      </div>

      {/* Key facts */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="flex gap-3">
          <Clock className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold mb-1">Transfer timeline</h4>
            <p className="text-sm text-gray-500">Most transfers take 4–8 weeks. Some older occupational schemes can take longer.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <PoundSterling className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold mb-1">Exit fees</h4>
            <p className="text-sm text-gray-500">Capped at 1% for pots under £10,000 under FCA rules. Larger pots vary — check with your provider.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Shield className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold mb-1">FSCS protection</h4>
            <p className="text-sm text-gray-500">Up to £85,000 per authorised firm is protected if a pension provider fails.</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-800 mb-1">Not financial advice</h3>
          <p className="text-sm text-amber-700">This guide is for information only. If you have a defined-benefit pension, safeguarded benefits, or a pot over £30,000 you want to transfer, UK law requires you to take regulated financial advice first. Use <a href="https://www.moneyhelper.org.uk" target="_blank" rel="noopener noreferrer" className="underline">MoneyHelper</a> to find free guidance.</p>
        </div>
      </div>
    </div>
  );
}
