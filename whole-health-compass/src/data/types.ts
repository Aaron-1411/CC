/** A tradition is identified by a pack-local string key (e.g. "western",
 *  "osteopathy"). Packs are free to define their own set — the app renders
 *  whatever a pack declares, so the comparative engine is count-agnostic. */
export type TraditionKey = string;

/** One tradition's view of a concern. The same scannable fields for every panel
 *  so the reader learns the structure once — low cognitive load by design. */
export type Lens = {
  /** One scannable line for the panel header. */
  oneLiner: string;
  /** "How this tradition sees it" — worldview only, never a treatment. */
  worldview: string;
  /** "What this tradition links it to" — the tradition's general explanatory
   *  model for likely contributors. NEVER a personal diagnosis or cause-claim
   *  about the reader; framed as how the tradition tends to think. Optional so
   *  packs can adopt it gradually without breaking. */
  contributors?: string;
  /** "What a practitioner looks at" — the assessment lens. */
  practitionerLooksAt: string;
  /** "The kinds of approaches it draws on" — categories of approach a
   *  registered practitioner tailors. NEVER a named remedy, herb, supplement,
   *  dose, or any treats/cures/works claim; always routes to a qualified human.
   *  Optional so packs can adopt it gradually without breaking. */
  approaches?: string;
  /** "Who you'd see" — practitioner type, always registered/qualified. */
  whoYouSee: string;
};

/** The contexts in which an extra, audience-specific red-flag rule should run.
 *  "all" is universal (life-threatening signs that matter regardless of why
 *  someone came) and is always active in the screen. The rest are opt-in per
 *  concern via `Concern.sensitivity`, so a gated rule (e.g. pregnancy bleeding)
 *  only fires where it is clinically relevant. Defined here, with the rest of
 *  the content vocabulary, so the red-flag engine can import it without a cycle.
 *  "children" is reserved for forward-compatibility — no rule ships for it yet. */
export type RedFlagAudience = "all" | "mental_health" | "pregnancy" | "children" | "cardiac" | "neuro";

export type Concern = {
  id: string;
  /** Short chip label for selection. */
  label: string;
  /** Natural phrasing used in the sample and the practitioner summary. */
  patientPhrase: string;
  category: string;
  /** One line shown on the selection card. */
  blurb: string;
  /** Keyed by TraditionMeta.key — one lens per tradition the pack declares. */
  lenses: Record<TraditionKey, Lens>;
  /** What the traditions broadly agree on for this concern — the unifying,
   *  enquiry-bridging "common ground" panel. Education only, never a remedy. */
  commonGround?: string[];
  /** When to seek prompt or urgent professional help. Safety, not diagnosis. */
  redFlags?: string[];
  /** Extra red-flag audiences to screen free-text against for this concern, on
   *  top of the always-on universal rules. Drives src/lib/redflags.ts. Safety
   *  routing only — never diagnosis. */
  sensitivity?: RedFlagAudience[];
};

/* ────────────────────────────────────────────────────────────────────────────
   KNOWLEDGE BASE  —  browseable, demographic-aware education.

   A second way into the same curated content: instead of the guided journey,
   a reader can browse high-frequency issues (bloating, menopause, low energy…)
   and filter by who they are (gender) and life-stage (age band). Each issue
   carries general education PLUS audience-specific notes.

   Compliance: notes are framed as "more commonly raised by…" / neutral
   life-stage education — NEVER "you have X because you're Y" and NEVER a
   remedy, dose or efficacy claim. Every issue links back to a concern, which
   routes the reader to a qualified, registered human.
   ──────────────────────────────────────────────────────────────────────────── */

/** A demographic facet. "everyone"/"any" are UI defaults; the rest are the
 *  gender and life-stage bands an issue can be tagged as commonly raised by. */
export type AudienceKey = "everyone" | "women" | "men" | "younger" | "midlife" | "older";

/** One audience-specific education note for an issue. */
export type AudienceNote = {
  audience: AudienceKey;
  /** Neutral, life-stage framing — never personalised diagnosis or a remedy. */
  note: string;
};

/** A browseable health issue: general education plus demographic notes, mapped
 *  to a Concern so the comparative lens + safety content can be reused. */
export type IssueGuide = {
  id: string;
  /** Plain-English title, e.g. "Bloating" or "Menopause & perimenopause". */
  label: string;
  /** One scannable line for the index card. */
  summary: string;
  /** Which audiences this is most commonly raised by (drives the filters). */
  commonFor: AudienceKey[];
  /** The Concern this issue maps to — reuses its lenses, common ground, red flags. */
  concernId: string;
  /** General, audience-agnostic education bullets. */
  general: string[];
  /** Audience-specific education notes, shown when relevant. Optional. */
  byAudience?: AudienceNote[];
};

/** Selectable filter chip metadata. `facet` splits gender ("who") from
 *  life-stage ("stage") so the UI can present two filter rows. */
export type AudienceMeta = {
  key: AudienceKey;
  label: string;
  facet: "who" | "stage";
};

/** The browseable knowledge base attached to a content pack. */
export type KnowledgeBase = {
  audiences: AudienceMeta[];
  issues: IssueGuide[];
};

export type TraditionMeta = {
  key: TraditionKey;
  label: string;
  short: string;
  /** HSL channel string, e.g. "208 40% 44%". Tradition tints carry their own
   *  colour so a new pack needs no Tailwind/theme changes. Match lightness
   *  within a pack so no tradition looks visually superior to another. */
  tint: string;
  /** Tradition-level practical context — what a first visit tends to involve
   *  (length, setting, what they'll ask). Stable across concerns. Optional. */
  whatToExpect?: string;
  /** Tradition-level neutral note on UK regulation and how to weigh evidence.
   *  Never asserts efficacy — points the reader to a qualified human. Optional. */
  evidenceAndRegulation?: string;
};

/** Provenance for the curated content — turns "static copy" into an auditable,
 *  regulator-ready asset. Surfaced to patients (trust) and on /compliance. */
export type ContentReview = {
  /** Reviewer name. */
  reviewedBy: string;
  /** Reviewer role / credential, e.g. "GP, MRCGP". */
  role: string;
  /** ISO date of the most recent review. */
  date: string;
  /** Content version string. */
  version: string;
  /** Short scope-of-review statement. */
  statement?: string;
};

/** A pluggable vertical of curated content. Drop a new pack into
 *  src/data/packs/, register it, and point clinicConfig.contentPackId at it to
 *  re-target the whole product at a different specialism — no app changes. */
export type ContentPack = {
  id: string;
  /** Human label for the pack, e.g. "Integrative & whole-person". */
  label: string;
  /** One line describing the pack's scope (used in docs/admin, not patient UI). */
  description: string;
  traditions: TraditionMeta[];
  concerns: Concern[];
  /** Browseable, demographic-aware education built on the same concerns. Optional. */
  knowledgeBase?: KnowledgeBase;
  /** Medical-review provenance for this pack's content. Optional. */
  review?: ContentReview;
};
