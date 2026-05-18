import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Compass, Check, RotateCcw, Zap,
  ShieldCheck, FileSignature, Swords, LineChart, Users, Smartphone, Scale, BookOpen, RefreshCw,
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
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-warm" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <Badge className="bg-brand-muted text-primary hover:bg-brand-muted border-0 mb-5 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2 animate-pulse" />
              Free · independent · made for first-time buyers
            </Badge>
            <h1 className="font-serif text-4xl md:text-6xl text-brand leading-[1.02] tracking-tight">
              Get on the ladder,<br />without the <span className="italic text-primary">guesswork</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Built for first-time buyers. Three plain-English answers: <strong>can I afford it?</strong>,
              <strong> is the area right?</strong>, and <strong>should I buy this one?</strong> — with the data to back each one up.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 items-center">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
                <Link to="/decide">
                  Check a property
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border hover:bg-muted">
                <Link to="/calculator">
                  See the true cost
                </Link>
              </Button>
              {hasStarted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { if (confirm("Reset your journey progress?")) resetProgress(); }}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset progress
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground font-mono">
              ~60 seconds · no sign-up · no card
            </p>

            {/* Overall progress */}
            <div className="mt-8 max-w-lg">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground mb-2">
                <span>Your journey</span>
                <span className="font-mono">{completedRequired}/{totalRequired} steps</span>
              </div>
              <Progress value={overallPct} className="h-2" />
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="relative rounded-2xl overflow-hidden shadow-card border border-border/60 aspect-[4/5]">
              <img
                src={heroImg}
                alt="A charming British terraced home with brick facade and bay windows"
                width={1280}
                height={960}
                className="w-full h-full object-cover"
              />
              {suggestedNext && (
                <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur rounded-xl p-4 shadow-soft border">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Next up · Phase {suggested.number} · {suggested.title}
                  </p>
                  <p className="font-serif text-lg font-bold text-brand mt-1">{suggestedNext.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{suggestedNext.blurb}</p>
                  <Link
                    to={suggestedNext.to}
                    className="inline-flex items-center text-xs font-semibold text-brand mt-2 hover:underline"
                  >
                    Open tool <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* USP strip — the hard-baked moats */}
      <section className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="max-w-2xl mb-10">
            <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold font-mono">What you get</span>
            <h2 className="font-serif text-3xl md:text-4xl text-brand mt-2">
              Everything you need to buy with confidence.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Four tools the property sites won't build — because their customer is the estate agent, not you.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileSignature, title: "Proof of your verdict", body: "A signed receipt of the answer, the data and the date — so you (or your solicitor) can check it later.", to: "/decide" },
              { icon: Swords, title: "Questions to ask the agent", body: "12 sharp questions about the listing — price, chain, condition, lease — generated for you.", to: "/beat-the-agent" },
              { icon: Smartphone, title: "Viewing mode for your phone", body: "Photos, voice notes and a 40-point checklist. Works offline at the property.", to: "/viewing-mode" },
              { icon: LineChart, title: "We show our track record", body: "Our predictions vs. real sale prices, published openly with sample sizes.", to: "/methodology" },
            ].map(({ icon: Icon, title, body, to }) => (
              <Link key={title} to={to} className="group">
                <Card className="h-full p-5 bg-background border-border/70 shadow-soft hover:shadow-card hover:border-primary/30 transition-all">
                  <div className="h-10 w-10 rounded-xl bg-brand-muted text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-brand text-xl mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </Card>
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
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
              <Link to="/decide">
                Check a property
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
            <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
              See every tool →
            </Link>
          </div>
        </div>
      </section>

      {/* What data we used — visible proof of the live sources */}
      <section className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <DataSourcesPanel />
        </div>
      </section>

      {/* Three-question router for first-time visitors */}
      <IntroRouter />

      {/* Mode tabs: Guided journey vs full Toolbox */}
      <section id="journey" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        <Tabs defaultValue="toolbox" className="w-full">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-brand font-semibold">Pick a tool, get an answer</span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand mt-2">
                Every calculator and check, in one place.
              </h2>
            </div>
            <TabsList className="bg-secondary self-start md:self-auto">
              <TabsTrigger value="toolbox" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground">
                <Sparkles className="w-4 h-4 mr-1.5" /> All tools
              </TabsTrigger>
              <TabsTrigger value="journey" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground">
                <Compass className="w-4 h-4 mr-1.5" /> Guided journey
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Guided mode */}
          <TabsContent value="journey" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {phases.map((phase) => {
                const stats = phaseProgress(phase, done);
                const next = nextStepInPhase(phase, done);
                const isComplete = stats.completed === stats.total && stats.total > 0;
                const isCurrent = !isComplete && stats.completed > 0;
                return (
                  <Link key={phase.id} to={`/start/${phase.id}`} className="group">
                    <Card className={`h-full p-7 transition-all duration-200 ${
                      isCurrent
                        ? "border-brand bg-brand-muted/40 shadow-card"
                        : "bg-card border-border/70 shadow-soft hover:shadow-card hover:border-brand/30"
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg ${
                            isComplete
                              ? "bg-success text-success-foreground"
                              : "bg-brand text-brand-foreground"
                          }`}>
                            {isComplete ? <Check className="w-5 h-5" /> : phase.number}
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                              Phase {phase.number} · {phase.estimate}
                            </p>
                            <h3 className="font-serif text-2xl font-bold text-brand">{phase.title}</h3>
                          </div>
                        </div>
                        {isCurrent && (
                          <Badge className="bg-brand text-brand-foreground border-0">In progress</Badge>
                        )}
                        {isComplete && (
                          <Badge className="bg-success text-success-foreground border-0">Complete</Badge>
                        )}
                      </div>

                      <p className="text-base text-foreground font-serif italic mb-2">{phase.tagline}.</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                        {phase.description}
                      </p>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                          <span>{stats.completed} of {stats.total} steps</span>
                          <span className="font-mono">{stats.pct}%</span>
                        </div>
                        <Progress value={stats.pct} className="h-1.5" />
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
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Why these phases */}
            <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span><strong className="text-foreground">Start anywhere.</strong> Already have a deposit? Skip straight to Search.</span>
              </div>
              <div className="flex gap-3">
                <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span><strong className="text-foreground">No lock-in.</strong> Tick steps off as you go - or ignore the order entirely.</span>
              </div>
              <div className="flex gap-3">
                <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span><strong className="text-foreground">Same tools.</strong> The journey just brings the right one to the front.</span>
              </div>
            </div>
          </TabsContent>

          {/* Toolbox mode — six pillars */}
          <TabsContent value="toolbox" className="mt-0">
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
              Six surfaces cover the whole buying journey. Open one and you'll see the deeper tools inside.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {PILLARS.map((p) => (
                <Link key={p.id} to={p.to} className="group">
                  <Card className="h-full p-6 bg-card border-border/70 shadow-soft hover:shadow-card hover:border-brand/30 transition-all duration-200">
                    <div className="flex items-start justify-between mb-5">
                      <div className="h-11 w-11 rounded-xl bg-brand-muted text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
                        <p.icon className="h-5 w-5" />
                      </div>
                      {p.id === "verdict" && (
                        <Badge variant="secondary" className="bg-accent/15 text-foreground border-0">Start here</Badge>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-xl text-brand mb-2">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.tagline}</p>
                    {p.more.length > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Includes {p.more.map((m) => m.title).join(" · ")}
                      </p>
                    )}
                    <div className="mt-5 flex items-center text-sm font-semibold text-brand">
                      Open <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <footer className="py-10 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} settld · The free First-Time Buyer Toolkit.
      </footer>
    </div>
  );
}
