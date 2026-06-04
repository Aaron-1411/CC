/* ────────────────────────────────────────────────────────────────────────────
   WHITE-LABEL CONFIG  —  re-skin the whole app for a clinic by editing this file.

   To personalise for a prospect (your acquisition playbook, Step 3):
     1. name / logoText / logoUrl  → their clinic
     2. primaryColor / accentColor → their brand hex (foregrounds auto-adjust)
     3. bookingUrl / contactEmail / contactPhone → their details
     4. sampleConcernId → the concern most relevant to their specialism
          (e.g. acupuncture → "stress-anxiety"; functional → "low-energy-sleep")
     5. formEndpoint → their form handler (Formspree/Web3Forms/own endpoint).
          Leave "" to run the contact form in safe demo mode (shows the full
          success state, stores nothing externally).

   That is the entire 10-minute re-skin. Nothing else needs to change.
   ──────────────────────────────────────────────────────────────────────────── */

export type ClinicConfig = {
  /** Tenant key. Every lead and analytics event is stamped with this, so one
   *  backend (D1) can serve many clinic deployments and the dashboard can
   *  filter to a single clinic. Lowercase slug. */
  clinicId: string;
  /** Which curated content pack this clinic shows. See src/data/packs/. */
  contentPackId: string;
  name: string;
  logoText: string;
  logoUrl: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  contactEmail: string;
  contactPhone: string;
  bookingUrl: string;
  aboutBlurb: string;
  specialism: string;
  /** id from src/data/concerns.ts used for the pre-loaded landing sample */
  sampleConcernId: string;
  /** Optional BYO lead handler (Formspree/Web3Forms/own endpoint). Leave "" to
   *  use the built-in same-origin /api/lead backend (recommended). */
  formEndpoint: string;
  /** Optional single testimonial. Leave text empty to hide (honest by default). */
  testimonial: { text: string; attribution: string };
};

export const clinicConfig: ClinicConfig = {
  clinicId: "demo",
  contentPackId: "integrative",
  name: "Whole Health Compass",
  logoText: "Whole Health Compass",
  logoUrl: "",
  tagline: "Understand your health from every angle, then see the right practitioner.",
  primaryColor: "#1d4d42",
  accentColor: "#c2703d",
  contactEmail: "hello@wholehealthcompass.example",
  contactPhone: "",
  bookingUrl: "#contact",
  aboutBlurb:
    "We're an integrative practice that brings conventional and traditional perspectives together around one person — you. This tool helps you arrive understood and prepared.",
  specialism: "integrative & whole-person care",
  sampleConcernId: "low-energy-sleep",
  formEndpoint: "",
  testimonial: { text: "", attribution: "" },
};
