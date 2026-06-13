import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Meal, UserProfile } from "@/contract/types";
import { useAuth } from "@/auth/AuthContext";
import { getProfile, getUserMeals } from "@/data/social";
import { Avatar } from "@/features/social/Avatar";
import { FollowButton } from "@/features/social/FollowButton";
import { MealCard } from "@/features/social/MealCard";
import { RatingStars } from "@/features/social/RatingStars";

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-base font-bold text-slate-100">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

export function ProfilePage() {
  const { handle = "" } = useParams();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    setProfile(null);
    setMeals(null);
    setError(null);
    getProfile(handle)
      .then((p) => !c && setProfile(p))
      .catch((e) => !c && setError(e instanceof Error ? e.message : "User not found"));
    getUserMeals(handle)
      .then((m) => !c && setMeals(m))
      .catch(() => {});
    return () => {
      c = true;
    };
  }, [handle]);

  const onDeleted = useCallback(
    (id: string) => setMeals((m) => (m ? m.filter((x) => x.id !== id) : m)),
    [],
  );

  if (error) {
    return (
      <div className="pt-10 text-center">
        <p className="text-sm text-slate-400">{error}</p>
        <Link to="/" className="mt-3 inline-block text-sm text-amber-300">
          Back to feed
        </Link>
      </div>
    );
  }
  if (!profile) return <p className="py-10 text-center text-sm text-slate-500">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <Avatar user={profile} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-slate-50">{profile.displayName}</h1>
            <p className="text-sm text-slate-500">@{profile.handle}</p>
          </div>
          {profile.isSelf ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-slate-300"
            >
              Sign out
            </button>
          ) : user ? (
            <FollowButton handle={profile.handle} initialFollowing={profile.isFollowing} />
          ) : (
            <Link
              to="/login"
              className="inline-flex min-h-[44px] items-center rounded-full bg-amber-300 px-4 text-sm font-semibold text-slate-900"
            >
              Follow
            </Link>
          )}
        </div>

        {profile.bio && <p className="text-sm text-slate-300">{profile.bio}</p>}

        <div className="flex items-center justify-around rounded-2xl border border-white/10 bg-white/[0.03] py-3">
          <Stat value={profile.mealCount} label="meals" />
          <Link to={`/u/${profile.handle}`} className="contents">
            <Stat value={profile.followerCount} label="followers" />
          </Link>
          <Stat value={profile.followingCount} label="following" />
          {profile.avgRating != null && (
            <div className="flex flex-col items-center gap-0.5">
              <RatingStars value={profile.avgRating} size={13} />
              <div className="text-[11px] uppercase tracking-wide text-slate-500">avg</div>
            </div>
          )}
        </div>
      </header>

      {meals === null && <p className="py-6 text-center text-sm text-slate-500">Loading meals…</p>}
      {meals && meals.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
          {profile.isSelf ? "You haven't posted any meals yet." : "No meals yet."}
        </p>
      )}
      {meals && meals.length > 0 && (
        <div className="flex flex-col gap-3">
          {meals.map((m) => (
            <MealCard key={m.id} meal={m} showAuthor={false} onDeleted={onDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
