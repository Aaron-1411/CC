import type { PublicUser } from "@/contract/types";

export function Avatar({
  user,
  size = 40,
}: {
  user: Pick<PublicUser, "handle" | "displayName" | "avatarUrl">;
  size?: number;
}) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
      />
    );
  }
  const initial = (user.displayName || user.handle || "?").charAt(0).toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-amber-300/20 font-semibold text-amber-200"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
