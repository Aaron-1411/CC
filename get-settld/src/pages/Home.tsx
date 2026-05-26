import { Link } from "react-router-dom";
import {
  ArrowRight, Check, RotateCcw, Sparkles, Compass,
  ShieldCheck, FileSignature, Swords, LineChart,
  Calculator, MapPin, Home as HomeIcon,
  Users, RefreshCw, BookOpen, Scale, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import heroImg from "@/assets/hero-home.jpg";
import {
  phases, phaseProgress, suggestedNextPhase, nextStepInPhase, resetProgress,
} from "@/lib/journey";
import { useJourneyProgress } from "@/hooks/use-journey-progress";
import { PILLARS } from "@/lib/pillars";
import IntroRouter from "@/components/IntroRouter";
import DataSourcesPanel from "@/components/DataSourcesPanel";

export default function Home() {
  const { done } = useJourneyProgress();
  const totalRequired = phases.reduce(
    (n, p) => n + p.steps.filter((s) => !s.optional).length,
    0
  );
  const completedRequired = phases.reduce(
    (n, p) => n + p.steps.filter((s) => !s.optional && done.includes(s.id)).length,
    0
  );
  const overallPct = totalRequired === 0 ? 0 : Math.round((completedRequired / totalRequired) * 100);
  const hasStarted = done.length > 0;
  const suggested = suggestedNextPhase(done);
  const suggestedNext = nextStepInPhase(suggested, done);

  return (
    <div>

      {/* ── HERO — dark navy ── */}
      <section className="bg-brand border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">

          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/40 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Free · independent · made for first-time buyers
            </div>

            <h1 className="font-serif text-4xl md:text-[3.5rem] text-white leading-[1.04] tracking-tight">
              Buy your first home.<br />
              <span className="text-white/55 italic">Without the guesswork.</span>
            </h1>

            <p className="mt-6 text-base text-white/55 max-w-md leading-relaxed">
              Built entirely for first-time buyers in England. Three questions, answered with real data —
              so you can decide with confidence, not anxiety.
            </p>

            <div className="mt-6 space-y-2.5">
              {[
                "Can I actually afford this?",
                "Is this area right for me?",
                "Should I make an offer on this one?",
              ].map((q) => (
                <div key={q} className="flex items-center gap-2.5 text-sm text-white/65">
                  <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  {q}
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-primary text-white hover:bg-primary/90 shadow-glow"
              >
                <Link to="/decide">
                  Check a property
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/15 text-white/80 hover:bg-white/8 hover:text-white bg-transparent"
              >
                <Link to="/calculator">Calculate affordability</Link>
              </Button>
              {hasStarted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { if (confirm("Reset your journey progress?")) resetProgress(); }}
                  className="text-white/30 hover:text-white/60"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset progress
                </Button>
              )}
            </div>

            <p className="mt-3 text-xs text-white/25 font-mono">
              ~60 seconds · no sign-up · no card required
            </p>

            {hasStarted && (
              <div className="mt-8 max-w-sm">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/30 mb-2">
                  <span>Your journey</span>
                  <span className="font-mono">{completedRequired}/{totalRequired} steps</span>
                </div>
                <Progress value={overallPct} className="h-1 bg-white/10" />
              </div>
            )}
          </div>

          {/* Right — property image */}
          <div className="relative overflow-hidden border border-white/10 aspect-[4/5]">
            <img
              src={heroImg}
              alt="A charming British terraced home with brick facade and bay windows"
              width={1280}
              height={960}
              className="w-full h-full object-cover opacity-90"
            />
            {suggestedNext && (
              <div className="absolute bottom-0 left-0 right-0 bg-card/96 backdrop-blur-sm p-4 border-t border-border/60">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Next · Phase {suggested.number} · {suggested.title}
                </p>
                <p className="font-serif text-base font-bold text-brand mt-1">{suggestedNext.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{suggestedNext.blurb}</p>
                <Link
                  to={suggestedNext.to}
                  className="inline-flex items-center text-xs font-semibold text-primary mt-2 hover:underline"
                >
                  Open tool <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── THREE QUESTIONS ── */}
      <section className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-18">
          <div className="mb-10">
            <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold font-mono">
              What this answers
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-brand mt-2">
              Three questions every first-time buyer needs answered.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border border-border">
            {[
              {
                num: "01",
                icon: Calculator,
                question: "Can I afford it?",
                body: "Stamp duty, solicitor fees, surveys, moving costs — the full picture beyond the headline price. Plus mortgage scenarios and deposit tracking.",
                to: "/calculator",
                cta: "Run the numbers",
              },
              {
                num: "02",
                icon: MapPin,
                question: "Is this area right for me?",
                body: "Price trends, schools, transport links, crime rates and commute times — area intelligence most property portals bury or don't show at all.",
                to: "/areas",
                cta: "Explore an area",
              },
              {
                num: "03",
                icon: HomeIcon,
                question: "Should I buy this one?",
                body: "AVM valuation, lease risk, flood and subsidence data, comparable sales, and 12 sharp questions to ask the estate agent.",
                to: "/decide",
                cta: "Check a property",
              },
            ].map(({ num, icon: Icon, question, body, to, cta }) => (
              <Link
                key={num}
                to={to}
                className="group flex flex-col p-8 hover:bg-brand-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-5">
                  <span className="text-[11px] font-mono text-muted-foreground">{num}</span>
                  <div className="h-9 w-9 flex items-center justify-center bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="font-serif text-2xl text-brand mb-3">{question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">{body}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE BUILT ── */}
      <section className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-18">
          <div className="max-w-2xl mb-10">
            <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold font-mono">
              What you get
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-brand mt-2">
              Tools the property portals won't build.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Their customer is the estate agent. Ours is you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {[
              {
                icon: FileSignature,
                title: "A signed verdict",
                body: "A timestamped receipt of the answer, the data and the date — for you or your solicitor.",
                to: "/decide",
              },
              {
                icon: Swords,
                title: "Questions to ask the agent",
                body: "12 sharp questions about price, chain, condition and lease — generated for any listing.",
                to: "/beat-the-agent",
              },
              {
                icon: Smartphone,
                title: "Viewing mode",
                body: "40-point checklist, photos and voice notes. Works offline at the property.",
                to: "/viewing-mode",
              },
              {
                icon: LineChart,
                title: "Open track record",
                body: "Our valuations vs. real sale prices, published openly with sample sizes and methodology.",
                to: "/methodology",
              },
            ].map(({ icon: Icon, title, body, to }) => (
              <Link key={title} to={to} className="group bg-card p-6 hover:bg-brand-muted/40 transition-colors">
                <div className="h-9 w-9 flex items-center justify-center bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors mb-4">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-brand text-lg mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {[
              { icon: RefreshCw, label: "Remortgage comparator", to: "/remortgage" },
              { icon: Users, label: "Co-buyer scenarios", to: "/co-buyer" },
              { icon: ShieldCheck, label: "Bring your own broker", to: "/broker" },
              { icon: BookOpen, label: "Open methodology", to: "/methodology" },
              { icon: Scale, label: "Contribute an outcome", to: "/outcomes" },
            ].map(({ icon: Icon, label, to }) => (
              <Link key={label} to={to} className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                <Icon className="h-3.5 w-3.5" /> {label}
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-primary text-white hover:bg-primary/90 shadow-glow"
            >
              <Link to="/decide">
                Check a property
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
            <Link
              to="/how-it-works"
              className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
            >
              See every tool →
            </Link>
          </div>
        </div>
      </section>

      {/* ── DATA SOURCES ── */}
      <section className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <DataSourcesPanel />
        </div>
      </section>

      {/* ── THREE-QUESTION INTRO ROUTER ── */}
      <IntroRouter />

      {/* ── ALL TOOLS / GUIDED JOURNEY TABS ── */}
      <section id="journey" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        <Tabs defaultValue="toolbox" className="w-full">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold font-mono">
                Pick a tool, get an answer
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-brand mt-2">
                Every calculator and check, in one place.
              </h2>
            </div>
            <TabsList className="bg-secondary self-start md:self-auto">
              <TabsTrigger
                value="toolbox"
                className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
              >
                <Sparkles className="w-4 h-4 mr-1.5" /> All tools
              </TabsTrigger>
              <TabsTrigger
                value="journey"
                className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
              >
                <Compass className="w-4 h-4 mr-1.5" /> Guided journey
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Guided mode */}
          <TabsContent value="journey" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
              {phases.map((phase) => {
                const stats = phaseProgress(phase, done);
                const next = nextStepInPhase(phase, done);
                const isComplete = stats.completed === stats.total && stats.total > 0;
                const isCurrent = !isComplete && stats.completed > 0;
                return (
                  <Link key={phase.id} to={`/start/${phase.id}`} className="group bg-card">
                    <div
                      className={`h-full p-7 transition-colors ${
                        isCurrent
                          ? "bg-brand-muted/50"
                          : "hover:bg-brand-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-11 w-11 flex items-center justify-center font-mono font-bold text-lg ${
                              isComplete
                                ? "bg-success text-success-foreground"
                                : "bg-brand text-brand-foreground"
                            }`}
                          >
                            {isComplete ? <Check className="w-5 h-5" /> : phase.number}
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Phase {phase.number} · {phase.estimate}
                            </p>
                            <h3 className="font-serif text-xl text-brand">{phase.title}</h3>
                          </div>
                        </div>
                        {isCurrent && (
                          <Badge className="bg-brand text-brand-foreground border-0 text-[10px]">In progress</Badge>
                        )}
                        {isComplete && (
                          <Badge className="bg-success text-success-foreground border-0 text-[10px]">Complete</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{phase.description}</p>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                          <span>{stats.completed} of {stats.total} steps</span>
                          <span className="font-mono">{stats.pct}%</span>
                        </div>
                        <Progress value={stats.pct} className="h-1" />
                      </div>

                      {next && !isComplete ? (
                        <div className="flex items-center justify-between pt-3 border-t border-border/60">
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Next step</p>
                            <p className="text-sm font-semibold text-brand truncate">{next.title}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-brand shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      ) : (
                        <div className="flex items-center text-sm font-semibold text-brand pt-3 border-t border-border/60">
                          Open phase <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              {[
                { label: "Start anywhere.", detail: "Already have a deposit? Skip straight to Search." },
                { label: "No lock-in.", detail: "Tick steps off as you go — or ignore the order entirely." },
                { label: "Same tools.", detail: "The journey just brings the right one to the front." },
              ].map(({ label, detail }) => (
                <div key={label} className="flex gap-3">
                  <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span><strong className="text-foreground">{label}</strong> {detail}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Toolbox mode */}
          <TabsContent value="toolbox" className="mt-0">
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
              Six surfaces cover the whole buying journey. Open one and you'll see the deeper tools inside.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
              {PILLARS.map((p) => (
                <Link key={p.id} to={p.to} className="group bg-card hover:bg-brand-muted/40 transition-colors">
                  <div className="h-full p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className="h-9 w-9 flex items-center justify-center bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                        <p.icon className="h-4 w-4" />
                      </div>
                      {p.id === "verdict" && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[10px]">
                          Start here
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-lg text-brand mb-2">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.tagline}</p>
                    {p.more.length > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Includes {p.more.map((m) => m.title).join(" · ")}
                      </p>
                    )}
                    <div className="mt-5 flex items-center text-sm font-semibold text-primary">
                      Open <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <footer className="py-10 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} Get Settld · The free First-Time Buyer Toolkit · Free &amp; independent
      </footer>
    </div>
  );
}
