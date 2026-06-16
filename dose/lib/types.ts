export type Line = "EVERYDAY" | "FUEL";

// Accent colour key — maps to a brand colour for pack + gummy theming.
export type AccentColor = "raspberry" | "sun" | "pine" | "mint";

// Flavour vibe — used by the "Find your DOSE" quiz to match a SKU.
export type Vibe = "fruity" | "sour" | "nostalgic" | "tropical";

export interface Product {
  id: string;
  /** Flavour / product name, e.g. "Raspberry Riot". */
  name: string;
  line: Line;
  /** Accent colour key for the pack-front + gummies. */
  color: AccentColor;
  /** Short, cheeky blurb in the DOSE voice. */
  blurb: string;
  /** Flavour vibe, drives quiz matching. */
  vibe: Vibe;
  /** The hero SKU gets featured first. */
  hero?: boolean;
  /** Grams of sugar in a DOSE pack. */
  sugarGrams: number;
  /** Grams of sugar in a comparable "normal" sweet pack. */
  normalSugarGrams: number;
  /** Calories per pack. */
  calories: number;
  /** What's actually doing the work, e.g. "Vit C + Zinc" or "80mg caffeine + L-theanine". */
  active: string;
  /** The big honest stat badge on the pack, e.g. "93% less sugar". */
  bigStat: string;
  /** Price per pack, GBP. */
  price: number;
}

export type BoxSize = "small" | "large";

export interface BoxSizeConfig {
  id: BoxSize;
  label: string;
  /** Max packs this box holds. */
  capacity: number;
  /** Bulk discount applied to the subtotal (0–1). */
  bulkRate: number;
  /** One-line sell. */
  note: string;
}
