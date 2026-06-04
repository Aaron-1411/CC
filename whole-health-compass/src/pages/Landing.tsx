import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessagesSquare, FileText, Scale, ShieldCheck, Quote } from "lucide-react";
import { clinicConfig } from "@/config/clinic";
import { trackOnce } from "@/lib/analytics";
import { Eyebrow, Pill, buttonClasses, Card } from "@/components/ui";
import { SampleJourney } from "@/components/SampleJourney";
import { SafetyPanel } from "@/components/SafetyPanel";
import { PathwayNavigator } from "@/components/PathwayNavigator";
import { LeadForm } from "@/components/LeadForm";

const TRUST = [
  "General education — not a medical device",
  "Never diagnoses or recommends treatment",
  "Always routes to a qualified practitioner",
];

const HOW = [
  {
    icon: <MessagesSquare className="h-5 w-5" />,
    title: "Tell us what's going on",
    body: "In plain English — no jargon, no forms to wrestle with. A few gentle questions, all optional.",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Get a clear summary",
    body: "A tidy summary to share with your practitioner, so your first conversation starts further ahead.",
  },
  {
    icon: <Scale className="h-5 w-5" />,
    title: "See every perspective",
    body: "How Western, Chinese and Ayurvedic traditions each understand it — then book the right human.",
  },
];

export function Landing() {
  useEffect(() => {
    trackOnce("landing_view");
  }, []);

  return (
    <div className="bg-paper">
      {/* Hero */}
      <section className="container pt-12 pb-6 text-center sm:pt-20">
        <Eyebrow className="justify-center">{clinicConfig.specialism}</Eyebrow>
        <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl leading-[1.08] sm:text-6xl">
          {clinicConfig.tagline}
        </h1>
        <p className="measure mx-auto mt-5 text-lg text-muted-foreground">
          A calm, plain-English guide that helps you describe what's going on, prepares a summary for your practitioner,
          and shows how different medical traditions understand it — always pointing you to the right qualified human.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/compass" className={buttonClasses("primary", "lg")}>
            Start my Compass <ArrowRight className="h-5 w-5" />
          </Link>
          <a href={clinicConfig.bookingUrl} className={buttonClasses("outline", "lg")}>
            Book a consultation
          </a>
        </div>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {TRUST.map((t) => (
            <li key={t}>
              <Pill tint="primary">
                <ShieldCheck className="h-3.5 w-3.5" /> {t}
              </Pill>
            </li>
          ))}
        </ul>
      </section>

      {/* The visible sample journey — the single most important conversion element */}
      <SampleJourney />

      {/* How it works */}
      <section id="how" className="container scroll-mt-20 py-14">
        <div className="mb-8 text-center">
          <Eyebrow className="justify-center">How it works</Eyebrow>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Three simple steps, no sign-up</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {HOW.map((s, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  {s.icon}
                </span>
                <span className="font-serif text-3xl text-muted-foreground/40">{i + 1}</span>
              </div>
              <h3 className="mt-4 font-serif text-xl">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Optional testimonial (hidden until a real one is added to config) */}
      {clinicConfig.testimonial.text && (
        <section className="container pb-6">
          <Card className="mx-auto max-w-3xl p-8 text-center">
            <Quote className="mx-auto h-7 w-7 text-primary/40" />
            <p className="mt-3 font-serif text-2xl leading-snug">“{clinicConfig.testimonial.text}”</p>
            <p className="mt-3 text-sm text-muted-foreground">{clinicConfig.testimonial.attribution}</p>
          </Card>
        </section>
      )}

      {/* Safety — always present, not a footnote */}
      <section id="safety" className="container scroll-mt-20 py-14">
        <div className="mb-6 text-center">
          <Eyebrow className="justify-center">Responsible by design</Eyebrow>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Safe, honest, and always human-led</h2>
          <p className="measure mx-auto mt-2 text-muted-foreground">
            This tool is built to keep you safe. It educates and prepares — it never diagnoses, and every path ends with
            a qualified practitioner.
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <SafetyPanel />
        </div>
      </section>

      {/* Pathway */}
      <section className="container py-6">
        <PathwayNavigator />
      </section>

      {/* Contact / lead capture — the ask comes after the value */}
      <section id="contact" className="container scroll-mt-20 py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <Eyebrow className="justify-center">Get in touch</Eyebrow>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl">When you're ready, a real person is here</h2>
          </div>
          <LeadForm />
        </div>
      </section>
    </div>
  );
}
