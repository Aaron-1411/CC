import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Quote, Zap } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { ContactModal } from "@/components/ContactModal";

export const Route = createFileRoute("/for-firms")({
  head: () => ({
    meta: [
      { title: "LeaseSense Pro for Firms — White-Label Lease Audit for Agents & Solicitors" },
      {
        name: "description",
        content:
          "Deploy a branded UK commercial lease audit tool for your clients and prospects. Win pitches, productise lease reviews, and surface dilapidations exposure in under 60 seconds.",
      },
      { property: "og:title", content: "LeaseSense Pro for Firms — White-Label Lease Audit" },
      {
        property: "og:description",
        content:
          "Turn lease reviews into a repeatable, billable product. Branded under your firm.",
      },
    ],
  }),
  component: ForFirmsPage,
});

const PERSONAS = [
  {
    tag: "Commercial Agents",
    headline: "Close on the viewing, not three weeks later.",
    body: "Hand the prospect a £-quantified exit-cost report on the heads-of-terms before a competitor does. Become the agent who saved them £40k.",
  },
  {
    tag: "Business Solicitors",
    headline: "Productise the lease report.",
    body: "Stop quoting hourly for the same dilapidations & break-clause review. Sell a fixed-fee 'Pre-Sign Lease Audit' with your branding on every page.",
  },
  {
    tag: "SME Advisors & Accountants",
    headline: "Open the property conversation.",
    body: "Use the audit as a free door-opener for clients renewing leases. Convert it into property strategy, dilaps provisioning, and exit planning work.",
  },
];

const VALUE_PROPS = [
  {
    title: "Branded, not borrowed",
    body: "Your logo, your colour, your domain (e.g. leases.yourfirm.co.uk). Clients never see the engine — they see your firm's intelligence layer.",
  },
  {
    title: "Built on the dilapidations trap",
    body: "Most lease reviews bury the exit cost. Ours leads with it — the single biggest reason clients call you back at year 9.",
  },
  {
    title: "Omission hunting baked in",
    body: "Flags what's MISSING — no Schedule of Condition, no service-charge cap, no break clause. The clauses competitors miss because they're not there.",
  },
  {
    title: "Negotiation playbook output",
    body: "Every report ends with a Quick Win, a Protective Move, and an Exit Move. Action items your client takes back to the landlord — with your name on them.",
  },
];

const TIERS = [
  {
    name: "Starter",
    price: "£149",
    cadence: "/ month",
    blurb: "For solo agents and sole-practitioner solicitors testing the waters.",
    perks: [
      "Up to 25 audits / month",
      "Your logo & primary colour",
      "Branded PDF export",
      "Email support",
    ],
    cta: "Start 14-day trial",
    featured: false,
  },
  {
    name: "Firm",
    price: "£449",
    cadence: "/ month",
    blurb: "For multi-fee-earner firms and commercial agency teams.",
    perks: [
      "Unlimited audits",
      "Custom subdomain (leases.yourfirm.co.uk)",
      "Up to 10 fee-earner seats",
      "Lead-capture form on every report",
      "Priority support + onboarding call",
    ],
    cta: "Book a demo",
    featured: true,
  },
  {
    name: "Network",
    price: "POA",
    cadence: "",
    blurb: "For franchises, networks, and multi-office firms.",
    perks: [
      "Unlimited seats & offices",
      "API access & CRM integration",
      "Custom clause taxonomy & tone-of-voice tuning",
      "Dedicated account manager",
      "Annual contract",
    ],
    cta: "Talk to us",
    featured: false,
  },
];

function ForFirmsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* HERO */}
        <section className="grid gap-12 lg:grid-cols-12 animate-reveal">
          <div className="lg:col-span-7">
            <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
              White-label lease intelligence
            </span>
            <h2 className="mt-3 font-display text-6xl leading-[0.98] tracking-tight">
              Win the client
              <br />
              <span className="text-muted-foreground">before the pitch ends.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              LeaseSense Pro is a white-label UK commercial lease audit tool that
              your firm deploys for its clients and prospects. They paste a lease;
              your branded report comes back in under 60 seconds — Executive Pulse,
              dilapidations exit cost, gotcha heatmap, negotiation playbook.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-background hover:bg-accent"
              >
                See pricing <ArrowRight className="h-3 w-3" />
              </a>
              <Link
                to="/lease-audit"
                className="inline-flex items-center gap-2 border border-border bg-surface px-5 py-3 text-[11px] font-bold uppercase tracking-widest hover:border-foreground"
              >
                Try the live tool
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="border border-border bg-foreground p-6 text-background">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" />
                <span className="font-mono-ui text-[10px] font-bold uppercase tracking-widest opacity-80">
                  Why firms switch
                </span>
              </div>
              <div className="mt-6 space-y-5">
                <Stat figure="62 sec" label="Average time from paste to delivered audit" />
                <Stat figure="3.4×" label="Pilot firms' lease-review conversion vs PDF quotes" />
                <Stat figure="£32k" label="Median dilapidations exposure surfaced per audit" />
              </div>
            </div>
          </div>
        </section>

        {/* PERSONAS */}
        <section className="mt-24 animate-reveal">
          <SectionHead
            kicker="Who it's for"
            title="Three buyers. One repeatable product."
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {PERSONAS.map((p) => (
              <div key={p.tag} className="bg-surface p-6">
                <span className="font-mono-ui text-[10px] uppercase tracking-widest text-accent">
                  {p.tag}
                </span>
                <h3 className="mt-3 font-display text-2xl leading-tight">
                  {p.headline}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* VALUE PROPS */}
        <section className="mt-24 animate-reveal">
          <SectionHead
            kicker="What you ship"
            title="A protective, commercially clued-in audit — under your brand."
          />
          <div className="grid gap-6 md:grid-cols-2">
            {VALUE_PROPS.map((v) => (
              <div
                key={v.title}
                className="border border-border bg-surface p-6 transition-colors hover:border-foreground"
              >
                <h3 className="text-base font-bold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-24 animate-reveal">
          <SectionHead kicker="How it works" title="Four steps. No legal-tech procurement saga." />
          <ol className="grid gap-6 md:grid-cols-4">
            {[
              ["01", "Brand it", "Send us your logo, colour, and subdomain. Live in 48 hours."],
              ["02", "Share the link", "Embed on your site, send in pitch decks, push to your CRM."],
              ["03", "Client gets the audit", "Their lease in, your branded report out — instantly."],
              ["04", "You convert", "Lead-capture form routes the prospect straight to a fee-earner."],
            ].map(([n, t, b]) => (
              <li key={n} className="border-t-2 border-foreground pt-4">
                <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                  Step {n}
                </span>
                <h3 className="mt-2 font-display text-xl tracking-tight">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* PRICING */}
        <section id="pricing" className="mt-24 scroll-mt-24 animate-reveal">
          <SectionHead kicker="Pricing" title="Flat monthly. No per-audit metering surprises." />
          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={`flex flex-col border p-6 ${
                  t.featured
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono-ui text-[10px] font-bold uppercase tracking-widest ${
                      t.featured ? "text-background/70" : "text-muted-foreground"
                    }`}
                  >
                    {t.name}
                  </span>
                  {t.featured && (
                    <span className="bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
                      Most firms
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl tracking-tight">{t.price}</span>
                  <span
                    className={`text-xs ${
                      t.featured ? "text-background/70" : "text-muted-foreground"
                    }`}
                  >
                    {t.cadence}
                  </span>
                </div>
                <p
                  className={`mt-3 text-sm ${
                    t.featured ? "text-background/80" : "text-muted-foreground"
                  }`}
                >
                  {t.blurb}
                </p>
                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  {t.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <Check
                        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                          t.featured ? "text-background" : "text-foreground"
                        }`}
                      />
                      <span
                        className={
                          t.featured ? "text-background/90" : "text-foreground/90"
                        }
                      >
                        {perk}
                      </span>
                    </li>
                  ))}
                </ul>
                <ContactModal
                  trigger={
                    <button
                      type="button"
                      className={`mt-6 inline-flex items-center justify-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest ${
                        t.featured
                          ? "bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                          : "border border-foreground text-foreground hover:bg-foreground hover:text-background"
                      }`}
                    >
                      {t.cta} <ArrowRight className="h-3 w-3" />
                    </button>
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* QUOTE */}
        <section className="mt-24 border border-border bg-surface p-10 animate-reveal">
          <Quote className="h-6 w-6 text-accent" />
          <blockquote className="mt-4 font-display text-3xl leading-tight tracking-tight">
            "We sent the report to a prospect on a Friday. He'd signed our retainer
            by Monday. The £41k dilaps figure on page one did the work."
          </blockquote>
          <div className="mt-6 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
            Pilot Partner · Manchester commercial agency
          </div>
        </section>

        {/* CTA */}
        <section
          id="contact"
          className="mt-24 flex flex-col items-start justify-between gap-6 border border-foreground bg-background p-10 md:flex-row md:items-center animate-reveal"
        >
          <div>
            <h2 className="font-display text-3xl tracking-tight">
              Ready to put your name on every lease in your pipeline?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Book a 20-minute demo. We'll spin up a branded sandbox on the call.
            </p>
          </div>
          <ContactModal
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-2 bg-foreground px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-background hover:bg-accent"
              >
                Book a demo <ArrowRight className="h-3 w-3" />
              </button>
            }
          />
        </section>
      </main>

      <footer className="mt-20 border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-[10px] font-mono-ui uppercase tracking-widest text-muted-foreground">
          <span>LeaseSense Pro · Partner Programme</span>
          <Link to="/" className="hover:text-foreground">
            ← Back to hub
          </Link>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-8">
      <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
        {kicker}
      </span>
      <h2 className="mt-2 font-display text-4xl leading-tight tracking-tight">
        {title}
      </h2>
    </div>
  );
}

function Stat({ figure, label }: { figure: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl tracking-tight">{figure}</div>
      <div className="mt-1 text-xs opacity-80">{label}</div>
    </div>
  );
}
