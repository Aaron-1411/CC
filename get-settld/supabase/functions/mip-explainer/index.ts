// Generates a tailored next-steps explanation for an MIP readiness result.
// Auth-gated; rule-based scoring is done client-side, this just narrates.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "auth required" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const { result, inputs } = body ?? {};
    if (!result || !inputs) return json({ error: "result and inputs required" }, 400);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "AI not configured" }, 500);

    const prompt = `You are a UK mortgage adviser. Explain in plain English (3 short paragraphs, max 150 words total) the user's MIP readiness:
- One paragraph on what their result means.
- One paragraph on the single biggest blocker and how to fix it.
- One paragraph on the next 1-2 actions (e.g. specific lender to try, or broker route).
Do NOT give regulated advice; end with: "This is guidance, not a regulated recommendation."

Inputs: ${JSON.stringify(inputs)}
Result: lendersLikely=${result.lendersLikely}, borderline=${result.lendersBorderline}, unlikely=${result.lendersUnlikely}, maxBorrow=£${result.estimatedMaxBorrow}, LTV=${(result.ltv*100).toFixed(0)}%
Flags: ${(result.flags ?? []).join("; ")}
Strengths: ${(result.strengths ?? []).join("; ")}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (r.status === 429) return json({ error: "Rate limit — try again shortly." }, 429);
    if (r.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!r.ok) return json({ error: `AI error ${r.status}` }, 502);

    const j = await r.json();
    const text = j.choices?.[0]?.message?.content ?? "";
    return json({ explanation: text });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
