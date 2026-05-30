import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, FileSearch, MapPin, MessageSquareWarning } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeaseSense Pro — UK Property Intelligence Platform" },
      {
        name: "description",
        content:
          "Lease audits, planning permission radar, letting agent complaint letters. The all-in-one UK property advisory platform for tenants, landlords, and investors.",
      },
    ],
  }),
  component: HubPage,
});

const TOOLS = [
  {
    to: "/lease-audit",
    icon: FileSearch,
    tag: "Lease Audit",
    headline: "Your lease, decoded in 60 seconds.",
    body: "Paste a commercial lease or residential tenancy agreement. Get a risk heatmap, dilapidations exit cost, and a negotiation playbook — from the tenant or landlord side.",
    cta: "Run a lease audit",
    accent: "bg-foreground text-background",
  },
  {
    to: "/planning-radar",
    icon: MapPin,
    tag: "Planning Radar",
    headline: "What's being built near your property?",
    body: "Enter a postcode and see nearby planning applications, appeals, decisions, conservation areas, and protected-tree orders from DLUHC live data.",
    cta: "Check a postcode",
    accent: "bg-foreground text-background",
  },
  {
    to: "/agent-rater",
    icon: MessageSquareWarning,
    tag: "Agent Complaint Letters",
    headline: "Your rights, drafted and ready to send.",
    body: "Describe what went wrong with your letting agent. Get an AI-drafted formal complaint letter pre-filled with your statutory rights and the relevant legislation.",
    cta: "Draft a complaint",
    accent: "bg-foreground text-background",
  },
  {
    to: "/for-firms",
    icon: Building2,
    tag: "For Firms",
    headline: "White-label for your firm in 48 hours.",
    body: "Deploy the full platform under your brand for clients and prospects. Starter at £149/month. Unlimited audits on Firm tier.",
    cta: "See partner pricing",
    accent: "border border-border bg-surface text-foreground",
  },
] as const;

function HubPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* HERO */}
        <section className="animate-reveal">
          <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
            UK Property Intelligence Platform
          </span>
          <h1 className="mt-3 font-display text-6xl leading-[0.97] tracking-tight lg:text-7xl">
            Know exactly
            <br />
            <span className="text-muted-foreground">where you stand.</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Three AI-powered tools for tenants, landlords, and property investors. Commercial lease audits,
            planning permission data, letting agent complaint letters — all in one place.
          </p>
        </section>

        {/* TOOL GRID */}
        <section className="mt-16 grid gap-px border border-border bg-border md:grid-cols-2 animate-reveal [animation-delay:80ms]">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div key={tool.to} className="group flex flex-col bg-surface p-8 transition-colors hover:bg-background">
                <div className="mb-6 flex items-start justify-between">
                  <span className="font-mono-ui text-[10px] uppercase tracking-widest text-accent">
                    {tool.tag}
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <h2 className="font-display text-2xl leading-tight tracking-tight">{tool.headline}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{tool.body}</p>
                <Link
                  to={tool.to}
                  className={`mt-6 inline-flex w-fit items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${tool.accent} hover:opacity-80`}
                >
                  {tool.cta} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </section>

        {/* TRUST LINE */}
        <section className="mt-16 grid gap-px border border-border bg-border md:grid-cols-3 animate-reveal [animation-delay:160ms]">
          {[
            ["62 sec", "Average lease audit turnaround"],
            ["Live data", "Planning applications from DLUHC"],
            ["Pre-filled", "Statutory rights in every complaint letter"],
          ].map(([fig, label]) => (
            <div key={fig} className="bg-surface px-6 py-5">
              <div className="font-display text-2xl tracking-tight">{fig}</div>
              <div className="mt-1 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                {label}
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="mt-20 border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>LeaseSense Pro · Not legal advice — confirm material findings with a qualified solicitor.</span>
          <Link to="/for-firms" className="hover:text-foreground">
            For firms →
          </Link>
        </div>
      </footer>
    </div>
  );
}
