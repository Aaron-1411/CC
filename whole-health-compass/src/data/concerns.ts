import type { Concern, TraditionKey } from "./types";
import { clinicConfig } from "@/config/clinic";
import { getPack } from "./packs";

/* ────────────────────────────────────────────────────────────────────────────
   ACTIVE CONTENT RESOLVER

   The curated content now lives in pluggable packs (src/data/packs/). This file
   resolves the pack chosen in clinicConfig.contentPackId and re-exports the same
   surface the app has always imported — `traditions`, `concerns`, `getConcern`,
   `LENS_SECTIONS`, `CLOSING_LINE`, `lensValue` — so every existing import of
   "@/data/concerns" keeps working untouched while gaining the horizontal seam.

   LENS_SECTIONS and CLOSING_LINE are structural labels shared by every pack, so
   they stay here rather than inside a pack.
   ──────────────────────────────────────────────────────────────────────────── */

export const activePack = getPack(clinicConfig.contentPackId);

export const traditions = activePack.traditions;
export const concerns = activePack.concerns;

export const LENS_SECTIONS = {
  worldview: "How this tradition sees it",
  practitionerLooksAt: "What a practitioner looks at",
  whoYouSee: "Who you'd see",
} as const;

export const CLOSING_LINE =
  "To explore this properly, speak with a qualified, registered practitioner.";

export function getConcern(id: string): Concern {
  return concerns.find((c) => c.id === id) ?? concerns[0];
}

export const lensValue = (lens: Record<TraditionKey, unknown>, key: TraditionKey) => lens[key];
