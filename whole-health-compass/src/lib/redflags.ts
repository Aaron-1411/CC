/* ────────────────────────────────────────────────────────────────────────────
   RED-FLAG INTERRUPT ENGINE  —  structural safety net for free-text intake.

   What this is
   ────────────
   A tiny, deterministic, RULE-BASED screen. It reads the words a person already
   typed into the journey and, if any match a hard-coded danger pattern, surfaces
   a real crisis resource (999 / NHS 111 / Samaritans / Shout) ABOVE the rest of
   the page. It NEVER blocks, NEVER diagnoses, NEVER names a remedy. It only ever
   routes a person to a real, verifiable human service (see src/data/crisis.ts).

   Why it is rules, not a model
   ────────────────────────────
   No LLM ever runs on a patient surface. A hand-written regex set cannot
   hallucinate, cannot invent a condition, and is fully auditable — every word
   that can trigger a 999 prompt is visible in this file and reviewable by a
   clinician. That is the whole point.

   ⚠️  DRAFT — LAUNCH GATE (D1)
   ────────────────────────────
   Every rule below ships with `draft: true`. The engine runs LIVE in draft —
   conservative safety advice is always safe to show, and a person in crisis must
   never be gated behind a feature flag. What `draft` gates is LAUNCH SIGN-OFF:
   a named, registered UK clinician must review and calibrate the PATTERNS and the
   ACTION THRESHOLDS below, then record their name/registration, before this set
   is considered clinically signed off. `draft` is compliance provenance — it is
   never shown to a patient.

   Engineering notes
   ─────────────────
   • Patterns use the case-insensitive `/i` flag and NEVER `/g`. A global regex is
     stateful (`lastIndex` persists across `.test()` calls) and would intermittently
     miss matches — a silent, dangerous bug in a safety screen.
   • Conservative by design: it is acceptable to over-prompt a real service. It is
     not acceptable to miss one. A clinician tunes the precision at sign-off.
   ──────────────────────────────────────────────────────────────────────────── */

import type { RedFlagAudience } from "@/data/types";
import {
  type CrisisResource,
  EMERGENCY,
  URGENT_111,
  SAMARITANS,
  SHOUT,
} from "@/data/crisis";

/** The kind of action a rule routes to — ordered from most to least urgent by
 *  the SEVERITY map below. Drives which crisis card a match is grouped under. */
export type RedFlagAction = "emergency_999" | "crisis_line" | "urgent_111" | "same_day_gp";

/** Lower = more urgent. Used to sort matches and to group the UI. */
export const SEVERITY: Record<RedFlagAction, number> = {
  emergency_999: 0,
  crisis_line: 1,
  urgent_111: 2,
  same_day_gp: 3,
};

export type RedFlagRule = {
  /** Stable id — used as the dedupe key and the analytics label (no PII). */
  id: string;
  /** Danger patterns. ANY match fires the rule. Case-insensitive, never global. */
  patterns: RegExp[];
  /** Audiences this rule applies to. "all" = universal, life-threatening. The
   *  rest are gated by a concern's `sensitivity` so they only run in context. */
  appliesTo: RedFlagAudience[];
  /** Where a match routes the person. */
  action: RedFlagAction;
  /** Non-diagnostic copy: describes the symptom and points to a human. Never
   *  names a cause, a condition, or a remedy. */
  message: string;
  /** The real services to surface for this rule (hard-coded constants only). */
  resources: CrisisResource[];
  /** DRAFT until a named clinician signs off the patterns + thresholds (D1). */
  draft: boolean;
};

/* ── Rules ──────────────────────────────────────────────────────────────────
   Eight UNIVERSAL rules (appliesTo: ["all"]) cover life-threatening signs that
   matter regardless of why someone came. The rest are AUDIENCE-GATED so they
   only run when a concern is tagged for that context (pregnancy, mental_health,
   cardiac, neuro). The "children" audience exists in the type for forward-compat
   but ships with no rule yet. ALL rules are draft:true pending clinician sign-off.
   ──────────────────────────────────────────────────────────────────────────── */
const RULES: RedFlagRule[] = [
  /* ── Universal: life-threatening ─────────────────────────────────────────── */
  {
    id: "chest-pain",
    appliesTo: ["all"],
    action: "emergency_999",
    patterns: [
      /chest pain/i,
      /chest (tightness|tight|pressure|heavi|crush)/i,
      /tight(ness)? in (my|the) chest/i,
      /pressure (in|on) (my|the) chest/i,
      /pain (spreading|radiating) (to|down|into) (my|the) (arm|jaw|neck)/i,
    ],
    message:
      "Chest pain, pressure or tightness can sometimes have a serious cause — especially if it's severe, came on suddenly, or comes with breathlessness, sweating or feeling sick. If that sounds like now, call 999.",
    resources: [EMERGENCY],
    draft: true,
  },
  {
    id: "breathing",
    appliesTo: ["all"],
    action: "emergency_999",
    patterns: [
      /can('?t| ?not| ?never) (catch my breath|breathe)/i,
      /struggling to breathe/i,
      /difficulty breathing/i,
      /fighting for (breath|air)/i,
      /gasping for (breath|air)/i,
      /unable to breathe/i,
    ],
    message:
      "Real difficulty breathing — gasping, or being unable to catch your breath — needs urgent help. Call 999.",
    resources: [EMERGENCY],
    draft: true,
  },
  {
    id: "stroke",
    appliesTo: ["all"],
    action: "emergency_999",
    patterns: [
      /face (drooping|droop|dropped|fell)/i,
      /one side of (my|the) (face|body) (is |has |went )?(droop|weak|numb)/i,
      /slurred speech/i,
      /can('?t| ?not) (speak|get my words out)/i,
      /(arm|leg) (went|gone|feels) (weak|numb|dead) on one side/i,
      /\bstroke\b/i,
    ],
    message:
      "Sudden face drooping, arm weakness or slurred speech can be signs of a stroke. Every minute matters — call 999 straight away.",
    resources: [EMERGENCY],
    draft: true,
  },
  {
    id: "anaphylaxis",
    appliesTo: ["all"],
    action: "emergency_999",
    patterns: [
      /(lips?|tongue|throat|face) (is |are |feel |went )?(swelling|swollen|swell)/i,
      /swelling of (my|the) (lips?|tongue|throat|face)/i,
      /throat (closing|tightening|swelling) up/i,
      /anaphyla/i,
      /severe allergic reaction/i,
    ],
    message:
      "Sudden swelling of the lips, tongue or throat, or trouble breathing after a trigger, can be a severe allergic reaction. Call 999.",
    resources: [EMERGENCY],
    draft: true,
  },
  {
    id: "sepsis-meningitis",
    appliesTo: ["all"],
    action: "emergency_999",
    patterns: [
      /rash (that )?(doesn'?t|does not|won'?t|wont) fade/i,
      /rash.{0,20}(press|glass)/i,
      /(mottled|blue|grey|greyish) (skin|lips)/i,
      /stiff neck/i,
      /\bsepsis\b/i,
      /\bmeningitis\b/i,
      /(high (fever|temperature)).{0,30}(confus|drowsy|can'?t stay awake)/i,
    ],
    message:
      "A rash that doesn't fade when pressed, mottled or blue skin, or being very unwell with a high fever and confusion can be a medical emergency. Call 999.",
    resources: [EMERGENCY],
    draft: true,
  },
  {
    id: "thunderclap-headache",
    appliesTo: ["all"],
    action: "emergency_999",
    patterns: [
      /worst (headache|head ?ache) (of my life|ever|i'?ve ever had)/i,
      /thunderclap/i,
      /sudden(ly)? (and )?(severe|excruciating|blinding) head(ache| pain)/i,
      /head(ache)?.{0,20}came on.{0,20}(second|instant|sudden|nowhere)/i,
    ],
    message:
      "A sudden, severe headache that reaches its worst within seconds or minutes — unlike any you've had before — should be checked urgently. Call 999.",
    resources: [EMERGENCY],
    draft: true,
  },
  {
    id: "gi-bleeding",
    appliesTo: ["all"],
    action: "emergency_999",
    patterns: [
      /vomit(ing|ed)? blood/i,
      /throwing up blood/i,
      /cough(ing)? up blood/i,
      /blood in (my|the) (vomit|stool|stools|poo)/i,
      /(black|tarry|bloody) (stool|stools|poo)/i,
      /black,? tarry/i,
    ],
    message:
      "Vomiting blood, coughing up blood, or black, tarry or bloody stools can be serious. Call 999, or NHS 111 if you're unsure.",
    resources: [EMERGENCY, URGENT_111],
    draft: true,
  },
  {
    id: "suicide-self-harm",
    appliesTo: ["all"],
    action: "crisis_line",
    patterns: [
      /suicid/i,
      /kill(ing)? (myself|my self)/i,
      /end(ing)? (my life|it all)/i,
      /take my (own )?life/i,
      /don'?t want to (be here|live|wake up|go on|carry on)/i,
      /better off (dead|without me)/i,
      /(harm|hurt)(ing)? (myself|my self)/i,
      /self[- ]harm/i,
      /no (point|reason) in (living|going on|carrying on|being here)/i,
    ],
    message:
      "If you're having thoughts of ending your life or harming yourself, you deserve support right now — and it's available. You can talk to someone any time. If you're in immediate danger, call 999.",
    resources: [SAMARITANS, SHOUT, EMERGENCY],
    draft: true,
  },

  /* ── Audience-gated: pregnancy ───────────────────────────────────────────── */
  {
    id: "pregnancy-bleeding",
    appliesTo: ["pregnancy"],
    action: "urgent_111",
    patterns: [
      /pregnan\w*.{0,40}(bleed|blood|spotting)/i,
      /(bleed\w*|blood|spotting).{0,40}pregnan/i,
      /miscarriage/i,
      /\d+\s*weeks.{0,40}(bleed|blood|spotting)/i,
      /(bleed\w*|blood|spotting).{0,40}\d+\s*weeks/i,
    ],
    message:
      "Bleeding in pregnancy should always be checked. Contact your midwife, maternity unit or NHS 111 today — and call 999 if it's heavy or you feel faint.",
    resources: [URGENT_111, EMERGENCY],
    draft: true,
  },
  {
    id: "reduced-fetal-movement",
    appliesTo: ["pregnancy"],
    action: "urgent_111",
    patterns: [
      /(baby|babies).{0,30}(not|less|reduced|stopped|slowed|fewer|hasn'?t).{0,15}(move|moving|movement|kick)/i,
      /(movement|kick\w*).{0,30}(slow|stopped|reduced|less|fewer|changed)/i,
      /reduced (fetal|foetal|baby) movement/i,
      /not felt (the |my )?baby move/i,
    ],
    message:
      "If your baby's movements have slowed, changed or stopped, contact your maternity unit straight away — at any hour. Don't wait.",
    resources: [URGENT_111],
    draft: true,
  },

  /* ── Audience-gated: mental health (lower-threshold distress) ────────────── */
  {
    id: "mood-crisis-low-threshold",
    appliesTo: ["mental_health"],
    action: "crisis_line",
    patterns: [
      /can('?t| ?not) (cope|go on|carry on|keep going|do this anymore|take (it |this )?(any ?more))/i,
      /falling apart/i,
      /breaking down/i,
      /at (rock bottom|breaking point|my lowest)/i,
      /\b(hopeless|worthless|empty inside)\b/i,
      /no (hope|future|way out)/i,
      /everything (is|feels) (too much|pointless|hopeless)/i,
      /don'?t see the point/i,
    ],
    message:
      "It sounds like things feel really heavy right now. You don't have to carry that alone — someone is ready to listen, any time, day or night.",
    resources: [SAMARITANS, SHOUT],
    draft: true,
  },

  /* ── Audience-gated: cardiac ─────────────────────────────────────────────── */
  {
    id: "cardiac-watch",
    appliesTo: ["cardiac"],
    action: "urgent_111",
    patterns: [
      /palpitation/i,
      /heart (racing|pounding|fluttering|skipping|jumping)/i,
      /(racing|pounding|irregular) heart ?beat/i,
      /(fainted|fainting|passed out|blacked out|black(ing)? out)/i,
      /(breathless|short of breath).{0,30}(lying|flat|lie down|exert|walking|stairs|climb)/i,
    ],
    message:
      "Things like palpitations, fainting, or breathlessness — especially when lying flat or with everyday activity — are worth getting checked soon. NHS 111 can advise.",
    resources: [URGENT_111],
    draft: true,
  },

  /* ── Audience-gated: neurological ────────────────────────────────────────── */
  {
    id: "neuro-emergency",
    appliesTo: ["neuro"],
    action: "emergency_999",
    patterns: [
      /(loss of|losing|lost|can'?t control).{0,20}(bladder|bowel)/i,
      /(bladder|bowel).{0,20}(control|incontinen)/i,
      /(numb|numbness|tingling).{0,20}(saddle|groin|between (my )?legs|inner thigh|genital|buttock)/i,
      /saddle (numbness|anaesthesia|anesthesia)/i,
      /can('?t| ?not) (pee|wee|urinate|empty my bladder)/i,
    ],
    message:
      "New loss of bladder or bowel control, or numbness around the saddle/groin area, alongside back symptoms, needs same-day emergency assessment. Call 999.",
    resources: [EMERGENCY],
    draft: true,
  },
  {
    id: "neuro-watch",
    appliesTo: ["neuro"],
    action: "urgent_111",
    patterns: [
      /(numb\w*|pins and needles|tingling).{0,25}(spreading|getting worse|both legs|both arms|won'?t go|wont go)/i,
      /(arm|leg|hand|foot|limb).{0,15}(weak|weakness|giving way|gives way)/i,
      /(vision|eyesight).{0,20}(blurred|double|loss|going|changed|changes)/i,
      /new (numbness|weakness|tingling|pins and needles)/i,
    ],
    message:
      "New or spreading numbness, weakness, or changes to your vision or speech are worth checking promptly. NHS 111 can tell you what to do next.",
    resources: [URGENT_111],
    draft: true,
  },
];

/* ── Engine ─────────────────────────────────────────────────────────────────
   Pure function. Given the free text a person typed and the audiences a concern
   is tagged for, return the matched rules, most-urgent first. No I/O, no state,
   no model — trivially testable and reviewable.
   ──────────────────────────────────────────────────────────────────────────── */
export function screenText(text: string, audiences: RedFlagAudience[] = []): RedFlagRule[] {
  if (!text || !text.trim()) return [];
  // "all" rules always run; gated rules run only when the concern opts in.
  const active = new Set<RedFlagAudience>(["all", ...audiences]);
  return RULES.filter((r) => r.appliesTo.some((a) => active.has(a)))
    .filter((r) => r.patterns.some((p) => p.test(text)))
    .sort((a, b) => SEVERITY[a.action] - SEVERITY[b.action] || a.id.localeCompare(b.id));
}

/** Exposed for tests / audit tooling only — the full rule set. */
export const ALL_RULES: readonly RedFlagRule[] = RULES;
