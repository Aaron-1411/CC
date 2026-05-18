// Returns the ONS Index of Private Housing Rental Prices (IPHRP) monthly
// series for a UK region. Source: ONS time-series API (mm23 dataset).
// Series IDs map to the published IPHRP regional indices.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const TTL_MS = 1000 * 60 * 60 * 24 * 30;

// Region → ONS time-series ID for IPHRP (mm23 dataset).
// Codes verified against ONS published IPHRP tables.
const SERIES: Record<string, string> = {
  "uk": "l522",
  "great britain": "l523",
  "england": "l524",
  "wales": "l525",
  "scotland": "l526",
  "northern ireland": "l527",
  "north east": "l528",
  "north west": "l529",
  "yorkshire and the humber": "l530",
  "east midlands": "l531",
  "west midlands": "l532",
  "east": "l533",
  "east of england": "l533",
  "london": "l534",
  "south east": "l535",
  "south west": "l536",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const region: string = (url.searchParams.get("region") ?? body.region ?? "uk")
      .toString().toLowerCase().trim();
    const series = SERIES[region] ?? SERIES["uk"];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: cached } = await supabase.from("rental_cache")
      .select("data, fetched_at").eq("region", region).maybeSingle();
    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < TTL_MS) {
      return json({ region, cached: true, series: cached.data });
    }

    const r = await fetch(
      `https://api.ons.gov.uk/timeseries/${series}/dataset/mm23/data`,
      { headers: { Accept: "application/json", "User-Agent": "Lovable-FTB-Toolkit/1.0" } },
    );
    if (!r.ok) return json({ error: `ONS ${r.status}` }, 502);
    const j = await r.json();
    // deno-lint-ignore no-explicit-any
    const months: { date: string; index: number }[] = (j.months ?? []).map((m: any) => ({
      date: `${m.year}-${String(monthNum(m.month)).padStart(2, "0")}-01`,
      index: Number(m.value),
    })).filter((p: { index: number }) => Number.isFinite(p.index));

    await supabase.from("rental_cache").upsert({
      region, data: months, fetched_at: new Date().toISOString(),
    });
    return json({ region, cached: false, series: months });
  } catch (e) {
    console.error("get-rental-index error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function monthNum(name: string): number {
  const M = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const i = M.indexOf((name ?? "").toLowerCase());
  return i >= 0 ? i + 1 : 1;
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
