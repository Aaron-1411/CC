// Typed client for the v2 social API (Cloudflare Pages Functions backed by D1/R2).
// Same-origin → the httpOnly session cookie rides along automatically.
import type {
  CreateMealInput,
  FeedScope,
  Meal,
  MeResponse,
  PublicUser,
  UserProfile,
  VenueAggregate,
  VenueStats,
} from "@/contract/types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin", ...init });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

// ── Auth ─────────────────────────────────────────────────────────────────────
export const getMe = () => req<MeResponse>("/api/auth/me");

export const devLogin = (handle: string, displayName: string) =>
  req<{ user: PublicUser }>("/api/auth/dev-login", jsonInit("POST", { handle, displayName }));

export const logout = () => req<{ ok: true }>("/api/auth/logout", { method: "POST" });

// ── Feed / meals ─────────────────────────────────────────────────────────────
export const getFeed = (scope: FeedScope) => req<Meal[]>(`/api/meals?scope=${scope}`);

export const getUserMeals = (handle: string) =>
  req<Meal[]>(`/api/meals?author=${encodeURIComponent(handle)}`);

export const getMeal = (id: string) => req<Meal>(`/api/meals/${encodeURIComponent(id)}`);

export const createMeal = (input: CreateMealInput) =>
  req<Meal>("/api/meals", jsonInit("POST", input));

export const deleteMeal = (id: string) =>
  req<{ ok: true }>(`/api/meals/${encodeURIComponent(id)}`, { method: "DELETE" });

export const setLike = (id: string, like: boolean) =>
  req<{ likeCount: number; likedByMe: boolean }>(`/api/meals/${encodeURIComponent(id)}/like`, {
    method: like ? "POST" : "DELETE",
  });

// ── People ───────────────────────────────────────────────────────────────────
export const getProfile = (handle: string) =>
  req<UserProfile>(`/api/users/${encodeURIComponent(handle)}`);

export const searchUsers = (q: string) =>
  req<PublicUser[]>(`/api/users/search?q=${encodeURIComponent(q)}`);

export const setFollow = (handle: string, follow: boolean) =>
  req<{ ok: true; following: boolean }>(
    "/api/follows",
    jsonInit("POST", { handle, action: follow ? "follow" : "unfollow" }),
  );

export const getFollows = (handle: string, type: "followers" | "following") =>
  req<PublicUser[]>(`/api/follows?handle=${encodeURIComponent(handle)}&type=${type}`);

// ── Venues ───────────────────────────────────────────────────────────────────
export const getVenue = (id: string) => req<VenueAggregate>(`/api/venue?id=${encodeURIComponent(id)}`);

export const getVenueStats = (ids: string[]) => {
  if (ids.length === 0) return Promise.resolve<VenueStats[]>([]);
  return req<VenueStats[]>(`/api/venue-stats?ids=${ids.map(encodeURIComponent).join(",")}`);
};

// ── Photo upload ─────────────────────────────────────────────────────────────
export async function uploadPhoto(file: File): Promise<{ key: string; url: string }> {
  const form = new FormData();
  form.append("file", file);
  return req<{ key: string; url: string }>("/api/upload", { method: "POST", body: form });
}
