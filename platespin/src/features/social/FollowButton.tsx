import { useState } from "react";
import { setFollow } from "@/data/social";

export function FollowButton({
  handle,
  initialFollowing,
  onChange,
}: {
  handle: string;
  initialFollowing: boolean;
  onChange?: (following: boolean) => void;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const next = !following;
    try {
      await setFollow(handle, next);
      setFollowing(next);
      onChange?.(next);
    } catch {
      /* leave state unchanged on failure */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={
        following
          ? "inline-flex min-h-[44px] items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-slate-300 transition active:scale-95 disabled:opacity-50"
          : "inline-flex min-h-[44px] items-center rounded-full bg-amber-300 px-4 text-sm font-semibold text-slate-900 transition active:scale-95 disabled:opacity-50"
      }
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
