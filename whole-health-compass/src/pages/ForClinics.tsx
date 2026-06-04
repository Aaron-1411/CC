import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Palette,
  FileText,
  Inbox,
  BarChart3,
  ScrollText,
  Calculator,
  PiggyBank,
  BadgeCheck,
  Database,
  Layers,
} from "lucide-react";
import { product } from "@/config/product";
import { Eyebrow, Pill, Card, Accordion, buttonClasses } from "@/components/ui";
import { track, trackOnce } from "@/lib/analytics";

const FEATURE_ICONS = [Palette, ShieldCheck, FileText, Inbox, BarChart3, ScrollText];
const MOAT_ICONS = [PiggyBank, BadgeCheck, Database, Layers];

const gbp0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const num0 = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

function demoHref() {
  const subject = encodeURIComponent(product.demoSubject);
  return `mailto:${product.demoEmail}?subject=${subject}`;
}

export function ForClinics() {
  useEffect(() => {
    trackOnce("for_clinics_view");
  }, []);

  return (
    <div className="bg-paper">
      {/* Hero */}
      <section className="container pt-12 pb-8 text-center sm:pt-20">
        <Eyebrow className="justify-center">For clinics & practitioners</Eyebrow>
        <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl leading-[1.08] sm:text-6xl">{product.promise}</h1>
        <p className="measure mx-auto mt-5 text-lg text-muted-foreground">{product.subPromise}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href={demoHref()} onClick={() => track("demo_cta_click", { meta: { where: "hero" } })} className={buttonClasses("primary", "lg")}>
            Book a demo <ArrowRight className="h-5 w-5" />
          </a>
          <Link to="/" className={buttonClasses("outline", "lg")}>
            See the patient experience
          </Link>
        </div>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <li><Pill tint="primary"><ShieldCheck className="h-3.5 w-3.5" /> Safe by design</Pill></li>
          <li><Pill tint="accent"><Sparkles className="h-3.5 w-3.5" /> Your brand in a day</Pill></li>
          <li><Pill tint="success"><Check className="h-3.5 w-3.5" /> No sign-up for patients</Pill></li>
        </ul>
      </section>

      {/* The problem */}
      <section className="container py-12">
        <div className="mx-auto max-w-3xl">
          <Eyebrow>The status quo costs you enquiries</Eyebrow>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Most clinic sites quietly leak interest</h2>
          <div className="mt-6 grid gap-3">
            {product.problems.map((p) => (
              <Card key={p} className="flex items-start gap-3 p-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">✕</span>
                <p className="text-sm leading-relaxed text-foreground/90">{p}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="container py-12">
        <div className="mb-8 text-center">
          <Eyebrow className="justify-center">What changes</Eyebrow>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">A guided journey that earns the enquiry</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {product.outcomes.map((o) => (
            <Card key={o.stat} className="p-6">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-serif text-xl">{o.stat}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{o.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container py-12">
        <div className="mb-8 text-center">
          <Eyebrow className="justify-center">Everything included</Eyebrow>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">A complete front door, under your name</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {product.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            return (
              <Card key={f.title} className="p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-serif text-lg">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ROI calculator */}
      <RoiCalculator />

      {/* Why it lasts — durability / moat. Reads as vendor-confidence for a clinic,
          and doubles as the diligence view: margins, moat, data asset, expansion. */}
      <section className="container py-12">
        <div className="mb-8 text-center">
          <Eyebrow className="justify-center">Built to last</Eyebrow>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">A model that holds up under scrutiny</h2>
          <p className="measure mx-auto mt-2 text-muted-foreground">
            The reasons this is safe to build your front door on — and to bet on for the long run.
          </p>
        </div>
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {product.moat.map((m, i) => {
            const Icon = MOAT_ICONS[i % MOAT_ICONS.length];
            return (
              <Card key={m.title} className="p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-serif text-lg">{m.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container scroll-mt-20 py-12">
        <div className="mb-8 text-center">
          <Eyebrow className="justify-center">Simple pricing</Eyebrow>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">One predictable monthly fee</h2>
          <p className="measure mx-auto mt-2 text-muted-foreground">Billed annually. No setup fees. Cancel anytime.</p>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-3">
          {product.pricing.map((tier) => (
            <Card
              key={tier.name}
              className={
                "relative p-6 " + (tier.highlighted ? "border-primary/40 shadow-card ring-1 ring-primary/20" : "")
              }
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-6"><Pill tint="primary">Most popular</Pill></span>
              )}
              <h3 className="font-serif text-2xl">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-serif text-4xl">{gbp0.format(tier.priceMonthly)}</span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href={demoHref()}
                onClick={() => track("demo_cta_click", { meta: { where: "pricing", tier: tier.name } })}
                className={buttonClasses(tier.highlighted ? "primary" : "outline", "md") + " mt-6 w-full"}
              >
                {tier.cta}
              </a>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 text-center">
            <Eyebrow className="justify-center">Questions</Eyebrow>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl">The things clinics ask first</h2>
          </div>
          <Accordion items={product.faqs.map((f) => ({ q: f.q, a: f.a }))} />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            See the full <Link to="/compliance" className="font-medium text-primary underline-offset-4 hover:underline">compliance & safety model →</Link>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container pb-16 pt-4">
        <Card className="mx-auto max-w-3xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
          <h2 className="font-serif text-3xl sm:text-4xl">See it running under your brand</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            A 20-minute demo: your colours, your specialism, your front door. No obligation.
          </p>
          <a
            href={demoHref()}
            onClick={() => track("demo_cta_click", { meta: { where: "footer" } })}
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-card px-7 font-medium text-primary shadow-soft transition hover:brightness-105"
          >
            Book a demo <ArrowRight className="h-5 w-5" />
          </a>
        </Card>
      </section>
    </div>
  );
}

/* ── Interactive ROI estimator ──────────────────────────────────────────────
   Honest, transparent maths. The only assumption is the uplift in enquiry rate;
   everything else is the clinic's own numbers, and the assumption is shown. */
function RoiCalculator() {
  const d = product.roi;
  const [visitors, setVisitors] = useState(d.monthlyVisitors);
  const [baseRate, setBaseRate] = useState(d.baselineEnquiryRate);
  const [value, setValue] = useState(d.avgPatientValue);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched) track("roi_calc_use");
  }, [touched]);

  const { extraEnquiries, extraMonthly, extraAnnual } = useMemo(() => {
    const extra = Math.max(0, visitors) * (d.upliftRate / 100);
    return {
      extraEnquiries: extra,
      extraMonthly: extra * Math.max(0, value),
      extraAnnual: extra * Math.max(0, value) * 12,
    };
  }, [visitors, value, d.upliftRate]);

  const field = (
    label: string,
    val: number,
    set: (n: number) => void,
    opts: { min: number; max: number; step: number; prefix?: string; suffix?: string },
  ) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label} <span className="font-normal text-muted-foreground">{opts.prefix}{num0.format(val)}{opts.suffix}</span>
      </label>
      <input
        type="range"
        min={opts.min}
        max={opts.max}
        step={opts.step}
        value={val}
        onChange={(e) => {
          set(Number(e.target.value));
          setTouched(true);
        }}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[hsl(var(--primary))]"
      />
    </div>
  );

  return (
    <section className="container py-12">
      <Card className="mx-auto max-w-4xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Calculator className="h-5 w-5" />
          </span>
          <div>
            <Eyebrow>Estimate the upside</Eyebrow>
            <h2 className="font-serif text-2xl">What could a prepared front door be worth?</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="space-y-5">
            {field("Monthly website visitors", visitors, setVisitors, { min: 100, max: 10000, step: 100 })}
            {field("Visitors who enquire today", baseRate, setBaseRate, { min: 0, max: 20, step: 0.5, suffix: "%" })}
            {field("Value of a new patient", value, setValue, { min: 50, max: 1000, step: 10, prefix: "£" })}
          </div>

          <div className="rounded-xl bg-primary-soft/50 p-5">
            <p className="text-sm text-muted-foreground">Assuming a modest <strong className="text-foreground">+{d.upliftRate} percentage-point</strong> lift in enquiry rate:</p>
            <dl className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-muted-foreground">Extra enquiries / month</dt>
                <dd className="font-serif text-2xl text-foreground">{num0.format(extraEnquiries)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-muted-foreground">Extra revenue / month</dt>
                <dd className="font-serif text-2xl text-foreground">{gbp0.format(extraMonthly)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
                <dt className="text-sm font-medium text-foreground">Extra revenue / year</dt>
                <dd className="font-serif text-3xl text-primary">{gbp0.format(extraAnnual)}</dd>
              </div>
            </dl>
          </div>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          An illustration to size the opportunity, not a guarantee. It models a small lift in your <em>enquiry</em> rate —
          it makes no claim about anyone's health.
        </p>
      </Card>
    </section>
  );
}
