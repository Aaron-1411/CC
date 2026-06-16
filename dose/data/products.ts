import type { BoxSize, BoxSizeConfig, Product } from "@/lib/types";

// ---------------------------------------------------------------------------
// DOSE catalogue. All product data lives here so it can be swapped for a real
// CMS / commerce backend later without touching components.
// TODO(real-data): replace with API fetch + real photography when commerce lands.
// ---------------------------------------------------------------------------

export const products: Product[] = [
  // ---- EVERYDAY: the hero line. Low-sugar, lightly fortified daily treat. ----
  {
    id: "raspberry-riot",
    name: "Raspberry Riot",
    line: "EVERYDAY",
    color: "raspberry",
    blurb: "The OG. Tastes like the red one you'd fight your mate for — minus the sugar guilt.",
    vibe: "fruity",
    hero: true,
    sugarGrams: 2,
    normalSugarGrams: 30,
    calories: 90,
    active: "Vitamin C + Zinc",
    bigStat: "93% less sugar",
    price: 3.5,
  },
  {
    id: "tropic-knockout",
    name: "Tropic Knockout",
    line: "EVERYDAY",
    color: "sun",
    blurb: "Mango and pineapple that taste like a holiday, minus the crash on the flight home.",
    vibe: "tropical",
    sugarGrams: 3,
    normalSugarGrams: 28,
    calories: 95,
    active: "Vitamin C + B6",
    bigStat: "89% less sugar",
    price: 3.5,
  },
  {
    id: "cola-comeback",
    name: "Cola Comeback",
    line: "EVERYDAY",
    color: "pine",
    blurb: "Fizzy cola bottles that grew up, sorted their life out, and dropped the sugar habit.",
    vibe: "nostalgic",
    sugarGrams: 2,
    normalSugarGrams: 27,
    calories: 88,
    active: "Vitamin C + Zinc",
    bigStat: "92% less sugar",
    price: 3.5,
  },
  {
    id: "sour-apple-heist",
    name: "Sour Apple Heist",
    line: "EVERYDAY",
    color: "mint",
    blurb: "Sour enough to make one eye twitch. We're genuinely not sorry about it.",
    vibe: "sour",
    sugarGrams: 3,
    normalSugarGrams: 26,
    calories: 92,
    active: "Vitamin C + Fibre",
    bigStat: "88% less sugar",
    price: 3.5,
  },

  // ---- FUEL: secondary line. Caffeine + L-theanine. Age-gated 16+. ----
  {
    id: "berry-bolt",
    name: "Berry Bolt",
    line: "FUEL",
    color: "raspberry",
    blurb: "80mg of clean caffeine, zero jitters, berry-flavoured backup for when 3pm hits hard.",
    vibe: "fruity",
    sugarGrams: 2,
    normalSugarGrams: 30,
    calories: 96,
    active: "80mg caffeine + L-theanine",
    bigStat: "80mg clean caffeine",
    price: 3.95,
  },
  {
    id: "mango-megawatt",
    name: "Mango Megawatt",
    line: "FUEL",
    color: "sun",
    blurb: "Clean energy that hits like a mango-shaped espresso. Smooth lift, no comedown.",
    vibe: "tropical",
    sugarGrams: 3,
    normalSugarGrams: 29,
    calories: 98,
    active: "80mg caffeine + L-theanine",
    bigStat: "Energy, no jitters",
    price: 3.95,
  },
];

export const productsById: Record<string, Product> = Object.fromEntries(
  products.map((p) => [p.id, p]),
);

export const everydayProducts = products.filter((p) => p.line === "EVERYDAY");
export const fuelProducts = products.filter((p) => p.line === "FUEL");

export const heroProduct = products.find((p) => p.hero) ?? products[0];

// ---------------------------------------------------------------------------
// Box configuration for the "Build your box" interaction.
// ---------------------------------------------------------------------------

export const BOX_SIZES: Record<BoxSize, BoxSizeConfig> = {
  small: {
    id: "small",
    label: "Small box",
    capacity: 6,
    bulkRate: 0,
    note: "6 packs. A solid week of treats.",
  },
  large: {
    id: "large",
    label: "Large box",
    capacity: 12,
    bulkRate: 0.1,
    note: "12 packs. 10% off + free shipping.",
  },
};

// Extra saving when you subscribe instead of buying once.
export const SUBSCRIBE_RATE = 0.15;

// A sugar cube is ~4g — used by the comparison + box copy.
export const SUGAR_CUBE_GRAMS = 4;
