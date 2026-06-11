// User creation / lookup helpers shared by every auth path (dev, google, email).

import type { Env, UserRow } from "./env";
import { nowSeconds } from "./http";

/** Normalise to a legal handle: lowercase, [a-z0-9_], 3–20 chars. */
export function normalizeHandle(input: string): string {
  let h = (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (h.length < 3) h = (h + "_user").slice(0, 20);
  return h.slice(0, 20);
}

export async function findUserByHandle(env: Env, handle: string): Promise<UserRow | null> {
  return (
    (await env.DB.prepare("SELECT * FROM users WHERE handle = ?").bind(handle).first<UserRow>()) ??
    null
  );
}

export async function findUserByEmail(env: Env, email: string): Promise<UserRow | null> {
  return (
    (await env.DB.prepare("SELECT * FROM users WHERE email = ?")
      .bind(email.toLowerCase())
      .first<UserRow>()) ?? null
  );
}

export async function findUserByProvider(
  env: Env,
  provider: string,
  sub: string,
): Promise<UserRow | null> {
  return (
    (await env.DB.prepare("SELECT * FROM users WHERE auth_provider = ? AND provider_sub = ?")
      .bind(provider, sub)
      .first<UserRow>()) ?? null
  );
}

/** Pick a free handle, suffixing -2, -3… if the base is taken. */
async function ensureUniqueHandle(env: Env, base: string): Promise<string> {
  let candidate = normalizeHandle(base);
  for (let i = 0; i < 50; i++) {
    const existing = await findUserByHandle(env, candidate);
    if (!existing) return candidate;
    const suffix = `_${i + 2}`;
    candidate = (normalizeHandle(base).slice(0, 20 - suffix.length) + suffix).slice(0, 20);
  }
  // Extremely unlikely fallback.
  return `user_${Date.now().toString(36)}`.slice(0, 20);
}

export interface NewUser {
  handle: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  authProvider: "dev" | "google" | "email";
  providerSub?: string | null;
  passwordHash?: string | null;
}

export async function createUser(env: Env, input: NewUser): Promise<UserRow> {
  const id = crypto.randomUUID();
  const handle = await ensureUniqueHandle(env, input.handle || input.displayName || "user");
  const now = nowSeconds();
  await env.DB.prepare(
    `INSERT INTO users (id, handle, display_name, email, avatar_url, bio, password_hash, auth_provider, provider_sub, created_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      handle,
      input.displayName || handle,
      input.email ? input.email.toLowerCase() : null,
      input.avatarUrl ?? null,
      input.passwordHash ?? null,
      input.authProvider,
      input.providerSub ?? null,
      now,
    )
    .run();
  const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<UserRow>();
  if (!row) throw new Error("user insert failed");
  return row;
}
