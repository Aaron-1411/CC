import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { FeedScope, Meal } from "@/contract/types";
import { useAuth } from "@/auth/AuthContext";
import { getFeed } from "@/data/social";
import { MealCard } from "@/features/social/MealCard";
import { PeopleSearch } from "@/features/social/PeopleSearch";

export function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [scope, setScope] = useState<FeedScope>("everyone");
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) setScope(user ? "following" : "everyone");
  }, [authLoading, user]);

  useEffect(() => {
    let cancelled = false;
    setMeals(null);
    setError(null);
    getFeed(scope)
      .then((m) => !cancelled && setMeals(m))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Couldn't load feed"));
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const onDeleted = useCallback(
    (id: string) => setMeals((m) => (m ? m.filter((x) => x.id !== id) : m)),
    [],
  );

  const tabClass = (s: FeedScope) =>
    `inline-flex min-h-[44px] items-center rounded-full px-3 text-sm font-semibold transition ${
      scope === s ? "bg-amber-300 text-slate-900" : "text-slate-400"
    }`;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-50">
          Plate<span className="text-amber-300">Spin</span>
        </h1>
        {!user && (
          <Link
            to="/login"
            className="inline-flex min-h-[44px] items-center rounded-full bg-amber-300 px-4 text-sm font-semibold text-slate-900"
          >
            Sign in
          </Link>
        )}
      </header>

      <PeopleSearch />

      {user && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setScope("following")} className={tabClass("following")}>
            Following
          </button>
          <button type="button" onClick={() => setScope("everyone")} className={tabClass("everyone")}>
            Everyone
          </button>
        </div>
      )}

      {meals === null && !error && (
        <p className="py-10 text-center text-sm text-slate-500">Loading feed…</p>
      )}

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {meals && meals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-slate-300">
            {scope === "following"
              ? "Your feed is quiet. Follow some food lovers — or log the last great thing you ate."
              : "No meals posted yet. Be the first!"}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              to="/compose"
              className="inline-flex min-h-[44px] items-center rounded-full bg-amber-300 px-4 text-sm font-semibold text-slate-900"
            >
              Post a meal
            </Link>
            <Link
              to="/discover"
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-slate-300"
            >
              Spin the wheel
            </Link>
          </div>
        </div>
      )}

      {meals && meals.length > 0 && (
        <div className="flex flex-col gap-3">
          {meals.map((m) => (
            <MealCard key={m.id} meal={m} onDeleted={onDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
