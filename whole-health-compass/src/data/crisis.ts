/* ────────────────────────────────────────────────────────────────────────────
   UNIVERSAL CRISIS RESOURCES  —  real, current UK signposting.

   These are the only "what to do right now" destinations the app ever surfaces.
   They are deliberately hard-coded, named constants — never free text and never
   generated — so the red-flag engine can only ever route a reader to a real,
   verifiable service. Never to a remedy, a product, or a diagnosis.

   The education-only rule still holds: a resource tells someone WHO to contact
   and HOW — never what is wrong with them.
   ──────────────────────────────────────────────────────────────────────────── */

export type CrisisChannel = "call" | "text";

export type CrisisResource = {
  id: string;
  /** Short action label, e.g. "Call 999". */
  label: string;
  /** The number to call or text. */
  contact: string;
  /** How to reach it. */
  channel: CrisisChannel;
  /** One neutral line on when/why — never diagnostic. */
  detail: string;
  /** tel:/sms: href for a one-tap action on mobile. */
  href: string;
  /** Availability note. */
  availability: string;
};

/** 999 — life-threatening emergencies. */
export const EMERGENCY: CrisisResource = {
  id: "emergency-999",
  label: "Call 999",
  contact: "999",
  channel: "call",
  detail: "For a medical emergency or anything life-threatening.",
  href: "tel:999",
  availability: "24/7",
};

/** NHS 111 — urgent but not life-threatening; "I'm not sure what to do". */
export const URGENT_111: CrisisResource = {
  id: "nhs-111",
  label: "Call NHS 111",
  contact: "111",
  channel: "call",
  detail: "Free urgent advice when it's not an emergency but you need help today.",
  href: "tel:111",
  availability: "24/7",
};

/** Samaritans — emotional distress, any time, any reason. */
export const SAMARITANS: CrisisResource = {
  id: "samaritans",
  label: "Call Samaritans",
  contact: "116 123",
  channel: "call",
  detail: "A free, confidential listening line — whatever you're going through.",
  href: "tel:116123",
  availability: "24/7, free to call",
};

/** Shout — text-based crisis support for people who'd rather not call. */
export const SHOUT: CrisisResource = {
  id: "shout",
  label: "Text SHOUT to 85258",
  contact: "85258",
  channel: "text",
  detail: "Free, confidential support by text if you'd rather not talk out loud.",
  href: "sms:85258&body=SHOUT",
  availability: "24/7, free to text",
};

/** Every resource, for any UI that wants to list them all (e.g. a footer). */
export const ALL_CRISIS_RESOURCES: CrisisResource[] = [EMERGENCY, URGENT_111, SAMARITANS, SHOUT];
