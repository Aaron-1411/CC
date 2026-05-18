// Returns the Bank of England official Bank Rate history.
// Source: BoE statistical database (IUDBEDR series), CSV download.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const TTL_MS = 1000 * 60 * 60 * 24; // 1 day

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: cached } = await supabase.from("boe_rate_cache")
      .select("data, fetched_at").eq("id", "base_rate").maybeSingle();
    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < TTL_MS) {
      return json({ cached: true, series: cached.data });
    }

    const today = new Date();
    const url =
      `https://www.bankofengland.co.uk/boeapps/iadb/fromshowcolumns.asp?` +
      `Travel=NIxAZxSUx&FromSeries=1&ToSeries=50&DAT=RNG&FD=1&FM=Jan&FY=1995` +
      `&TD=${today.getDate()}&TM=${today.toLocaleString("en", { month: "short" })}&TY=${today.getFullYear()}` +
      `&FNY=Y&CSVF=TT&html.x=66&html.y=26&SeriesCodes=IUDBEDR&UsingCodes=Y&Filter=N&title=IUDBEDR&VPD=Y`;

    const r = await fetch(url, { headers: { "User-Agent": "Lovable-FTB-Toolkit/1.0" } });
    if (!r.ok) return json({ error: `BoE ${r.status}` }, 502);
    const csv = await r.text();
    const lines = csv.trim().split(/\r?\n/).slice(1);
    const series = lines.map((l) => {
      const [date, rate] = l.split(",");
      // BoE date format: "DD MMM YY" e.g. "01 Jan 95"
      const parsed = parseBoeDate(date);
      return { date: parsed, rate: Number(rate) };
    }).filter((p) => p.date && Number.isFinite(p.rate));

    await supabase.from("boe_rate_cache").upsert({
      id: "base_rate", data: series, fetched_at: new Date().toISOString(),
    });
    return json({ cached: false, series });
  } catch (e) {
    console.error("get-boe-rates error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function parseBoeDate(s: string): string {
  const m = s.trim().match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})$/);
  if (!m) return "";
  const [, d, mon, y] = m;
  const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const mi = months.indexOf(mon.toLowerCase());
  if (mi < 0) return "";
  const yr = y.length === 2 ? (Number(y) > 50 ? 1900 + Number(y) : 2000 + Number(y)) : Number(y);
  return `${yr}-${String(mi + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
