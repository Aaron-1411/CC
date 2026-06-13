// GET /api/photo/:key — serve a food photo back out of D1 (immutable, long
// cache). Stored as base64 TEXT; decode to bytes and stream with its content-type.
import type { Env } from "../_lib/env";

interface PhotoRow {
  content_type: string;
  data: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const key = String(params.key);
  const row = await env.DB.prepare("SELECT content_type, data FROM photos WHERE key = ?")
    .bind(key)
    .first<PhotoRow>();
  if (!row) return new Response("Not found", { status: 404 });

  const bytes = Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0));
  const headers = new Headers();
  headers.set("content-type", row.content_type || "application/octet-stream");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(bytes, { headers });
};
