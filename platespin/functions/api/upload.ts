// POST /api/upload — store a food photo in R2, return its key + serve URL.
// Accepts multipart/form-data (field "file") or a raw image body. Auth required.
import type { Env } from "./_lib/env";
import { error, json } from "./_lib/http";
import { getSessionUser } from "./_lib/auth";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

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
  if (data.byteLength > MAX_BYTES) return error("Image too large (max 5MB)", 413);

  const ext = (type.split("/")[1] || "jpg").replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const key = `${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(key, data, { httpMetadata: { contentType: type } });

  return json({ key, url: `/api/photo/${encodeURIComponent(key)}` }, 201);
};
