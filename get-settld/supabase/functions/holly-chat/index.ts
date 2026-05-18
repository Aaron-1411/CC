// Holly — UK first-time buyer AI guide. Streams via Lovable AI Gateway.
// Context-aware: receives the page slug + a short page hint from the client,
// and uses it to anchor answers. Plain-English, never regulated advice.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are Holly — a friendly, plain-English UK property guide for first-time buyers.

Rules you must follow:
- You explain processes, terminology, typical timelines, and what to expect.
- You DO NOT give regulated financial, mortgage, legal, or tax advice. If asked, say so kindly and suggest speaking to a qualified broker, solicitor or accountant.
- Use UK terms and £ sterling. Be region-aware: England/NI use SDLT, Scotland uses LBTT, Wales uses LTT.
- Keep answers short and scannable. Prefer 2–4 short paragraphs or a tight bullet list. No walls of text.
- Be honest about uncertainty. If a number depends on circumstances, say "typically" with a range.
- Tone: warm, encouraging, never patronising. Assume the user is smart but new to buying.
- If the user is on a specific page of the toolkit, refer to that page's tool when it would help (e.g. "open the True Cost calculator").
- Never invent rates, fees, or rules. If you don't know a current figure, say so.`;

interface ChatBody {
  messages: { role: "user" | "assistant"; content: string }[];
  pageSlug?: string;
  pageHint?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, pageSlug, pageHint } = (await req.json()) as ChatBody;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Trim runaway history; keep last 20 turns.
    const trimmed = messages.slice(-20).map((m) => ({
      role: m.role,
      content: String(m.content ?? "").slice(0, 4000),
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contextNote = pageSlug
      ? `\n\nThe user is currently on the "${pageSlug}" page of the toolkit.${
          pageHint ? ` Page summary: ${pageHint.slice(0, 400)}` : ""
        } If relevant, weave that into your answer.`
      : "";

    const upstream = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          stream: true,
          messages: [
            { role: "system", content: SYSTEM + contextNote },
            ...trimmed,
          ],
        }),
      },
    );

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(
          JSON.stringify({ error: "Holly is busy right now. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (upstream.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted on this workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await upstream.text();
      console.error("gateway error", upstream.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("holly-chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
