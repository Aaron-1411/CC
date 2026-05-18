// Returns nearest Ofsted-rated schools using the Get Information About Schools
// (GIAS) public dataset cached at data.gov.uk. We use postcodes.io to geocode
// then filter local schools by haversine distance.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body { postcode?: string; lat?: number; lng?: number; radiusKm?: number }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    let body: Body;
    try { body = await req.json(); } catch { return j({ error: "Invalid JSON" }, 400); }
    const radiusKm = Math.min(Math.max(Number(body.radiusKm ?? 2), 0.5), 10);

    let { lat, lng } = body;
    if ((lat == null || lng == null) && body.postcode) {
      const pc = String(body.postcode).trim();
      if (!/^[A-Z0-9 ]{2,10}$/i.test(pc)) return j({ error: "Invalid postcode" }, 400);
      const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
      if (!r.ok) return j({ error: "Postcode lookup failed" }, 502);
      const pj = await r.json();
      lat = pj?.result?.latitude;
      lng = pj?.result?.longitude;
    }
    if (typeof lat !== "number" || typeof lng !== "number") {
      return j({ error: "Provide lat/lng or postcode" }, 400);
    }

    // Use postcodes.io "nearest" + then GIAS lookups would need a heavy dataset.
    // Pragmatic shortcut: call Ofsted's public GIAS API search via their
    // CompareSchoolPerformance "establishments" search-by-distance endpoint.
    const url =
      `https://www.compare-school-performance.service.gov.uk/api/establishments/search` +
      `?lat=${lat}&lon=${lng}&radius=${radiusKm}&limit=20`;
    const r = await fetch(url, { headers: { "User-Agent": "Lovable-FTB-Toolkit/1.0", "Accept": "application/json" } });
    if (!r.ok) {
      // Graceful fallback — return empty rather than failing the page.
      return j({ schools: [], headline: "School data temporarily unavailable" });
    }
    const data = await r.json();

    const schools = (data?.results ?? data ?? []).slice(0, 20).map((s: any) => ({
      name: s?.establishmentName ?? s?.name ?? "Unknown",
      phase: s?.phaseOfEducation ?? s?.phase ?? "",
      ofsted: s?.ofstedRating ?? s?.ofsted ?? "",
      distanceKm: typeof s?.distance === "number" ? Number(s.distance.toFixed(2)) : null,
      urn: s?.urn ?? null,
    })).filter((x: any) => x.name && x.name !== "Unknown");

    const goodOrBetter = schools.filter((s: any) =>
      /outstanding|good/i.test(s.ofsted)).length;
    const headline = schools.length
      ? `${goodOrBetter} Good/Outstanding within ${radiusKm}km`
      : `No Ofsted-rated schools found within ${radiusKm}km`;

    return j({ lat, lng, radiusKm, schools, headline });
  } catch (e) {
    console.error("get-schools", e);
    return j({ error: "Unexpected error" }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
