import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Check, X, Lock, ScrollText, EyeOff, FileCheck2, ArrowRight } from "lucide-react";
import { clinicConfig } from "@/config/clinic";
import { CONSENT_VERSION, CONTACT_CONSENT, SUMMARY_CONSENT, fillConsent } from "@/config/consent";
import { Eyebrow, Card, Pill, buttonClasses } from "@/components/ui";
import { trackOnce } from "@/lib/analytics";

const DOES = [
  "Helps people describe what's going on in plain English",
  "Prepares a clear summary to share with a practitioner",
  "Explains how different traditions each understand a concern",
  "Always routes to a qualified, registered human",
];

const NEVER = [
  "Never diagnoses or names a condition",
  "Never recommends a remedy, herb, supplement or dosage",
  "Never claims any approach treats, cures or works",
  "Never ranks one tradition above another",
];

const DATA = [
  {
    icon: <ScrollText className="h-5 w-5" />,
    title: "Versioned, explicit consent",
    body: "Health details are special-category data under UK GDPR (Article 9). We record exactly what each person agreed to, in which version, and when — stored with their enquiry.",
  },
  {
    icon: <FileCheck2 className="h-5 w-5" />,
    title: "Audit trail",
    body: "Every consent is written to an append-only audit log with a hashed (never raw) IP fingerprint — the evidence trail an insurer or regulator expects to see.",
  },
  {
    icon: <EyeOff className="h-5 w-5" />,
    title: "Cookieless analytics",
    body: "We measure the journey with first-party, cookieless events — no third-party trackers, no advertising pixels, and no health free-text in analytics.",
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Data minimisation",
    body: "We collect only what's needed to respond to an enquiry, and the patient chooses whether to share their summary at all.",
  },
];

export function Compliance() {
  useEffect(() => {
    trackOnce("compliance_view");
  }, []);

  return (
    <div className="bg-paper">
      <section className="container pt-12 pb-8 text-center sm:pt-20">
        <Eyebrow className="justify-center">Compliance & safety</Eyebrow>
        <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl leading-[1.08] sm:text-5xl">
          Safe by design — so you can put your name on it
        </h1>
        <p className="measure mx-auto mt-5 text-lg text-muted-foreground">
          This tool educates and prepares; it never practises medicine. That single principle is what keeps it outside
          medical-device regulation and makes it something a clinic can stand behind.
        </p>
        <div className="mt-6 flex justify-center">
          <Pill tint="primary"><ShieldCheck className="h-3.5 w-3.5" /> General education — not a medical device</Pill>
        </div>
      </section>

      {/* Does / never */}
      <section className="container py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-serif text-xl"><Check className="h-5 w-5 text-success" /> What it does</h2>
            <ul className="mt-4 space-y-2.5">
              {DOES.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {d}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-serif text-xl"><X className="h-5 w-5 text-destructive" /> What it never does</h2>
            <ul className="mt-4 space-y-2.5">
              {NEVER.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> {d}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Why static content is the safety story */}
      <section className="container py-10">
        <Card className="mx-auto max-w-3xl p-6 sm:p-8">
          <Eyebrow>The core idea</Eyebrow>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl">Curated content can't hallucinate a medical claim</h2>
          <p className="measure mt-3 text-muted-foreground">
            The comparative education is hand-written and static — reviewed once, then served to everyone. There's no
            generative model improvising about someone's health, so there's no risk of an unsafe or non-compliant claim
            slipping through. Safety isn't a filter bolted on afterwards; it's the architecture.
          </p>
        </Card>
      </section>

      {/* Data handling */}
      <section className="container py-10">
        <div className="mb-8 text-center">
          <Eyebrow className="justify-center">Data protection</Eyebrow>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Built for health data from the start</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {DATA.map((d) => (
            <Card key={d.title} className="p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">{d.icon}</span>
              <h3 className="mt-4 font-serif text-lg">{d.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* The actual consent text */}
      <section className="container py-10">
        <Card className="mx-auto max-w-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <Eyebrow>The consent we capture</Eyebrow>
            <Pill tint="muted">version {CONSENT_VERSION}</Pill>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Before any enquiry is captured, the person actively agrees to:</p>
          <blockquote className="mt-3 rounded-lg border-l-4 border-primary bg-surface p-4 text-sm leading-relaxed text-foreground/90">
            {fillConsent(CONTACT_CONSENT, clinicConfig.name)}
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">If they choose to share their summary, they also agree to:</p>
          <blockquote className="mt-3 rounded-lg border-l-4 border-accent bg-surface p-4 text-sm leading-relaxed text-foreground/90">
            {fillConsent(SUMMARY_CONSENT, clinicConfig.name)}
          </blockquote>
        </Card>
      </section>

      {/* Human-led closing */}
      <section className="container py-12">
        <Card className="mx-auto max-w-3xl p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-3 font-serif text-2xl sm:text-3xl">Every path ends with a real practitioner</h2>
          <p className="measure mx-auto mt-3 text-muted-foreground">
            The tool's job is to help someone arrive understood and prepared. The care itself always sits with a
            qualified, registered human — never the software.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/compass" className={buttonClasses("primary", "lg")}>
              Try the patient journey <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/for-clinics" className={buttonClasses("outline", "lg")}>
              For clinics
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
