import type { DietId, PlaceResult } from "@/contract/types";
import { CUISINE_BY_ID } from "@/data/cuisines";
import { DIET_BY_ID } from "@/data/diets";

interface PlaceCardProps {
  place: PlaceResult;
  diets: DietId[];
  liked: boolean;
  onToggleLike: (id: string) => void;
  onVisit: (id: string) => void;
}

function formatDistance(m: number | undefined): string | null {
  if (typeof m !== "number") return null;
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

type BadgeTone = "good" | "warn" | "muted";

interface DietBadge {
  key: string;
  text: string;
  tone: BadgeTone;
  title?: string;
}

// Honest per-diet badge. Allergy-class diets (safetyCritical) NEVER render as a
// green "safe" state — only an amber "confirm with venue" advisory, because
// crowdsourced OSM data is never a safety guarantee.
function dietBadge(place: PlaceResult, dietId: DietId): DietBadge {
  const diet = DIET_BY_ID[dietId];
  const avail = place.diet?.[dietId]; // only | yes | limited | (undefined = unknown)
  const label = diet?.label ?? dietId;

  if (diet?.safetyCritical) {
    const known = avail === "only" || avail === "yes" || avail === "limited";
    return {
      key: dietId,
      text: known ? `${label} · confirm` : `${label}?`,
      tone: "warn",
      title: diet.advisory,
    };
  }

  if (avail === "only" || avail === "yes") {
    return { key: dietId, text: `${diet?.emoji ?? ""} ${label}`.trim(), tone: "good" };
  }
  if (avail === "limited") {
    return { key: dietId, text: `${label} (some)`, tone: "warn" };
  }
  // No OSM tag → unknown. Honest muted marker, not a claim either way.
  return { key: dietId, text: `${label}?`, tone: "muted", title: "No dietary data — confirm with the venue." };
}

const TONE_CLASS: Record<BadgeTone, string> = {
  good: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  warn: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  muted: "border-white/10 bg-white/5 text-slate-400",
};

export function PlaceCard({ place, diets, liked, onToggleLike, onVisit }: PlaceCardProps) {
  const distance = formatDistance(place.distanceMeters);
  const cuisineLabels = place.cuisine.map((c) => CUISINE_BY_ID[c]?.label).filter(Boolean);
  const badges = diets.map((d) => dietBadge(place, d));
  const links = place.links;

  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-slate-100">{place.name}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-400">
            {distance && <span className="font-medium text-slate-300">{distance}</span>}
            {distance && cuisineLabels.length > 0 && <span aria-hidden>·</span>}
            {cuisineLabels.length > 0 && <span>{cuisineLabels.join(", ")}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggleLike(place.id)}
          aria-pressed={liked}
          aria-label={liked ? "Remove from saved" : "Save place"}
          className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none transition active:scale-90"
          title={liked ? "Saved" : "Save"}
        >
          <span className={liked ? "text-rose-400" : "text-slate-500"}>{liked ? "♥" : "♡"}</span>
        </button>
      </div>

      {place.address && <p className="mt-1 truncate text-xs text-slate-500">{place.address}</p>}
      {place.hours && (
        <p className="mt-1 text-xs text-slate-500" title={place.hours}>
          🕒 <span className="text-slate-400">{place.hours}</span>
        </p>
      )}

      {badges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <span
              key={b.key}
              title={b.title}
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE_CLASS[b.tone]}`}
            >
              {b.text}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        <a
          href={links.googleMaps}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onVisit(place.id)}
          className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-300 px-3 text-sm font-semibold text-slate-900 transition active:scale-[0.98]"
        >
          🗺️ Directions
        </a>
        <a
          href={links.tiktokSearch}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onVisit(place.id)}
          className="flex min-h-[40px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-200 hover:bg-white/10"
          title="Search on TikTok"
        >
          TikTok
        </a>
        <a
          href={links.instagramSearch}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onVisit(place.id)}
          className="flex min-h-[40px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-200 hover:bg-white/10"
          title="Search on Instagram"
        >
          IG
        </a>
        {links.website && (
          <a
            href={links.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onVisit(place.id)}
            className="flex min-h-[40px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-200 hover:bg-white/10"
            title="Visit website"
          >
            Site
          </a>
        )}
      </div>
    </li>
  );
}
