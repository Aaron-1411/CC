// Resolves a UK postcode via Postcodes.io (free, no key) and caches the
// result in Postgres for 30 days.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const raw =
      url.searchParams.get("postcode") ??
      (await req.json().catch(() => ({}))).postcode;

    if (!raw || typeof raw !== "string") {
      return json({ result: null, error: "postcode required" }, 200);
    }

    const postcode = raw.trim().toUpperCase().replace(/\s+/g, " ");
    if (!/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(postcode)) {
      return json({ result: null, error: "invalid UK postcode format" }, 200);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: cached } = await supabase
      .from("postcode_cache")
      .select("data, fetched_at")
      .eq("postcode", postcode)
      .maybeSingle();

    if (
      cached &&
      Date.now() - new Date(cached.fetched_at).getTime() < TTL_MS
    ) {
      return json({ ...cached.data, cached: true });
    }

    let r: Response;
    try {
      r = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
      );
    } catch (e) {
      console.error("postcodes.io network error", e);
      return json({ result: null, error: "lookup unavailable" }, 200);
    }
    if (!r.ok) return json({ result: null, error: "postcode not found" }, 200);
    const body = await r.json().catch(() => null);
    const p = body?.result;
    if (!p?.postcode) return json({ result: null, error: "postcode not found" }, 200);

    const out = {
      postcode: p.postcode,
      outcode: p.outcode,
      area: p.outcode.replace(/\d.*$/, ""),
      lad: p.admin_district,
      region: p.region,
      country: p.country,
      latitude: p.latitude,
      longitude: p.longitude,
      nearestStation: null as string | null,
    };

    await supabase
      .from("postcode_cache")
      .upsert({ postcode, data: out, fetched_at: new Date().toISOString() });

    return json({ ...out, cached: false });
  } catch (e) {
    console.error("lookup-postcode error", e);
    return json({ result: null, error: (e as Error).message }, 200);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
