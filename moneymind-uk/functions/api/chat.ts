// Cloudflare Pages Function — AI tutor proxy for MoneyMind UK.
//
// Route: POST /api/chat
// Body:  { moduleId: number, messages: { role: 'user' | 'assistant', content: string }[] }
//
// The client NEVER talks to Anthropic directly and never sends a system prompt.
// We look the module's vetted `tutorSystemPrompt` up server-side by id, so the
// guardrails (UK-only, no regulated advice, on-topic) cannot be tampered with.
// ANTHROPIC_API_KEY lives only in the Pages environment (context.env).

import { modules } from "../../src/content/modules";
import type { CourseModule } from "../../src/lib/types";

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;
const MAX_MESSAGES = 20; // keep the most recent turns
const MAX_CONTENT_CHARS = 4000; // per message, to bound cost/abuse

const FRIENDLY_FALLBACK =
  "Sorry — I couldn't reach the tutor just now. Please try again in a moment. " +
  "In the meantime, the lesson and the official gov.uk links on this page have you covered.";

// Fallback guardrails if an unknown module id is sent.
const GENERIC_SYSTEM_PROMPT =
  "You are MoneyMind, a friendly UK personal finance expert. Answer in plain " +
  "English using current UK figures and real examples. Never give regulated " +
  "financial advice — recommend a qualified IFA or gov.uk for personal decisions. " +
  "Keep answers to 3–5 sentences unless more detail is requested.";

// Best-effort, per-isolate IP rate limiting. NOTE: Workers isolates are
// ephemeral and not shared, so this only blunts bursts from a single client on
// a single edge. TODO: move to KV or a Durable Object for durable limits.
const RATE_LIMIT = 30; // requests
const RATE_WINDOW_MS = 60_000; // per minute
const buckets = new Map<string, { count: number; reset: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now > bucket.reset) {
    buckets.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const cleaned: ChatMessage[] = [];
  for (const m of input) {
    if (!m || typeof m !== "object") continue;
    const role = (m as ChatMessage).role;
    const content = (m as ChatMessage).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const trimmed = content.trim();
    if (!trimmed) continue;
    cleaned.push({ role, content: trimmed.slice(0, MAX_CONTENT_CHARS) });
  }
  return cleaned.slice(-MAX_MESSAGES);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (isRateLimited(ip)) {
    return json(
      { reply: "You're sending messages very quickly — give it a few seconds and try again." },
      429,
    );
  }

  let payload: { moduleId?: unknown; messages?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ reply: "That request didn't look right. Please reload and try again.", error: "invalid_json" }, 400);
  }

  const messages = sanitizeMessages(payload.messages);
  if (messages.length === 0) {
    return json({ reply: "Ask me anything about this topic to get started.", error: "no_messages" }, 400);
  }

  const moduleId = Number(payload.moduleId);
  const courseModule = modules.find((m: CourseModule) => m.id === moduleId);
  const systemPrompt = courseModule?.tutorSystemPrompt ?? GENERIC_SYSTEM_PROMPT;

  if (!env.ANTHROPIC_API_KEY) {
    // Misconfiguration, not the user's fault — stay friendly.
    return json(
      {
        reply:
          "The AI tutor isn't switched on yet for this site. The lessons, quizzes, tools and gov.uk links all work — the tutor will come online once the key is configured.",
        error: "missing_api_key",
      },
      503,
    );
  }

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return json({ reply: FRIENDLY_FALLBACK, error: `upstream_${upstream.status}`, detail: detail.slice(0, 500) }, 502);
    }

    const data = (await upstream.json()) as {
      content?: { type: string; text?: string }[];
    };
    const reply =
      data.content
        ?.filter((block) => block.type === "text" && typeof block.text === "string")
        .map((block) => block.text)
        .join("\n")
        .trim() || FRIENDLY_FALLBACK;

    return json({ reply });
  } catch {
    return json({ reply: FRIENDLY_FALLBACK, error: "fetch_failed" }, 502);
  }
};
