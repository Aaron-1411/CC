// Three-question router for first-time visitors. Sends each user straight
// to the surface that answers their question — instead of staring at 6 pillars.
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ArrowRight, Zap, Calculator, MapPinned } from "lucide-react";

const ROUTES = [
  {
    icon: Zap,
    q: "Got a property in mind?",
    a: "Get a green/amber/red verdict in under a minute.",
    to: "/decide",
    cta: "Run the verdict",
  },
  {
    icon: Calculator,
    q: "Just trying to work out the budget?",
    a: "See what you can borrow, the deposit needed and year-1 bills.",
    to: "/mortgage",
    cta: "Open the calculators",
  },
  {
    icon: MapPinned,
    q: "Picking an area first?",
    a: "Compare schools, crime, transport — and find cheaper lookalike postcodes.",
    to: "/areas",
    cta: "Explore areas",
  },
];

export default function IntroRouter() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 md:pt-14">
      {/* Free-tier reframe — sets expectations before users hit a paywall mental model. */}
      <div className="mb-6 inline-flex flex-wrap items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-success/10 text-success border border-success/20">
        <span className="font-semibold uppercase tracking-widest">Free</span>
        <span className="text-success/90">Every tool here is free to use. Sign up only to save scenarios across devices.</span>
      </div>
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-brand font-semibold mb-2">Start where you are</p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-brand">
            What's on your mind right now?
          </h2>
        </div>
        <Link to="/onboarding" className="text-sm font-semibold text-brand hover:underline whitespace-nowrap inline-flex items-center gap-1">
          Personalise in 60 seconds <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROUTES.map((r) => (
          <Link key={r.to} to={r.to} className="group">
            <Card className="h-full p-5 bg-card border-border/70 shadow-soft hover:shadow-card hover:border-brand/30 transition-all">
              <div className="h-10 w-10 rounded-lg bg-brand-muted text-brand flex items-center justify-center mb-3 group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
                <r.icon className="h-5 w-5" />
              </div>
              <p className="font-serif text-lg font-bold text-brand">{r.q}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.a}</p>
              <p className="mt-3 inline-flex items-center text-sm font-semibold text-brand">
                {r.cta} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
