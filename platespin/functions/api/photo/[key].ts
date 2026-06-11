// GET /api/photo/:key — stream a food photo back out of R2 (immutable, long cache).
import type { Env } from "../_lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const key = String(params.key);
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
};
