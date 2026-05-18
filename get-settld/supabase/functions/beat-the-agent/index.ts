// Adversarial buyer-side question generator.
// Calls Lovable AI Gateway with gemini-2.5-flash for speed.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { listing, askingPrice } = await req.json();
    if (!listing || typeof listing !== "string") {
      return new Response(JSON.stringify({ error: "listing required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const sys = `You are a UK first-time buyer's adversarial advisor. Your job is to generate the 12 most pointed questions a buyer should ask the estate agent — questions agents typically deflect. Focus on: price negotiation room, days on market, prior price drops, chain status & break risk, vendor motivation, EPC vs claimed bills, lease/ground rent/service-charge gotchas, planning around the corner, neighbour disputes, condition red flags (subsidence/damp/knotweed/cladding), inclusions, and source-of-funds checks. Be specific to the listing. Return ONLY a JSON array of 12 strings.`;

    const userMsg = `Listing:\n${listing}\n\n${askingPrice ? `Asking price: £${askingPrice}` : ""}\n\nReturn JSON: {"questions": ["...", "..."]}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
        response_format: { type: "json_object" },
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      return new Response(JSON.stringify({ error: "ai", detail: txt }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await r.json();
    const content = j?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { questions?: string[] } = {};
    try { parsed = JSON.parse(content); } catch { parsed = { questions: [] }; }
    return new Response(JSON.stringify({ questions: parsed.questions ?? [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
