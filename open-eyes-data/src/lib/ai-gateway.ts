const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callLovableAI(opts: {
  messages: AiMessage[];
  model?: string;
  temperature?: number;
  json?: boolean;
}): Promise<{ content: string }> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  const r = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-3-flash-preview",
      messages: opts.messages,
      temperature: opts.temperature ?? 0.3,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (r.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
  if (r.status === 402)
    throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI gateway ${r.status}: ${t.slice(0, 300)}`);
  }
  const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  return { content: j.choices?.[0]?.message?.content ?? "" };
}