import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { DietId, SavedLocation, VenueLite } from "@/contract/types";
import { useAuth } from "@/auth/AuthContext";
import { createMeal, uploadPhoto } from "@/data/social";
import { loadUserState, saveUserState, setLastLocation } from "@/state/userState";
import { DIETS } from "@/data/diets";
import { LocationInput } from "@/features/location/LocationInput";
import { VenuePicker } from "@/features/social/VenuePicker";
import { RatingStars } from "@/features/social/RatingStars";

const today = () => new Date().toISOString().slice(0, 10);

export function ComposePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const routerLoc = useLocation();
  const presetVenue = (routerLoc.state as { venue?: VenueLite } | null)?.venue;

  const [location, setLocation] = useState<SavedLocation | undefined>(
    () => loadUserState().lastLocation,
  );
  const [venue, setVenue] = useState<VenueLite | null>(presetVenue ?? null);
  const [dish, setDish] = useState("");
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const [dietTags, setDietTags] = useState<DietId[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [eatenOn, setEatenOn] = useState(today());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login?next=/compose", { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onFile = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const toggleDiet = (id: DietId) =>
    setDietTags((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  const setArea = (loc: SavedLocation) => {
    setLocation(loc);
    saveUserState(setLastLocation(loadUserState(), loc));
  };

  const canSubmit = useMemo(
    () => Boolean(venue && dish.trim() && rating >= 0.5 && !busy),
    [venue, dish, rating, busy],
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!venue) return setError("Pick where you ate.");
    if (!dish.trim()) return setError("What did you eat?");
    if (rating < 0.5) return setError("Add a rating.");
    setBusy(true);
    setError(null);
    try {
      let photoKey: string | undefined;
      if (file) photoKey = (await uploadPhoto(file)).key;
      await createMeal({
        venue,
        dish: dish.trim(),
        rating,
        note: note.trim() || undefined,
        photoKey,
        dietTags,
        eatenOn: eatenOn || undefined,
      });
      navigate(`/u/${user!.handle}`);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Couldn't post your meal.");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-50">Log a meal</h1>
        <p className="text-sm text-slate-400">Share what you ate and how good it was.</p>
      </header>

      {/* Step 1 — venue */}
      {venue ? (
        <div className="flex items-center justify-between rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-amber-100">{venue.name}</p>
            {venue.address && <p className="truncate text-xs text-amber-100/70">{venue.address}</p>}
          </div>
          <button
            type="button"
            onClick={() => setVenue(null)}
            className="inline-flex min-h-[44px] shrink-0 items-center text-xs font-semibold text-amber-200 underline"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Where did you eat?</p>
          <LocationInput value={location} onSet={setArea} />
          {location ? (
            <VenuePicker location={location} onPick={setVenue} />
          ) : (
            <p className="text-sm text-slate-500">Set your area to search nearby restaurants.</p>
          )}
        </div>
      )}

      {/* Step 2 — the meal */}
      {venue && (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">What did you eat?</label>
            <input
              value={dish}
              onChange={(e) => setDish(e.target.value)}
              placeholder="e.g. Margherita pizza"
              maxLength={140}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-600 focus:border-amber-300/40 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-slate-500">Your rating</span>
            <div className="flex items-center gap-2">
              <RatingStars value={rating} onChange={setRating} size={28} />
              <span className="w-8 text-right text-sm text-slate-400">{rating ? rating.toFixed(1) : "–"}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Notes (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How was it? Worth going back?"
              rows={3}
              maxLength={2000}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-600 focus:border-amber-300/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Photo (optional)</label>
            {preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="aspect-[4/3] w-full rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => onFile(null)}
                  className="absolute right-2 top-2 inline-flex min-h-[44px] items-center rounded-full bg-black/60 px-3 text-xs text-white"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-6 text-sm text-slate-400">
                Tap to add a photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
              Diet-friendly? (what this dish met)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DIETS.map((d) => {
                const on = dietTags.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDiet(d.id)}
                    className={
                      on
                        ? "inline-flex min-h-[44px] items-center rounded-full bg-emerald-300/20 px-3 text-xs font-medium text-emerald-100"
                        : "inline-flex min-h-[44px] items-center rounded-full border border-white/10 px-3 text-xs text-slate-400"
                    }
                  >
                    {d.emoji} {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">When</label>
            <input
              type="date"
              value={eatenOn}
              max={today()}
              onChange={(e) => setEatenOn(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-base text-slate-100 focus:border-amber-300/40 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="min-h-[52px] w-full rounded-2xl bg-amber-300 text-lg font-extrabold text-slate-900 shadow-lg shadow-amber-300/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Posting…" : "Post meal"}
          </button>
        </form>
      )}
    </div>
  );
}
