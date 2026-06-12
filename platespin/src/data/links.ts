import type { CuisineId, DietId, LatLng, PlaceLinks } from "@/contract/types";
import { CUISINE_BY_ID } from "@/data/cuisines";
import { DIET_BY_ID } from "@/data/diets";

// Deep-links are the rich-detail layer. OSM has no ratings/prices/photos, so we
// hand off to Google/TikTok/Instagram/YouTube instead of hosting anything.
// These work with ZERO API calls — the app is useful from Phase 2.

const enc = encodeURIComponent;

function dietQualifier(diets: DietId[] | undefined): string {
  if (!diets || diets.length === 0) return "";
  // Use the labels search engines understand best.
  return diets.map((d) => DIET_BY_ID[d]?.label.toLowerCase()).filter(Boolean).join(" ") + " ";
}

/**
 * Links for a SPIN RESULT before we have a specific place (Phase 2):
 * "find <cuisine> restaurants near <locality>". Already genuinely useful.
 */
export function buildSearchLinks(
  cuisine: CuisineId,
  localityLabel: string,
  diets?: DietId[],
): PlaceLinks {
  const c = CUISINE_BY_ID[cuisine];
  const label = c?.label ?? cuisine;
  const diet = dietQualifier(diets);
  const q = `${diet}${label} restaurant near ${localityLabel}`.trim();
  const tag = `${diet}${label} food`.trim();
  return {
    googleMaps: `https://www.google.com/maps/search/?api=1&query=${enc(q)}`,
    tiktokSearch: `https://www.tiktok.com/search?q=${enc(tag + " " + localityLabel)}`,
    instagramSearch: `https://www.instagram.com/explore/search/keyword/?q=${enc(tag + " " + localityLabel)}`,
    youtubeSearch: `https://www.youtube.com/results?search_query=${enc(tag + " " + localityLabel)}`,
  };
}

/**
 * Links for a SPECIFIC place (Phase 4): keyed on name + locality + optional coords.
 */
export function buildPlaceLinks(
  name: string,
  localityLabel: string,
  center?: LatLng,
  website?: string,
): PlaceLinks {
  const q = `${name} ${localityLabel}`.trim();
  const gm = center
    ? `https://www.google.com/maps/search/?api=1&query=${enc(q)}&query_place_id=`
    : `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
  return {
    googleMaps: gm,
    tiktokSearch: `https://www.tiktok.com/search?q=${enc(q)}`,
    instagramSearch: `https://www.instagram.com/explore/search/keyword/?q=${enc(q)}`,
    youtubeSearch: `https://www.youtube.com/results?search_query=${enc(q)}`,
    website,
    reserve: `https://www.opentable.com/s?term=${enc(q)}`,
  };
}
