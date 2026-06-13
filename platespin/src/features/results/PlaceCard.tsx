import type { DietId, PlaceResult, VenueStats } from "@/contract/types";
import { CUISINE_BY_ID } from "@/data/cuisines";
import { DIET_BY_ID } from "@/data/diets";

interface PlaceCardProps {
  place: PlaceResult;
  diets: DietId[];
  /** PlateSpin's own community rating for this venue, if anyone's reviewed it.
   *  This is the reliable, $0 rating source (no card-backed Google/TripAdvisor key). */
  stats?: VenueStats;
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

export function PlaceCard({ place, diets, stats, liked, onToggleLike, onVisit }: PlaceCardProps) {
  const distance = formatDistance(place.distanceMeters);
  const cuisineLabels = place.cuisine.map((c) => CUISINE_BY_ID[c]?.label).filter(Boolean);
  const badges = diets.map((d) => dietBadge(place, d));
  const links = place.links;
  const hasCommunityRating = !!stats && stats.count > 0;
  const hasFriendRating = !!stats && (stats.friendCount ?? 0) > 0;

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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg leading-none transition active:scale-90"
          title={liked ? "Saved" : "Save"}
        >
          <span className={liked ? "text-rose-400" : "text-slate-500"}>{liked ? "♥" : "♡"}</span>
        </button>
      </div>

      {/* Rating row. We only ever show a REAL number — PlateSpin's own community
          rating (free, no card). We never fabricate a Google/TripAdvisor star count;
          if no one's reviewed it here yet, we hand off to a Google search instead. */}
      {hasCommunityRating ? (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="font-semibold text-amber-200">
            ★ {stats!.avg.toFixed(1)}
            <span className="ml-1 font-normal text-slate-400">
              · {stats!.count} {stats!.count === 1 ? "review" : "reviews"} on PlateSpin
            </span>
          </span>
          {hasFriendRating && (
            <span className="font-medium text-emerald-200">
              ★ {stats!.friendAvg!.toFixed(1)}
              <span className="ml-1 font-normal text-emerald-200/70">
                from {stats!.friendCount} {stats!.friendCount === 1 ? "friend" : "friends"}
              </span>
            </span>
          )}
        </p>
      ) : (
        <a
          href={links.webSearch}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onVisit(place.id)}
          className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-400 underline decoration-dotted underline-offset-2 hover:text-slate-200"
          title="No PlateSpin reviews yet — check ratings on Google"
        >
          ★ No PlateSpin reviews yet — check Google
        </a>
      )}

      {place.address && <p className="mt-1 truncate text-xs text-slate-500">{place.address}</p>}
      {place.hours && (
        <p className="mt-1 text-xs text-slate-500" title={place.hours}>
          🕒 <span className="text-slate-400">{place.hours}</span>
        </p>
      )}
      {(place.reservation === "required" || place.reservation === "recommended") && (
        <p className="mt-1 text-xs text-amber-200/80">
          📅 Booking {place.reservation}
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

      {/* Booking-first actions: reserve a table where the venue takes bookings,
          then directions. Both are primary, full-height touch targets. */}
      <div className="mt-3 flex items-center gap-1.5">
        {links.reserve && (
          <a
            href={links.reserve}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onVisit(place.id)}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-300 px-3 text-sm font-bold text-slate-900 transition active:scale-[0.98]"
          >
            🍽️ Book a table
          </a>
        )}
        <a
          href={links.googleMaps}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onVisit(place.id)}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-300 px-3 text-sm font-semibold text-slate-900 transition active:scale-[0.98]"
        >
          🗺️ Directions
        </a>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        {place.phone && (
          <a
            href={`tel:${place.phone.replace(/\s+/g, "")}`}
            onClick={() => onVisit(place.id)}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-200 hover:bg-white/10"
            title={`Call to book — ${place.phone}`}
          >
            📞 Call
          </a>
        )}
        <a
          href={links.webSearch}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onVisit(place.id)}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-200 hover:bg-white/10"
          title="Ratings & reviews on Google"
        >
          Reviews
        </a>
        <a
          href={links.tiktokSearch}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onVisit(place.id)}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-200 hover:bg-white/10"
          title="Search on TikTok"
        >
          TikTok
        </a>
        <a
          href={links.instagramSearch}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onVisit(place.id)}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-200 hover:bg-white/10"
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
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-200 hover:bg-white/10"
            title="Visit website"
          >
            Site
          </a>
        )}
      </div>
    </li>
  );
}
