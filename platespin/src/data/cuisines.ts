import type { Cuisine, CuisineId } from "@/contract/types";

// OSM `cuisine=*` values are free-form and messy (semicolon-separated, regional
// spellings). osmValues lists the values that normalise INTO each cuisine. The
// Overpass normaliser (Phase 3) uses these both to query and to bucket results.

export const CUISINES: Cuisine[] = [
  { id: "italian", label: "Italian", emoji: "🍝", color: "#e63946", osmValues: ["italian"] },
  { id: "pizza", label: "Pizza", emoji: "🍕", color: "#f4a261", osmValues: ["pizza"] },
  { id: "indian", label: "Indian", emoji: "🍛", color: "#e9c46a", osmValues: ["indian", "punjabi", "south_indian"] },
  { id: "chinese", label: "Chinese", emoji: "🥡", color: "#e76f51", osmValues: ["chinese", "cantonese", "sichuan", "dim_sum"] },
  { id: "japanese", label: "Japanese", emoji: "🍣", color: "#ef476f", osmValues: ["japanese", "sushi", "ramen"] },
  { id: "thai", label: "Thai", emoji: "🍜", color: "#06d6a0", osmValues: ["thai"] },
  { id: "mexican", label: "Mexican", emoji: "🌮", color: "#ffbe0b", osmValues: ["mexican", "tex-mex"] },
  { id: "turkish", label: "Turkish", emoji: "🥙", color: "#fb5607", osmValues: ["turkish", "kebab"] },
  { id: "greek", label: "Greek", emoji: "🫒", color: "#3a86ff", osmValues: ["greek"] },
  { id: "american", label: "American", emoji: "🍔", color: "#8338ec", osmValues: ["american"] },
  { id: "burger", label: "Burgers", emoji: "🍔", color: "#bc6c25", osmValues: ["burger"] },
  { id: "british", label: "British", emoji: "🥧", color: "#588157", osmValues: ["british", "english", "fish_and_chips"] },
  { id: "korean", label: "Korean", emoji: "🍲", color: "#d62828", osmValues: ["korean"] },
  { id: "vietnamese", label: "Vietnamese", emoji: "🍲", color: "#2a9d8f", osmValues: ["vietnamese"] },
  { id: "spanish", label: "Spanish", emoji: "🥘", color: "#f77f00", osmValues: ["spanish", "tapas"] },
  { id: "french", label: "French", emoji: "🥐", color: "#9d4edd", osmValues: ["french"] },
  { id: "lebanese", label: "Lebanese", emoji: "🧆", color: "#c1121f", osmValues: ["lebanese", "middle_eastern"] },
  { id: "ethiopian", label: "Ethiopian", emoji: "🫓", color: "#774936", osmValues: ["ethiopian", "african"] },
  { id: "caribbean", label: "Caribbean", emoji: "🍤", color: "#ff006e", osmValues: ["caribbean", "jamaican"] },
  { id: "seafood", label: "Seafood", emoji: "🦞", color: "#0096c7", osmValues: ["seafood", "fish"] },
];

export const CUISINE_BY_ID: Record<CuisineId, Cuisine> = Object.fromEntries(
  CUISINES.map((c) => [c.id, c]),
) as Record<CuisineId, Cuisine>;

/** Reverse lookup: OSM cuisine value → CuisineId (for the Phase 3 normaliser). */
export const OSM_VALUE_TO_CUISINE: Record<string, CuisineId> = (() => {
  const map: Record<string, CuisineId> = {};
  for (const c of CUISINES) for (const v of c.osmValues) map[v] = c.id;
  return map;
})();

/** Sensible starter set so the wheel is fun on first load (before any user choice). */
export const DEFAULT_SELECTED: CuisineId[] = [
  "italian",
  "indian",
  "chinese",
  "japanese",
  "thai",
  "mexican",
];
