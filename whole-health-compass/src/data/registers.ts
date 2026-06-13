import { traditions } from "@/data/concerns";

/* ── How to check a practitioner is registered ──────────────────────────────
 * WHC routes every path to a "qualified, registered practitioner". This file
 * is the patient-facing literacy behind that phrase: *how* a person actually
 * verifies someone, for the kinds of care the active content pack discusses.
 *
 * Two deliberate accuracy choices:
 *   1. We link only to STABLE homepages / organisation pages — never a fragile
 *      deep "find-a-practitioner" search path that breaks on a site redesign.
 *   2. Where a field has no single named UK body (e.g. Ayurveda), we route the
 *      reader through the Professional Standards Authority generically rather
 *      than risk pointing at the wrong association.
 *
 * Nothing here ranks a tradition or claims an approach works — `basis` only
 * tells a patient *how* a register gets its authority, never which care is
 * "better". Pack-aware: `registersForActivePack()` shows only what's relevant.
 */

/** Statutory = backed by UK law, with titles protected so only registrants may
 *  use them. Voluntary = a professional / accredited register you can still
 *  verify; several are accredited by the Professional Standards Authority. */
export type RegisterBasis = "statutory" | "voluntary";

export type Register = {
  id: string;
  /** Plain-language field of care this register covers. */
  care: string;
  /** Full name of the register / regulator. */
  body: string;
  /** Short name or acronym, for a compact badge. */
  short: string;
  basis: RegisterBasis;
  /** What being on this register actually tells a patient — no efficacy claim. */
  whatItMeans: string;
  /** Stable homepage / organisation page — never a fragile deep search path. */
  url: string;
  /** Active-pack tradition keys this register is relevant to. */
  traditions: string[];
};

/** Every register WHC knows how to point at, across all packs. The active pack
 *  decides which actually render (see `registersForActivePack`). */
export const registers: Register[] = [
  {
    id: "gmc",
    care: "Doctors (GPs and consultants)",
    body: "General Medical Council",
    short: "GMC",
    basis: "statutory",
    whatItMeans:
      "Every UK doctor must be on the GMC register and hold a licence to practise. You can look anyone up by name and see their registration status and any restrictions.",
    url: "https://www.gmc-uk.org",
    traditions: ["western"],
  },
  {
    id: "hcpc",
    care: "Physiotherapists, dietitians and practitioner psychologists",
    body: "Health and Care Professions Council",
    short: "HCPC",
    basis: "statutory",
    whatItMeans:
      "These titles are protected by law — only people on the HCPC register may use them. Search the public register to confirm someone is entitled to practise.",
    url: "https://www.hcpc-uk.org",
    traditions: ["western", "physio"],
  },
  {
    id: "gosc",
    care: "Osteopaths",
    body: "General Osteopathic Council",
    short: "GOsC",
    basis: "statutory",
    whatItMeans:
      "By law, anyone calling themselves an osteopath in the UK must be registered with the GOsC. The register is public and searchable by name.",
    url: "https://www.osteopathy.org.uk",
    traditions: ["osteopathy"],
  },
  {
    id: "talking-therapies",
    care: "Counsellors and psychotherapists",
    body: "Accredited registers (such as BACP, NCPS and UKCP)",
    short: "Talking therapies",
    basis: "voluntary",
    whatItMeans:
      "“Counsellor” and “psychotherapist” aren’t titles protected by law, so check membership of an accredited register — several are accredited by the Professional Standards Authority. (Practitioner psychologists are separately regulated by the HCPC.)",
    url: "https://www.professionalstandards.org.uk",
    traditions: ["western"],
  },
  {
    id: "bacc",
    care: "Acupuncturists",
    body: "British Acupuncture Council",
    short: "BAcC",
    basis: "voluntary",
    whatItMeans:
      "Acupuncture isn’t regulated by law in the UK, so look for membership of a recognised professional body such as the British Acupuncture Council, which sets training, hygiene and safety standards.",
    url: "https://www.acupuncture.org.uk",
    traditions: ["tcm", "tcm-acu"],
  },
  {
    id: "ayurveda",
    care: "Ayurvedic practitioners",
    body: "A recognised Ayurvedic professional association",
    short: "Ayurveda",
    basis: "voluntary",
    whatItMeans:
      "Ayurvedic practice isn’t regulated by law in the UK. Look for membership of a recognised professional association with public standards for training, safety and conduct — the Professional Standards Authority is a good place to start checking.",
    url: "https://www.professionalstandards.org.uk",
    traditions: ["ayurveda"],
  },
];

/** The unifying "if you only check one thing" pointer. Surfaced separately from
 *  the per-field registers because it applies however someone describes their
 *  training. */
export const psaNote = {
  body: "Professional Standards Authority",
  short: "PSA",
  url: "https://www.professionalstandards.org.uk",
  text: "However someone describes their training, the Professional Standards Authority is the single thing worth knowing about. It oversees the UK’s statutory health regulators and runs an Accredited Registers programme for fields that aren’t regulated by law. If you check one thing, check whether the practitioner is on a statutory register or a PSA-accredited one.",
};

/** Product-agnostic safety literacy for traditional herbal products (D4). Names
 *  no product or ingredient and makes no efficacy claim — it explains what the
 *  THR mark does and doesn’t mean, and to involve a GP/pharmacist. */
export const herbalProductNote = {
  body: "Traditional Herbal Registration",
  short: "THR",
  regulator: "Medicines and Healthcare products Regulatory Agency",
  regulatorShort: "MHRA",
  url: "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency",
  text: "Some traditional herbal products carry a THR mark and registration number from the MHRA. That mark means the product meets standards for quality and the way it’s made, and is based on its long history of traditional use — not on evidence that it is effective for any specific condition. It’s a quality-and-safety signal, not a recommendation. Herbal products can interact with prescribed medicines, so tell your GP and pharmacist about anything you’re taking or considering.",
};

/** The active pack’s tradition keys, as a plain string set for membership tests. */
function activeKeys(): Set<string> {
  return new Set<string>(traditions.map((t) => t.key));
}

/** Registers relevant to the active content pack, in declared order. */
export function registersForActivePack(): Register[] {
  const keys = activeKeys();
  return registers.filter((r) => r.traditions.some((t) => keys.has(t)));
}

/** Whether the herbal-product (THR) note applies to the active pack — only when
 *  the pack includes a tradition that may involve herbal products. */
export function showsHerbalProductNote(): boolean {
  const keys = activeKeys();
  return ["tcm", "tcm-acu", "ayurveda"].some((k) => keys.has(k));
}
