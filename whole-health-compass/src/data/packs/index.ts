import type { ContentPack } from "../types";
import { integrativePack } from "./integrative";

/* ────────────────────────────────────────────────────────────────────────────
   CONTENT PACK REGISTRY  —  the horizontal seam.

   Each pack is a self-contained vertical of curated, compliance-safe content.
   To launch a new specialism, add a pack file, register it here, and set
   clinicConfig.contentPackId. Nothing in the app's pages or components changes.
   ──────────────────────────────────────────────────────────────────────────── */

export const packs: Record<string, ContentPack> = {
  [integrativePack.id]: integrativePack,
  // e.g. [musculoskeletalPack.id]: musculoskeletalPack,
};

export function getPack(id: string): ContentPack {
  return packs[id] ?? integrativePack;
}

export { integrativePack };
