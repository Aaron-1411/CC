// Returns 12-month crime stats for a lat/lng from data.police.uk (free, no key).
// Caches per rounded geo key for 30 days.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const TTL_MS = 1000 * 60 * 60 * 24 * 30;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!isFinite(lat) || !isFinite(lng)) return json({ error: "lat/lng required" }, 400);

    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: cached } = await supabase
      .from("crime_cache").select("data, fetched_at").eq("geo_key", key).maybeSingle();
    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < TTL_MS) {
      return json({ cached: true, ...(cached.data as object) });
    }

    // Pull last 12 months - police API exposes most-recent-month default; loop 12.
    const now = new Date();
    now.setMonth(now.getMonth() - 1); // most recent published month
    const months: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const counts: Record<string, number> = {};
    let total = 0;
    for (const m of months) {
      const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${m}`;
      const r = await fetch(url, { headers: { "User-Agent": "Lovable-FTB-Toolkit/1.0" } });
      if (!r.ok) continue;
      const arr = await r.json() as Array<{ category: string }>;
      total += arr.length;
      for (const c of arr) counts[c.category] = (counts[c.category] ?? 0) + 1;
    }

    // National baseline ~80 crimes / 1mi radius / year is "average".
    // data.police.uk uses ~1 mile radius from the point.
    const perYear = total;
    const score = Math.max(0, Math.min(100, Math.round(100 - (perYear - 40) * 0.4)));

    const payload = { perYear, byCategory: counts, score, months: months.length };
    await supabase.from("crime_cache").upsert({
      geo_key: key, data: payload, fetched_at: new Date().toISOString(),
    });
    return json({ cached: false, ...payload });
  } catch (e) {
    console.error("get-crime", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
