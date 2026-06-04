export type TraditionKey = "western" | "tcm" | "ayurveda";

/** One tradition's view of a concern. Same four fields for every panel so the
 *  reader learns the structure once and can scan — low cognitive load by design. */
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
  lenses: Record<TraditionKey, Lens>;
};

export type TraditionMeta = {
  key: TraditionKey;
  label: string;
  short: string;
  /** Tailwind token stem: "west" | "tcm" | "ayur". */
  tint: "west" | "tcm" | "ayur";
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
};
