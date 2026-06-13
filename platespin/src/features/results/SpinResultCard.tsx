import type { CuisineId, DietId, SavedLocation } from "@/contract/types";
import { CUISINE_BY_ID } from "@/data/cuisines";
import { DIET_BY_ID } from "@/data/diets";
import { buildSearchLinks } from "@/data/links";

interface SpinResultCardProps {
  result: CuisineId;
  location?: SavedLocation;
  diets: DietId[];
  /** True when the in-app ResultsList below has real places — then we hide the
   *  redundant "search out" grid and keep this card as a compact hero. */
  hasResults?: boolean;
  onRespin: () => void;
  onRespinWithout: () => void;
}

// The wheel landed on a cuisine. When we have in-app PlaceResult cards (Phase 4),
// this is a compact celebration + respin controls. When we DON'T (no location,
// degraded upstream, or zero nearby matches), it falls back to genuinely useful
// diet-aware deep-links OUT (Google Maps / TikTok / Instagram) — works with ZERO API.
export function SpinResultCard({
  result,
  location,
  diets,
  hasResults = false,
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

      {/* Full search-out grid — when there are NO in-app place cards, this is the
          primary way to act on the result. */}
      {!hasResults && (
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
      )}

      {/* Generic search-out — ALWAYS available, even alongside in-app place cards.
          Lets the user browse the wider web (Google / TikTok / Instagram) for this
          cuisine near them, not just the specific venues we surface below. */}
      {hasResults && (
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Or search the web</p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            <a
              href={links.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              🔎 Google
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
        </div>
      )}

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
