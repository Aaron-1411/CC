// Typed client for the v2 social API (Cloudflare Pages Functions backed by D1).
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

export const login = (email: string, password: string) =>
  req<{ user: PublicUser }>("/api/auth/login", jsonInit("POST", { email, password }));

export const signup = (input: {
  email: string;
  password: string;
  displayName: string;
  handle: string;
}) => req<{ user: PublicUser }>("/api/auth/signup", jsonInit("POST", input));

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
// Photos live in D1 (base64 TEXT), so we compress hard in the browser before
// uploading: downscale to ≤1600px on the long edge and JPEG re-encode at ~0.82.
// A typical phone photo (3–6 MB) drops to ~150–500 KB — well under the server's
// 1.3 MB guard and D1's row-size limit. Falls back to the original on any failure.
async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const MAX = 1600;
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82),
    );
    // Keep whichever is smaller — never upload something larger than the original.
    return blob && blob.size > 0 && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export async function uploadPhoto(file: File): Promise<{ key: string; url: string }> {
  const compressed = await compressImage(file);
  const form = new FormData();
  form.append("file", compressed, "photo.jpg");
  return req<{ key: string; url: string }>("/api/upload", { method: "POST", body: form });
}
