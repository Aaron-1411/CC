/* ────────────────────────────────────────────────────────────────────────────
   CONSENT  —  versioned, auditable, compliance-as-product.

   Anything a person types about their health is special-category data under
   UK GDPR (Article 9). We therefore record EXACTLY what they agreed to, in
   which version, and when — and store that alongside the lead. When the wording
   below changes, bump `CONSENT_VERSION` so historical consents stay accurate.

   Keep this copy honest and plain: it must never imply the tool diagnoses,
   treats, or replaces a clinician.
   ──────────────────────────────────────────────────────────────────────────── */

export const CONSENT_VERSION = "2026-06-01";

/** The contact-consent the person must actively agree to before we capture an
 *  enquiry. `{clinic}` is replaced with the clinic name at render time. */
export const CONTACT_CONSENT =
  "I understand this tool gives general education only — not medical advice, " +
  "diagnosis or treatment — and I agree that {clinic} may contact me about my enquiry.";

/** The optional extra consent to share the health summary with the clinic. */
export const SUMMARY_CONSENT =
  "I also consent to {clinic} receiving the summary I prepared (including the " +
  "health details I entered) so they can prepare for my visit.";

export function fillConsent(template: string, clinicName: string): string {
  return template.replace(/\{clinic\}/g, clinicName);
}
