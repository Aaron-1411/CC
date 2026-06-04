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
  /** "What a practitioner looks at" — the assessment lens. */
  practitionerLooksAt: string;
  /** "Who you'd see" — practitioner type, always registered/qualified. */
  whoYouSee: string;
};

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
  /** Medical-review provenance for this pack's content. Optional. */
  review?: ContentReview;
};
