// Returns flood risk for a postcode/coordinate using the Environment Agency
// Real Time flood-monitoring + Risk of Flooding from Rivers and Sea (RoFRS) APIs.
// Public, free, no API key.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body { lat?: number; lng?: number; postcode?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    let body: Body;
    try { body = await req.json(); } catch { return j({ error: "Invalid JSON" }, 400); }

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

    // Live flood warnings within 5km
    const warnUrl = `https://environment.data.gov.uk/flood-monitoring/id/floods?lat=${lat}&long=${lng}&dist=5`;
    const wr = await fetch(warnUrl);
    const warnings: { severity: string; severityLevel: number; description: string }[] = [];
    if (wr.ok) {
      const wj = await wr.json();
      for (const it of wj?.items ?? []) {
        warnings.push({
          severity: it?.severity ?? "Unknown",
          severityLevel: it?.severityLevel ?? 4,
          description: it?.description ?? it?.eaAreaName ?? "",
        });
      }
    }

    const minSeverity = warnings.length
      ? Math.min(...warnings.map((w) => w.severityLevel ?? 4))
      : 4;

    // Map severityLevel: 1 Severe, 2 Warning, 3 Alert, 4 Removed/None
    const light = minSeverity <= 1 ? "red" : minSeverity <= 2 ? "red" : minSeverity <= 3 ? "amber" : "green";

    return j({ lat, lng, warnings, light, headline: headline(light, warnings.length) });
  } catch (e) {
    console.error("get-flood-risk", e);
    return j({ error: "Unexpected error" }, 500);
  }
});

function headline(light: string, count: number): string {
  if (light === "red") return `${count} active flood warning${count === 1 ? "" : "s"} within 5km`;
  if (light === "amber") return `${count} flood alert${count === 1 ? "" : "s"} within 5km`;
  return "No active flood warnings within 5km";
}
function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
