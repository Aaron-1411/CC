// Generates a punchy list of "questions to ask the estate agent or vendor"
// tailored to the property's flagged risks, lease, EPC and price position.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  postcode?: string;
  askingPrice?: number;
  beds?: number;
  sqft?: number;
  tenure?: "freehold" | "leasehold";
  leaseYears?: number;
  epc?: string;
  flags?: string[]; // e.g. ["overpriced", "high-flood", "old-lease"]
}

const SYSTEM = `You are a sharp, friendly UK buyer's adviser. Given a property summary, return ONLY a JSON object: { "questions": string[] } with 8-12 specific questions the buyer should ask the estate agent or vendor before offering. Practical, polite, in plain English. No preamble. No markdown.`;

function validate(b: unknown): { ok: true; v: Body } | { ok: false; error: string } {
  if (!b || typeof b !== "object") return { ok: false, error: "Invalid body" };
  const o = b as Record<string, unknown>;
  const num = (k: string) => {
    const n = Number(o[k]);
    return Number.isFinite(n) && n >= 0 && n < 1e10 ? n : undefined;
  };
  return {
    ok: true,
    v: {
      postcode: typeof o.postcode === "string" ? o.postcode.slice(0, 10) : undefined,
      askingPrice: num("askingPrice"),
      beds: num("beds"),
      sqft: num("sqft"),
      tenure: o.tenure === "freehold" || o.tenure === "leasehold" ? o.tenure : undefined,
      leaseYears: num("leaseYears"),
      epc: typeof o.epc === "string" ? o.epc.slice(0, 4) : undefined,
      flags: Array.isArray(o.flags) ? o.flags.slice(0, 20).map((x) => String(x).slice(0, 80)) : undefined,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return j({ error: "Sign in required" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (error || !claims?.claims?.sub) return j({ error: "Sign in required" }, 401);

    let raw: unknown;
    try { raw = await req.json(); } catch { return j({ error: "Invalid JSON" }, 400); }
    const parsed = validate(raw);
    if (!parsed.ok) return j({ error: parsed.error }, 400);
    const v = parsed.v;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return j({ error: "AI not configured" }, 500);

    const userMsg = [
      v.postcode ? `Postcode: ${v.postcode}` : "",
      v.askingPrice ? `Asking: £${v.askingPrice.toLocaleString()}` : "",
      v.beds ? `Beds: ${v.beds}` : "",
      v.sqft ? `Floor area: ${v.sqft} sqft` : "",
      v.tenure ? `Tenure: ${v.tenure}` : "",
      v.leaseYears ? `Lease years remaining: ${v.leaseYears}` : "",
      v.epc ? `EPC: ${v.epc}` : "",
      v.flags?.length ? `Flags: ${v.flags.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg || "Generic UK first-time buyer questions for a typical urban flat." },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (aiRes.status === 429) return j({ error: "Rate limited" }, 429);
    if (aiRes.status === 402) return j({ error: "AI credits exhausted" }, 402);
    if (!aiRes.ok) return j({ error: `AI error (${aiRes.status})` }, 502);

    const body = await aiRes.json();
    const content: string = body?.choices?.[0]?.message?.content ?? "{}";
    let parsedJson: { questions?: unknown } = {};
    try { parsedJson = JSON.parse(content); } catch { /* noop */ }
    const questions = Array.isArray(parsedJson.questions)
      ? parsedJson.questions.slice(0, 15).map((q) => String(q).slice(0, 300))
      : [];
    return j({ questions });
  } catch (e) {
    console.error("agent-questions error", e);
    return j({ error: "Unexpected error" }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
