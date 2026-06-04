/* ────────────────────────────────────────────────────────────────────────────
   PRODUCT CONFIG  —  the B2B story for the /for-clinics buyer funnel.

   This is the *product being sold* (Whole Health Compass, the platform), as
   distinct from `clinic.ts` (the white-label skin a single clinic deployment
   shows to patients). Edit copy, pricing and ROI assumptions here.

   Compliance note: outcome claims are about the clinic's funnel (enquiries,
   preparedness, time saved) — never about treating patients or health outcomes.
   ──────────────────────────────────────────────────────────────────────────── */

export type PricingTier = {
  name: string;
  priceMonthly: number; // GBP / month, billed annually
  tagline: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
};

export type RoiDefaults = {
  monthlyVisitors: number;
  baselineEnquiryRate: number; // % of visitors who currently enquire
  upliftRate: number; // additional % points the prepared-journey is assumed to add
  avgPatientValue: number; // £ value of a converted enquiry to the clinic
};

export const product = {
  name: "Whole Health Compass",
  // The one-line promise to a clinic owner.
  promise: "Turn curious visitors into prepared, qualified enquiries — safely.",
  subPromise:
    "A white-label patient-education journey that helps people describe what's going on, " +
    "prepares a summary for your practitioner, and routes them to you — without ever giving " +
    "medical advice. Your brand, live in a day.",

  // The problem we frame on the buyer page (cost of the status quo).
  problems: [
    "Visitors land, skim, and leave — no enquiry, no idea who they were.",
    "The enquiries you do get arrive vague, so first consultations start from zero.",
    "“AI symptom checkers” are a compliance landmine you can't put your name on.",
  ],

  // Outcome-framed value props (clinic funnel outcomes, not health claims).
  outcomes: [
    {
      stat: "More enquiries",
      body: "A guided, no-sign-up journey gives hesitant visitors a reason to start a conversation.",
    },
    {
      stat: "Better-prepared patients",
      body: "Every enquiry can arrive with a clean, plain-English summary your practitioner can act on.",
    },
    {
      stat: "Zero clinical risk",
      body: "Curated, static education only. It never diagnoses or recommends — so you can put your name on it.",
    },
  ],

  // Feature grid on the buyer page.
  features: [
    { title: "Your brand in a day", body: "Two hex colours, your logo and details — the whole app re-skins. No dev work." },
    { title: "Safe by design", body: "Hand-written comparative education that can't hallucinate a medical claim." },
    { title: "Practitioner summaries", body: "Patients arrive understood; first consults start further ahead." },
    { title: "Lead capture + inbox", body: "Enquiries land in your inbox and a private dashboard, with consent on file." },
    { title: "Funnel analytics", body: "See where people drop off — cookieless, first-party, GDPR-friendly." },
    { title: "Compliance pack", body: "Versioned consent and an audit trail you can show a regulator or insurer." },
  ],

  // Three tiers. Prices are illustrative anchors for the demo.
  pricing: [
    {
      name: "Solo",
      priceMonthly: 49,
      tagline: "A single practitioner getting started.",
      features: ["Your branding", "Patient journey + summaries", "Email lead capture", "Up to 250 journeys / mo"],
      cta: "Start with Solo",
    },
    {
      name: "Clinic",
      priceMonthly: 149,
      tagline: "A growing multi-practitioner clinic.",
      features: ["Everything in Solo", "Lead dashboard + funnel analytics", "Compliance pack & audit trail", "Up to 2,000 journeys / mo", "Priority support"],
      highlighted: true,
      cta: "Book a demo",
    },
    {
      name: "Group",
      priceMonthly: 399,
      tagline: "Multi-site groups and franchises.",
      features: ["Everything in Clinic", "Multiple branded sites", "Per-site analytics", "Custom content packs", "Onboarding & SLA"],
      cta: "Talk to us",
    },
  ] as PricingTier[],

  roi: {
    monthlyVisitors: 1500,
    baselineEnquiryRate: 2,
    upliftRate: 1.5,
    avgPatientValue: 240,
  } as RoiDefaults,

  faqs: [
    {
      q: "Is this a medical device or symptom checker?",
      a: "No. It provides general education and helps people prepare for a consultation. It never diagnoses, never recommends treatment, and always routes to a qualified practitioner — which is what keeps it outside medical-device regulation.",
    },
    {
      q: "Does it use AI that could say the wrong thing?",
      a: "The comparative content is hand-written and static, so it can't hallucinate a medical claim. That's the core of the safe-by-design positioning.",
    },
    {
      q: "How long does it take to launch?",
      a: "A branded site is a same-day setup: your colours, logo and details, then deploy. No development work on your side.",
    },
    {
      q: "What about data protection?",
      a: "Health details are special-category data under UK GDPR. We capture explicit, versioned consent, keep an audit trail, and analytics are cookieless and first-party. See the compliance page for the full picture.",
    },
    {
      q: "Who owns the patient relationship?",
      a: "You do. Enquiries go to your inbox and your dashboard. We're the infrastructure under your brand.",
    },
  ],

  // Where “Book a demo” CTAs point. A mailto keeps the demo functional with no
  // external dependency; swap for a scheduling link when you have one.
  demoEmail: "hello@wholehealthcompass.example",
  demoSubject: "Whole Health Compass — clinic demo",
};
