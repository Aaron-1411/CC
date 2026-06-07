import type { CuisineId, DietId, SavedLocation } from "@/contract/types";
import { CUISINE_BY_ID } from "@/data/cuisines";
import { DIET_BY_ID } from "@/data/diets";
import { buildSearchLinks } from "@/data/links";

interface SpinResultCardProps {
  result: CuisineId;
  location?: SavedLocation;
  diets: DietId[];
  onRespin: () => void;
  onRespinWithout: () => void;
}

// Phase 2 result: the wheel landed on a cuisine. With no API yet, we still give a
// genuinely useful action — deep-link OUT to find spots (Google Maps / TikTok /
// Instagram / YouTube), already diet-aware. Phase 4 replaces this with in-app
// ranked PlaceResult cards from /api/places.
export function SpinResultCard({
  result,
  location,
  diets,
  onRespin,
  onRespinWithout,
}: SpinResultCardProps) {
  const cuisine = CUISINE_BY_ID[result];
  const locality = location?.label?.trim();
  const links = buildSearchLinks(result, locality ?? "near me", diets);
  const dietLabels = diets.map((d) => DIET_BY_ID[d]?.label).filter(Boolean);

  return (
    <div className="animate-pop-in rounded-2xl border border-amber-300/30 bg-gradient-to-b from-amber-300/10 to-transparent p-4 text-center">
      <p className="text-sm text-slate-400">Tonight you're having…</p>
      <p className="mt-1 text-3xl font-extrabold text-amber-100">
        {cuisine?.emoji} {cuisine?.label}
      </p>

      {dietLabels.length > 0 && (
        <p className="mt-1 text-xs text-emerald-200/80">
          filtered for {dietLabels.join(" · ")}
        </p>
      )}

      {!locality && (
        <p className="mt-2 text-xs text-slate-400">
          Add a location above to find spots near you.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          href={links.googleMaps}
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-2 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 font-semibold text-slate-900 transition active:scale-[0.98]"
        >
          🔎 Find {cuisine?.label} on Google Maps
        </a>
        <a
          href={links.tiktokSearch}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-slate-200 hover:bg-white/10"
        >
          TikTok
        </a>
        <a
          href={links.instagramSearch}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-slate-200 hover:bg-white/10"
        >
          Instagram
        </a>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-sm">
        <button
          type="button"
          onClick={onRespin}
          className="rounded-lg px-3 py-1.5 font-medium text-slate-300 hover:bg-white/5"
        >
          ↻ Spin again
        </button>
        <button
          type="button"
          onClick={onRespinWithout}
          className="rounded-lg px-3 py-1.5 font-medium text-slate-300 hover:bg-white/5"
        >
          ✕ Not {cuisine?.label}
        </button>
      </div>
    </div>
  );
}
