/**
 * AI gateway — Anthropic Claude only (decision D9).
 *
 * The previous Lovable/Gemini fallback was removed so provenance is always
 * accurate and the trust story is simple: one provider, one key, server-side.
 * The key is read from the Worker environment and never reaches the client.
 */

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

async function callAnthropic(opts: {
  messages: AiMessage[];
  temperature?: number;
  key: string;
}): Promise<{ content: string }> {
  const system = opts.messages.find((m) => m.role === "system")?.content ?? "";
  const userMessages = opts.messages.filter((m) => m.role !== "system");

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": opts.key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system,
      messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature ?? 0.2,
    }),
  });

  if (r.status === 429) throw new Error("AI rate limit reached — try again shortly.");
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Anthropic API ${r.status}: ${t.slice(0, 300)}`);
  }

  const j = (await r.json()) as { content?: Array<{ type: string; text: string }> };
  return { content: j.content?.find((b) => b.type === "text")?.text ?? "" };
}

export async function callAI(opts: {
  messages: AiMessage[];
  temperature?: number;
}): Promise<{ content: string }> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    throw new Error(
      "AI briefings are unavailable: ANTHROPIC_API_KEY is not configured on the server.",
    );
  }
  return callAnthropic({
    messages: opts.messages,
    temperature: opts.temperature,
    key: anthropicKey,
  });
}
