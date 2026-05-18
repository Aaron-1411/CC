// Returns sold-price comparables for a UK postcode by querying the HM Land
// Registry Open Data SPARQL endpoint, then caches the result for 30 days.
//
// Lazy ingest model: we fetch only the postcode sector the user asked about
// (e.g. "N22 5"). Future Stage 4 work can switch to a nightly bulk ingest.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SPARQL = "https://landregistry.data.gov.uk/landregistry/query";

interface PricePaidRow {
  id: string;
  address: string;
  soldPrice: number;
  soldDate: string;
  postcode: string;
  propertyType: string;
  newBuild: boolean;
  tenure: "Freehold" | "Leasehold";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const raw =
      url.searchParams.get("postcode") ?? body.postcode ?? "";

    if (!raw || typeof raw !== "string") {
      return json({ error: "postcode required" }, 400);
    }

    const postcode = raw.trim().toUpperCase().replace(/\s+/g, " ");
    // Sector = outcode + first inward digit, e.g. "N22 5"
    const m = postcode.match(/^([A-Z]{1,2}\d[A-Z\d]?)\s?(\d)/);
    if (!m) return json({ error: "invalid postcode" }, 400);
    const sector = `${m[1]} ${m[2]}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: cached } = await supabase
      .from("comparables_cache")
      .select("data, fetched_at")
      .eq("postcode_area", sector)
      .maybeSingle();

    if (
      cached &&
      Date.now() - new Date(cached.fetched_at).getTime() < TTL_MS
    ) {
      return json({
        sector,
        cached: true,
        comparables: cached.data,
        count: (cached.data as unknown[]).length,
      });
    }

    const since = new Date();
    since.setMonth(since.getMonth() - 24);
    const sinceIso = since.toISOString().slice(0, 10);

    // SPARQL query against HMLR Price Paid Data.
    // Postcodes are LIKE-matched to the sector prefix; results capped to 200.
    const sparql = `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX ppd:  <http://landregistry.data.gov.uk/def/ppi/>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>

SELECT ?addr ?amount ?date ?pc ?type ?nb ?est WHERE {
  ?txn ppd:pricePaid ?amount ;
       ppd:transactionDate ?date ;
       ppd:propertyAddress ?a ;
       ppd:propertyType ?t ;
       ppd:newBuild ?nb ;
       ppd:estateType ?e .
  ?a lrcommon:postcode ?pc .
  OPTIONAL { ?a rdfs:label ?addr . }
  ?t rdfs:label ?type .
  ?e rdfs:label ?est .
  FILTER(STRSTARTS(STR(?pc), "${sector}"))
  FILTER(?date >= "${sinceIso}"^^<http://www.w3.org/2001/XMLSchema#date>)
}
ORDER BY DESC(?date)
LIMIT 200`;

    const r = await fetch(SPARQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/sparql-results+json",
        "User-Agent": "Lovable-FTB-Toolkit/1.0 (+https://lovable.dev)",
      },
      body: new URLSearchParams({ query: sparql }).toString(),
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("HMLR SPARQL failed", r.status, txt.slice(0, 300));
      return json(
        { error: `HMLR SPARQL ${r.status}`, detail: txt.slice(0, 200) },
        502,
      );
    }

    const j = await r.json();
    const rows: PricePaidRow[] = (j.results?.bindings ?? []).map(
      // deno-lint-ignore no-explicit-any
      (b: any, i: number) => ({
        id: `hmlr-${i}`,
        address: b.addr?.value ?? "Address withheld",
        soldPrice: Number(b.amount?.value ?? 0),
        soldDate: (b.date?.value ?? "").slice(0, 10),
        postcode: b.pc?.value ?? "",
        propertyType: b.type?.value ?? "Unknown",
        newBuild: b.nb?.value === "true",
        tenure: b.est?.value === "Leasehold" ? "Leasehold" : "Freehold",
      }),
    );

    await supabase.from("comparables_cache").upsert({
      postcode_area: sector,
      data: rows,
      fetched_at: new Date().toISOString(),
    });

    return json({
      sector,
      cached: false,
      comparables: rows,
      count: rows.length,
    });
  } catch (e) {
    console.error("get-comparables error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
