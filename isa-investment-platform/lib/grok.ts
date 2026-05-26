/**
 * xAI Grok client — OpenAI-compatible API, no extra SDK needed.
 * Uses fetch directly. Server-only.
 */

const BASE = "https://api.x.ai/v1";

export function getGrokKey(): string {
  return process.env.XAI_API_KEY ?? "";
}

export function hasGrokKey(): boolean {
  return Boolean(getGrokKey());
}

export interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Stream a Grok chat completion as a ReadableStream of SSE chunks.
 * Each yielded chunk is a raw SSE line: `data: {...}\n\n`
 * The caller is responsible for piping this into a Response.
 */
export async function streamGrok(
  messages: GrokMessage[],
  model: "grok-3" | "grok-3-mini" | "grok-2-1212" = "grok-3",
  maxTokens = 1800
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getGrokKey();
  if (!apiKey) throw new Error("XAI_API_KEY not configured");

  const response = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Grok API error ${response.status}: ${err}`);
  }

  const encoder = new TextEncoder();
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  // Transform xAI SSE stream → our own SSE format { text } / { done } / { error }
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
            return;
          }
          try {
            const parsed = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Stream an Anthropic Claude completion as a ReadableStream of SSE chunks.
 * Extracts system messages from the messages array automatically.
 * Output format identical to streamGrok: { text } / { done } / { error }.
 */
export async function streamAnthropic(
  messages: GrokMessage[],
  maxTokens = 1800
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const systemContent = messages
    .filter(m => m.role === "system")
    .map(m => m.content)
    .join("\n\n");
  const chatMessages = messages.filter(m => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      stream: true,
      ...(systemContent ? { system: systemContent } : {}),
      messages: chatMessages,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const encoder = new TextEncoder();
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          try {
            const parsed = JSON.parse(payload) as {
              type?: string;
              delta?: { type?: string; text?: string };
            };
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`)
              );
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

/** SSE response headers shared by both AI routes */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;
