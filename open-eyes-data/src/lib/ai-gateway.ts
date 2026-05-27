/**
 * AI gateway with two backends:
 *   1. Anthropic Claude (ANTHROPIC_API_KEY) — primary, direct API
 *   2. Lovable AI Gateway (LOVABLE_API_KEY) — fallback when running in Lovable
 *
 * Set at least one in your environment / Netlify env vars.
 */

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

// ─── Anthropic Claude ─────────────────────────────────────────────────────────

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
      temperature: opts.temperature ?? 0.3,
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

// ─── Lovable AI Gateway (OpenAI-compatible) ───────────────────────────────────

async function callLovableGateway(opts: {
  messages: AiMessage[];
  temperature?: number;
  json?: boolean;
  key: string;
}): Promise<{ content: string }> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${opts.key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: opts.messages,
      temperature: opts.temperature ?? 0.3,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (r.status === 429) throw new Error("AI rate limit reached — try again shortly.");
  if (r.status === 402) throw new Error("AI credits exhausted. Add credits in your Lovable workspace.");
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI gateway ${r.status}: ${t.slice(0, 300)}`);
  }

  const j = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return { content: j.choices?.[0]?.message?.content ?? "" };
}

// ─── Public interface ─────────────────────────────────────────────────────────

/** Kept for compatibility — calls the unified callAI function below */
export async function callLovableAI(opts: {
  messages: AiMessage[];
  model?: string;
  temperature?: number;
  json?: boolean;
}): Promise<{ content: string }> {
  return callAI(opts);
}

export async function callAI(opts: {
  messages: AiMessage[];
  temperature?: number;
  json?: boolean;
}): Promise<{ content: string }> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return callAnthropic({ messages: opts.messages, temperature: opts.temperature, key: anthropicKey });
  }

  const lovableKey = process.env.LOVABLE_API_KEY;
  if (lovableKey) {
    return callLovableGateway({ messages: opts.messages, temperature: opts.temperature, json: opts.json, key: lovableKey });
  }

  throw new Error(
    "AI briefings require an API key. Set ANTHROPIC_API_KEY (recommended) or LOVABLE_API_KEY in your environment variables.",
  );
}
