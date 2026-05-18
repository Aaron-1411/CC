// Returns the UK HPI (House Price Index) monthly series for a given Local
// Authority District, sourced from HM Land Registry's SPARQL endpoint.
// Cached for 30 days (HPI updates monthly).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TTL_MS = 1000 * 60 * 60 * 24 * 30;
const SPARQL = "https://landregistry.data.gov.uk/landregistry/query";

interface HpiPoint {
  date: string;       // YYYY-MM-01
  index: number;      // HPI level (Jan 2015 = 100)
  averagePrice: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const lad: string = (url.searchParams.get("lad") ?? body.lad ?? "")
      .toString().trim();
    if (!lad) return json({ error: "lad name required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const key = lad.toLowerCase();
    const { data: cached } = await supabase.from("hpi_cache")
      .select("data, fetched_at, lad_name")
      .eq("lad_code", key).maybeSingle();

    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < TTL_MS) {
      return json({ lad: cached.lad_name, cached: true, series: cached.data });
    }

    // SPARQL: monthly HPI for the named region. We let SPARQL do a regex
    // match on the region's rdfs:label to be resilient to naming variations.
    const sparql = `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX ukhpi: <http://landregistry.data.gov.uk/def/ukhpi/>
SELECT ?date ?index ?avg ?name WHERE {
  ?obs ukhpi:refRegion ?region ;
       ukhpi:refMonth ?date ;
       ukhpi:housePriceIndex ?index ;
       ukhpi:averagePrice ?avg .
  ?region rdfs:label ?name .
  FILTER(LANG(?name) = "en")
  FILTER(REGEX(?name, "^${lad.replace(/[^a-zA-Z\s\-']/g, "")}$", "i"))
}
ORDER BY ?date
LIMIT 400`;

    const r = await fetch(SPARQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/sparql-results+json",
        "User-Agent": "Lovable-FTB-Toolkit/1.0",
      },
      body: new URLSearchParams({ query: sparql }).toString(),
    });
    if (!r.ok) {
      const txt = await r.text();
      console.error("HPI SPARQL", r.status, txt.slice(0, 300));
      return json({ error: `HPI SPARQL ${r.status}` }, 502);
    }
    const j = await r.json();
    const series: HpiPoint[] = (j.results?.bindings ?? []).map(
      // deno-lint-ignore no-explicit-any
      (b: any) => ({
        date: (b.date?.value ?? "").slice(0, 10),
        index: Number(b.index?.value ?? 0),
        averagePrice: Number(b.avg?.value ?? 0),
      }),
    ).filter((p: HpiPoint) => p.index > 0);

    const resolvedName = j.results?.bindings?.[0]?.name?.value ?? lad;

    await supabase.from("hpi_cache").upsert({
      lad_code: key,
      lad_name: resolvedName,
      data: series,
      fetched_at: new Date().toISOString(),
    });

    return json({ lad: resolvedName, cached: false, series });
  } catch (e) {
    console.error("get-hpi error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
