import { Link } from "react-router-dom";
import {
  ArrowRight, Zap, Swords, FileSignature, LineChart, Users,
  Smartphone, ShieldCheck, BookOpen, Scale, CheckCircle2, Lightbulb,
  Target, ListChecks, MessageCircleQuestion, MapPinned,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Tool {
  id: string;
  to: string;
  icon: typeof Zap;
  badge: string;
  title: string;
  oneLiner: string;
  whyItMatters: string;
  steps: string[];
  proTips: string[];
  cta: string;
}

const TOOLS: Tool[] = [
  {
    id: "decide",
    to: "/decide",
    icon: Zap,
    badge: "60-second answer",
    title: "Quick Verdict",
    oneLiner: "Paste a Rightmove link or answer 8 questions — get a green/amber/red answer.",
    whyItMatters: "Most buyers waste weeks on properties that fail the basic affordability or area test. We do that test in under a minute, with real HM Land Registry comps, EPC data, crime stats and transport overlays — not vibes.",
    steps: [
      "Paste a Rightmove or Zoopla URL (or skip and answer manually).",
      "We auto-fill postcode, price, beds, sqft and pull live area data.",
      "Confirm income, deposit, household and your top 3 priorities.",
      "Get a verdict, expected return cone, factor breakdown and confidence meter.",
    ],
    proTips: [
      "The expected return uses a 4,000-path Monte Carlo on real ONS HPI for that exact local authority.",
      "Open the 'Where the numbers come from' panel to see every data source and freshness date.",
      "Hit 'Save snapshot' to track how the same property's verdict changes over time.",
    ],
    cta: "Get a verdict",
  },
  {
    id: "receipt",
    to: "/decide",
    icon: FileSignature,
    badge: "Hard-baked moat",
    title: "Verdict Receipt™",
    oneLiner: "A signed, shareable receipt of your verdict — with every data point and source stamped on.",
    whyItMatters: "When you tell a broker 'this property is fair value', they want proof. The Verdict Receipt is a cryptographically tamper-evident record. Change a single number and the signature breaks. Nobody else issues these.",
    steps: [
      "Run a verdict in /decide.",
      "Click 'Verdict Receipt™' on the result page.",
      "We generate a public URL like /v/abc123 with a SHA-256 signature.",
      "Send the link to your broker, solicitor or family — they see exactly what you saw.",
    ],
    proTips: [
      "Receipts are immutable. Re-run the verdict if data changes — that creates a new receipt.",
      "Print to PDF for a paper trail your conveyancer can attach to your file.",
      "Attach a receipt when inviting your broker (see 'Broker on your terms').",
    ],
    cta: "Try it",
  },
  {
    id: "beat-the-agent",
    to: "/beat-the-agent",
    icon: Swords,
    badge: "AI on your side",
    title: "Beat the Agent",
    oneLiner: "Paste any listing. We give you the 12 questions the estate agent doesn't want asked.",
    whyItMatters: "Estate agents work for the seller. Their job is to get the highest price with the least information disclosed. This tool flips that — adversarial AI that probes pricing, chain, condition, lease and legal traps.",
    steps: [
      "Paste a Rightmove/Zoopla URL or copy the listing description.",
      "Add the asking price (optional — sharpens the negotiation questions).",
      "We use Gemini 1.5 Flash + a buyer's-side checklist to generate 12 questions.",
      "Copy them all to your phone before the viewing. Tick them off as you go.",
    ],
    proTips: [
      "Always ask 'how long's it actually been on the market, including any prior listing or withdrawal'.",
      "Print the list and hand it to the agent — most won't have answers, which itself tells you a lot.",
      "If the AI is rate-limited you still get the 12-question starter checklist.",
    ],
    cta: "Generate questions",
  },
  {
    id: "viewing-mode",
    to: "/viewing-mode",
    icon: Smartphone,
    badge: "Works offline",
    title: "Saturday Viewing Mode",
    oneLiner: "A PWA built for the viewing — photos, voice transcription, the 40-point checklist, all offline.",
    whyItMatters: "Mobile signal in a 1930s semi is terrible. You forget half what you saw the moment you leave. This tool captures everything in 60 seconds per room and syncs when you're back on signal.",
    steps: [
      "Open /viewing-mode before you arrive.",
      "Type the address; tap the camera button — photos auto-attach.",
      "Tap 'Record' — live British-English voice transcription as you walk.",
      "Tick the 40 checks (sound, damp, sockets, drains, smells…).",
      "Save. Repeat for every viewing. Compare side-by-side later.",
    ],
    proTips: [
      "Voice transcription works best in Chrome on Android — switch off mid-stream and notes save automatically.",
      "Take a photo of the EPC certificate on the day — useful evidence if claimed bills don't match.",
      "Walk the route from station to door after dark before you offer — it's check #30 for a reason.",
    ],
    cta: "Open viewing mode",
  },
  {
    id: "outcomes",
    to: "/outcomes",
    icon: LineChart,
    badge: "Live accuracy",
    title: "Outcome Tracking",
    oneLiner: "Tell us what happened post-completion. We publish the error bars live.",
    whyItMatters: "Every UK proptech publishes valuations with no accountability. We're the only ones brave enough to publish ours next to what users actually paid — and update the headline number weekly.",
    steps: [
      "After completion, log: predicted price, actual price paid, satisfaction.",
      "Add notes on what surprised you (regrets, hidden costs, agent tactics).",
      "Your data feeds the public methodology page — anonymised.",
      "We publish the live mean error and 'within ±5%' rate.",
    ],
    proTips: [
      "Even a 6-month outcome helps — you don't have to wait years.",
      "Post-completion regrets are the single most useful signal for the next cohort.",
      "All entries are RLS-protected — only your aggregated stats hit the public page.",
    ],
    cta: "Log an outcome",
  },
  {
    id: "broker",
    to: "/broker",
    icon: ShieldCheck,
    badge: "You pick the broker",
    title: "Broker on Your Terms",
    oneLiner: "Invite YOUR broker into the app with a one-time link. Never an agent kickback.",
    whyItMatters: "Estate agents push their in-house broker because they get paid £400+ per referral. Whether your broker is independent matters more than any rate. Bring your own — and share your full Verdict Receipt.",
    steps: [
      "Go to /broker — generate an invite code.",
      "Optionally attach a Verdict Receipt and a personal message.",
      "Share the link (e.g. 'broker/AX72PQ9') with your broker.",
      "When they open it, the invite is marked accepted — you can see it.",
    ],
    proTips: [
      "Use this for solicitors and surveyors too — same one-time link pattern.",
      "Revoke any invite from the list at any time.",
      "We never sell your details and we never accept estate-agent referral fees. See our pledge in /broker.",
    ],
    cta: "Invite a broker",
  },
  {
    id: "co-buyer",
    to: "/co-buyer",
    icon: Users,
    badge: "Buy with someone",
    title: "Co-buyer Mode",
    oneLiner: "Real-time shared scenarios, split-deposit math, and a deed-of-trust generator for unequal shares.",
    whyItMatters: "75% of FTB purchases involve two people — and most relationship strain in the process is about who paid what. We solve the maths and produce the legal scaffolding.",
    steps: [
      "Open /co-buyer with your partner.",
      "Enter both deposits, both incomes, both must-haves.",
      "We auto-merge into a joint right-fit score.",
      "Generate a draft Deed of Trust for your solicitor when shares are unequal.",
    ],
    proTips: [
      "Argue about the must-haves before you start viewing — saves marriages.",
      "The deed-of-trust draft is a starting point for your solicitor, not a substitute.",
    ],
    cta: "Open co-buyer mode",
  },
  {
    id: "methodology",
    to: "/methodology",
    icon: BookOpen,
    badge: "Open methodology",
    title: "Open Methodology",
    oneLiner: "Every score's weights, sources and freshness — public and auditable.",
    whyItMatters: "Zoopla can't publish their AVM weights — they're a trade secret. We can, because we don't sell leads to estate agents. Press, academics and Which? can audit our maths line-by-line.",
    steps: [
      "Read the live accuracy panel (mean price error, sample size).",
      "Click any factor to see its weight, formula and data source.",
      "Cross-check with the citations panel on every page.",
    ],
    proTips: [
      "Use this page in your offer letter: 'Per the published methodology, fair value here is £X with ±5% confidence.'",
      "Subscribe via /alerts for a notification when methodology changes (we version every release).",
    ],
    cta: "Read methodology",
  },
];

const PRINCIPLES = [
  { icon: Scale, title: "Paid by you, not the agent.", body: "We never take referral money from estate agents. Our incentive is your outcome, not their commission." },
  { icon: Target, title: "Real data, never vibes.", body: "HM Land Registry, ONS HPI, BoE base rate, EPC Open Data, police.uk, OSM transport. All live, all dated." },
  { icon: ShieldCheck, title: "Tamper-evident.", body: "Every Verdict Receipt is signed. Change a number, the signature breaks. Your broker can verify in one click." },
  { icon: BookOpen, title: "Open methodology.", body: "Weights, formulas and data sources public. We publish our error bars live. No black box." },
];

export default function HowItWorks() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-12">
      <header className="text-center space-y-4">
        <Badge className="bg-brand-muted text-brand border-0">
          <Lightbulb className="w-3 h-3 mr-1.5" /> 5-minute tour
        </Badge>
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-brand leading-tight">
          How it works.
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Eight focused tools that surface the data the other side already has access to.
          Each one is independent — start anywhere, but the Verdict ties them together.
        </p>
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
            <Link to="/decide"><Zap className="w-4 h-4 mr-1.5" /> Start with a verdict <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#tools">Browse all tools</a>
          </Button>
        </div>
      </header>

      {/* Principles strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PRINCIPLES.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="p-4 bg-brand-muted/30 border-brand/20">
            <Icon className="h-5 w-5 text-brand mb-2" />
            <p className="font-serif font-bold text-brand text-sm mb-1">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
          </Card>
        ))}
      </section>

      {/* Suggested first run */}
      <section>
        <Card className="p-6 md:p-8 bg-gradient-warm border-brand/20">
          <Badge className="bg-brand text-brand-foreground border-0 mb-3"><ListChecks className="w-3 h-3 mr-1.5" /> Suggested first run</Badge>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-brand mb-4">A suggested first session.</h2>
          <ol className="space-y-3 text-sm md:text-base">
            {[
              { t: "Run a Verdict on a property you're already eyeing.", l: "/decide", n: "1" },
              { t: "Click 'Verdict Receipt™' and copy the link.", l: "/decide", n: "2" },
              { t: "Paste the same listing into Beat the Agent — print the 12 questions.", l: "/beat-the-agent", n: "3" },
              { t: "Set up Viewing Mode on your phone before Saturday.", l: "/viewing-mode", n: "4" },
              { t: "Send your Receipt to your broker via /broker.", l: "/broker", n: "5" },
            ].map(({ t, l, n }) => (
              <li key={n} className="flex items-start gap-3">
                <span className="h-7 w-7 rounded-full bg-brand text-brand-foreground font-mono font-bold text-sm flex items-center justify-center shrink-0">{n}</span>
                <Link to={l} className="hover:underline text-foreground hover:text-brand">{t}</Link>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {/* Tool deep-dives */}
      <section id="tools" className="space-y-3">
        <div className="text-center mb-6">
          <span className="text-[11px] uppercase tracking-[0.2em] text-brand font-semibold">Every tool, in depth</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand mt-2">The eight tools.</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <AccordionItem key={tool.id} value={tool.id} className="border rounded-lg bg-card data-[state=open]:shadow-card">
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <div className="flex items-center gap-4 text-left flex-1 min-w-0 pr-2">
                    <div className="h-11 w-11 rounded-xl bg-brand-muted text-brand flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif font-bold text-brand text-lg truncate">{tool.title}</h3>
                        <Badge variant="outline" className="text-[10px]">{tool.badge}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{tool.oneLiner}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="grid md:grid-cols-2 gap-6 pt-2">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Why it matters</p>
                      <p className="text-sm text-foreground leading-relaxed">{tool.whyItMatters}</p>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mt-5 mb-2">How to use it</p>
                      <ol className="space-y-2">
                        {tool.steps.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-sm">
                            <span className="text-brand font-mono text-xs mt-0.5">{i + 1}.</span>
                            <span className="leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Pro tips</p>
                      <ul className="space-y-2">
                        {tool.proTips.map((tip, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <Lightbulb className="h-3.5 w-3.5 text-brand shrink-0 mt-1" />
                            <span className="leading-relaxed text-muted-foreground">{tip}</span>
                          </li>
                        ))}
                      </ul>
                      <Button asChild className="mt-5 bg-brand text-brand-foreground hover:bg-brand/90">
                        <Link to={tool.to}>{tool.cta} <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>

      {/* FAQ */}
      <section className="space-y-3">
        <div className="text-center mb-4">
          <span className="text-[11px] uppercase tracking-[0.2em] text-brand font-semibold">Common questions</span>
          <h2 className="font-serif text-3xl font-bold text-brand mt-2">Common questions.</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {[
            { q: "Is this financial advice?", a: "No. Everything you see is information and modelling, not regulated advice. Your broker, solicitor and surveyor are the regulated voices — we just give you the data to brief them properly." },
            { q: "How is this free?", a: "The core verdict and tools are free. We may offer paid solicitor/surveyor fixed-fee marketplaces in future, but we will never accept money from estate agents. That's the whole point." },
            { q: "Where does the data come from?", a: "HM Land Registry Price Paid Data, ONS House Price Index, Bank of England base rate, EPC Open Data, data.police.uk and OpenStreetMap. Every page lists its sources with freshness dates." },
            { q: "What makes the Verdict Receipt 'tamper-evident'?", a: "We hash the entire verdict payload with SHA-256 at issue time and store the hash with the row. Any change to the data — by us or anyone — produces a different hash, so the original is verifiable." },
            { q: "Will my data be sold?", a: "No. We don't sell user data and we don't pass details to estate agents. Outcome data is anonymised before it appears on the public methodology page." },
            { q: "Does it work outside the UK?", a: "Not yet. The whole stack is tuned for England, Wales and Scotland — including SDLT/LBTT/LTT, Land Registry, ONS HPI and EPC Open Data." },
          ].map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg bg-card px-4">
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-3.5">
                <span className="flex items-center gap-2"><MessageCircleQuestion className="h-4 w-4 text-brand shrink-0" /> {f.q}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-3.5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="text-center py-8">
        <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-brand mb-2">Try it on a real listing.</h2>
        <p className="text-muted-foreground mb-5 max-w-md mx-auto">Paste any UK property URL. The verdict, sources and confidence intervals come back in under a minute.</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
            <Link to="/decide"><Zap className="w-4 h-4 mr-1.5" /> Run a verdict <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/areas"><MapPinned className="w-4 h-4 mr-1.5" /> Explore by area</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
