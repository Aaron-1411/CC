import type { Diet, DietId } from "@/contract/types";

// Dietary requirements as a first-class, persistent lens.
// Backed by OSM `diet:*` tags where they exist. Tags are SPARSE — absence of a
// tag means "unknown", never "no". Allergy-class diets (gluten/dairy/nut) are
// advisory only and must carry a "confirm with the venue" treatment in the UI.

export const DIETS: Diet[] = [
  {
    id: "vegetarian",
    label: "Vegetarian",
    emoji: "🥗",
    osmKey: "vegetarian",
    safetyCritical: false,
  },
  {
    id: "vegan",
    label: "Vegan",
    emoji: "🌱",
    osmKey: "vegan",
    safetyCritical: false,
  },
  {
    id: "pescatarian",
    label: "Pescatarian",
    emoji: "🐟",
    // No standard OSM diet tag; approximated client-side (seafood/veg-friendly).
    safetyCritical: false,
  },
  {
    id: "halal",
    label: "Halal",
    emoji: "☪️",
    osmKey: "halal",
    safetyCritical: false,
  },
  {
    id: "kosher",
    label: "Kosher",
    emoji: "✡️",
    osmKey: "kosher",
    safetyCritical: false,
  },
  {
    id: "gluten_free",
    label: "Gluten-free",
    emoji: "🌾",
    osmKey: "gluten_free",
    safetyCritical: true,
    advisory: "Community data flags gluten-free options — always confirm with the venue before ordering.",
  },
  {
    id: "dairy_free",
    label: "Dairy-free",
    emoji: "🥛",
    osmKey: "lactose_free", // OSM uses diet:lactose_free
    safetyCritical: true,
    advisory: "Based on community data — confirm dairy-free preparation with the venue.",
  },
  {
    id: "nut_free",
    label: "Nut-free",
    emoji: "🥜",
    // No reliable OSM tag for nut-free; never inferred. Pure advisory.
    safetyCritical: true,
    advisory: "We can't verify allergens. Nut allergies are serious — always speak to the venue directly.",
  },
];

export const DIET_BY_ID: Record<DietId, Diet> = Object.fromEntries(
  DIETS.map((d) => [d.id, d]),
) as Record<DietId, Diet>;

export const SAFETY_CRITICAL_DIETS: DietId[] = DIETS.filter((d) => d.safetyCritical).map((d) => d.id);

/** Diets that have a usable OSM diet:* key for querying/normalising. */
export const OSM_TAGGABLE_DIETS: DietId[] = DIETS.filter((d) => d.osmKey).map((d) => d.id);
