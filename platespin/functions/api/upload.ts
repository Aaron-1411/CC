// POST /api/upload — store a food photo in D1 (base64 TEXT) and return its key
// + serve URL. No R2 needed (keeps the stack truly $0, no card / no service to
// enable). Images arrive already compressed client-side, so payloads are small.
// Accepts multipart/form-data (field "file") or a raw image body. Auth required.
import type { Env } from "./_lib/env";
import { error, json } from "./_lib/http";
import { getSessionUser } from "./_lib/auth";

// D1 caps a single value/row around ~2 MB. Compressed JPEGs land far below this;
// base64 inflates bytes by ~33%, so guard the *raw* bytes at 1.3 MB → ≈1.75 MB
// of base64 text, comfortably inside the limit.
const MAX_BYTES = 1.3 * 1024 * 1024;

// Encode an ArrayBuffer to base64 without blowing the call stack. Spreading a
// large Uint8Array into String.fromCharCode(...) overflows, so chunk it.
function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getSessionUser(request, env);
  if (!user) return error("Sign in first", 401);

  const ct = request.headers.get("content-type") || "";
  let data: ArrayBuffer;
  let type: string;

  if (ct.includes("multipart/form-data")) {
    const form = await request.formData();
    const entry = form.get("file") as unknown;
    const blob = entry as { type?: string; arrayBuffer?: () => Promise<ArrayBuffer> } | null;
    if (!blob || typeof blob === "string" || typeof blob.arrayBuffer !== "function") {
      return error("No file provided");
    }
    type = blob.type || "application/octet-stream";
    data = await blob.arrayBuffer();
  } else {
    type = ct || "application/octet-stream";
    data = await request.arrayBuffer();
  }

  if (!type.startsWith("image/")) return error("Only image uploads are allowed");
  if (data.byteLength === 0) return error("Empty file");
  if (data.byteLength > MAX_BYTES) return error("Image too large after compression", 413);

  const ext = (type.split("/")[1] || "jpg").replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const key = `${crypto.randomUUID()}.${ext}`;
  const b64 = toBase64(data);

  await env.DB.prepare(
    "INSERT INTO photos (key, content_type, data, size, created_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(key, type, b64, data.byteLength, Date.now())
    .run();

  return json({ key, url: `/api/photo/${encodeURIComponent(key)}` }, 201);
};
