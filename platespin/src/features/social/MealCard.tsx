import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Meal } from "@/contract/types";
import { DIET_BY_ID } from "@/data/diets";
import { CUISINE_BY_ID } from "@/data/cuisines";
import { useAuth } from "@/auth/AuthContext";
import { deleteMeal, setLike } from "@/data/social";
import { Avatar } from "./Avatar";
import { RatingStars } from "./RatingStars";
import { timeAgo } from "./timeago";

export function MealCard({
  meal,
  showAuthor = true,
  onDeleted,
}: {
  meal: Meal;
  showAuthor?: boolean;
  onDeleted?: (id: string) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(meal.likedByMe);
  const [likeCount, setLikeCount] = useState(meal.likeCount);
  const [busy, setBusy] = useState(false);
  const isOwner = user?.id === meal.author.id;

  const toggleLike = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const r = await setLike(meal.id, next);
      setLiked(r.likedByMe);
      setLikeCount(r.likeCount);
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this meal?")) return;
    try {
      await deleteMeal(meal.id);
      onDeleted?.(meal.id);
    } catch {
      /* ignore */
    }
  };

  const venueHref = `/venue?id=${encodeURIComponent(meal.venue.id)}`;
  const cuisine = meal.venue.cuisines[0] ? CUISINE_BY_ID[meal.venue.cuisines[0]] : undefined;

  return (
    <article className="animate-pop-in rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      {showAuthor && (
        <header className="flex items-center gap-3">
          <Link to={`/u/${meal.author.handle}`} className="shrink-0">
            <Avatar user={meal.author} size={40} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link to={`/u/${meal.author.handle}`} className="block truncate text-sm font-semibold text-slate-100">
              {meal.author.displayName}
            </Link>
            <span className="text-xs text-slate-500">@{meal.author.handle}</span>
          </div>
          <span className="text-xs text-slate-500">{timeAgo(meal.createdAt)}</span>
          {isOwner && (
            <button
              type="button"
              onClick={remove}
              aria-label="Delete meal"
              className="ml-1 text-slate-600 transition hover:text-red-400"
            >
              ✕
            </button>
          )}
        </header>
      )}

      <Link to={venueHref} className="mt-3 block">
        <h3 className="truncate text-base font-bold text-slate-50">{meal.venue.name}</h3>
        <p className="truncate text-xs text-slate-500">
          {cuisine ? `${cuisine.emoji} ${cuisine.label}` : ""}
          {cuisine && meal.venue.address ? " · " : ""}
          {meal.venue.address ?? ""}
        </p>
      </Link>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm text-amber-100">{meal.dish}</p>
        <RatingStars value={meal.rating} size={16} />
      </div>

      {meal.photoUrl && (
        <img
          src={meal.photoUrl}
          alt={meal.dish}
          loading="lazy"
          className="mt-3 aspect-[4/3] w-full rounded-xl object-cover"
        />
      )}

      {meal.note && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{meal.note}</p>}

      {meal.dietTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {meal.dietTags.map((d) => {
            const diet = DIET_BY_ID[d];
            if (!diet) return null;
            return (
              <span
                key={d}
                className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-[11px] text-emerald-200/90"
              >
                {diet.emoji} {diet.label}
              </span>
            );
          })}
        </div>
      )}

      <footer className="mt-3 flex items-center gap-4 border-t border-white/5 pt-3">
        <button
          type="button"
          onClick={toggleLike}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition active:scale-95 disabled:opacity-50"
          aria-pressed={liked}
        >
          <span className={liked ? "text-red-400" : "text-slate-500"}>{liked ? "♥" : "♡"}</span>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <Link to={venueHref} className="text-sm text-slate-500 transition hover:text-amber-200">
          View spot
        </Link>
      </footer>
    </article>
  );
}
