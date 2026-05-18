// Generates a short, plain-English narrative explaining the verdict.
// Auth-gated and validated to prevent abuse of AI credits.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_VERDICT = `You are a friendly UK first-time buyer adviser. Given a property verdict, write 2 to 3 short sentences (max ~70 words total) explaining in plain English what the verdict means and the single most important reason. No jargon. No bullet points. No markdown. Direct, warm, second person ("you").`;
const SYSTEM_AREA = `You are a friendly UK first-time buyer adviser. Given a snapshot of an area (transport, schools, crime, prices, growth), write 2 to 3 short sentences (max ~70 words) telling a first-time buyer what it's actually like to live there and whether it suits someone trying to get on the ladder. Plain English, no jargon, no markdown, second person ("you").`;
const SYSTEM = SYSTEM_VERDICT;

interface Factor { label: string; light: string; headline: string }

function validate(body: unknown): { ok: true; v: NarrativeRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;
  if (b.overall !== "green" && b.overall !== "amber" && b.overall !== "red" && b.overall !== "area") {
    return { ok: false, error: "Missing or invalid 'overall'" };
  }
  if (typeof b.oneLiner !== "string" || b.oneLiner.length === 0 || b.oneLiner.length > 1000) {
    return { ok: false, error: "Invalid 'oneLiner'" };
  }
  const numOrU = (k: string) => {
    if (b[k] === undefined || b[k] === null) return undefined;
    const n = Number(b[k]);
    return Number.isFinite(n) && n >= 0 && n < 1e10 ? n : undefined;
  };
  let factors: Factor[] | undefined;
  if (Array.isArray(b.factors)) {
    factors = b.factors.slice(0, 12).map((f: any) => ({
      label: String(f?.label ?? "").slice(0, 80),
      light: String(f?.light ?? "").slice(0, 20),
      headline: String(f?.headline ?? "").slice(0, 200),
    }));
  }
  return {
    ok: true,
    v: {
      overall: b.overall,
      oneLiner: b.oneLiner,
      postcode: typeof b.postcode === "string" ? b.postcode.slice(0, 10) : undefined,
      askingPrice: numOrU("askingPrice"),
      monthlyPayment: numOrU("monthlyPayment"),
      upfrontCash: numOrU("upfrontCash"),
      avmP50: numOrU("avmP50"),
      factors,
    },
  };
}

interface NarrativeRequest {
  overall: "green" | "amber" | "red" | "area";
  oneLiner: string;
  postcode?: string;
  askingPrice?: number;
  monthlyPayment?: number;
  upfrontCash?: number;
  avmP50?: number;
  factors?: Factor[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Sign in required" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: authErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !claims?.claims?.sub) return json({ error: "Sign in required" }, 401);

    let raw: unknown;
    try { raw = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    const parsed = validate(raw);
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    const v = parsed.v;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500);

    const userMsg = [
      `Verdict: ${v.overall.toUpperCase()}`,
      `Headline: ${v.oneLiner}`,
      v.postcode ? `Postcode: ${v.postcode}` : "",
      v.askingPrice ? `Asking: £${v.askingPrice.toLocaleString()}` : "",
      v.avmP50 ? `Estimated fair value: £${v.avmP50.toLocaleString()}` : "",
      v.monthlyPayment ? `Monthly mortgage: £${v.monthlyPayment.toLocaleString()}` : "",
      v.upfrontCash ? `Upfront cash needed: £${v.upfrontCash.toLocaleString()}` : "",
      v.factors?.length
        ? "Factors:\n" + v.factors.map((f) => `- ${f.label} (${f.light}): ${f.headline}`).join("\n")
        : "",
    ].filter(Boolean).join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: v.overall === "area" ? SYSTEM_AREA : SYSTEM_VERDICT },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limited" }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted" }, 402);
    if (!aiRes.ok) return json({ error: `AI error (${aiRes.status})` }, 502);

    const body = await aiRes.json();
    const text: string = body?.choices?.[0]?.message?.content?.trim() ?? "";
    return json({ narrative: text }, 200);
  } catch (e) {
    console.error("verdict-narrative error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
