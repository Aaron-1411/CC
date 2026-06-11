import Anthropic from "@anthropic-ai/sdk";
import { cfEnv } from "./cf-env";

// 90s timeout + 3 retries with exponential backoff (the SDK retries transient
// 429/5xx/network errors with backoff automatically).
const TIMEOUT_MS = 90_000;
const MAX_RETRIES = 3;

// Default to the current flagship. Override per-deployment with ANTHROPIC_MODEL
// (e.g. claude-sonnet-4-6 to cut cost on high-volume schedules).
const DEFAULT_MODEL = "claude-opus-4-7";

export function getModel(): string {
  return cfEnv("ANTHROPIC_MODEL") || DEFAULT_MODEL;
}

export function hasApiKey(): boolean {
  return Boolean(cfEnv("ANTHROPIC_API_KEY"));
}

/** Adaptive thinking is only valid on these model families; gate to avoid 400s. */
function supportsAdaptiveThinking(model: string): boolean {
  return /opus-4-(6|7)|sonnet-4-6/.test(model);
}

let client: Anthropic | null = null;

export function getClaude(): Anthropic {
  const apiKey = cfEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env (get one at https://console.anthropic.com) to run agents.",
    );
  }
  if (!client) {
    client = new Anthropic({
      apiKey,
      timeout: TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
    });
  }
  return client;
}

export interface RunOptions {
  /** Agent-specific instructions (volatile — changes per agent/run). */
  system: string;
  /**
   * Stable system prefix (the brand-context block). Rendered first with a
   * prompt-cache breakpoint so repeated agent runs for the same brand reuse it
   * at ~10% of the input cost. Must be ≥ ~1024 tokens to actually cache;
   * shorter prefixes simply pass through uncached (no error).
   */
  cacheableSystem?: string;
  prompt: string;
  maxTokens?: number;
  webSearch?: boolean;
  maxSearches?: number;
  /** Enable adaptive thinking where the model supports it. */
  thinking?: boolean;
}

/** Run a single completion and return the concatenated text content. */
export async function runCompletion(opts: RunOptions): Promise<string> {
  const claude = getClaude();
  const model = getModel();

  const tools = opts.webSearch
    ? [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: opts.maxSearches ?? 5,
        },
      ]
    : undefined;

  // Prompt caching: stable prefix first (with breakpoint), volatile after.
  const system: string | Anthropic.TextBlockParam[] = opts.cacheableSystem
    ? [
        {
          type: "text",
          text: opts.cacheableSystem,
          cache_control: { type: "ephemeral" },
        },
        { type: "text", text: opts.system },
      ]
    : opts.system;

  const useThinking = Boolean(opts.thinking) && supportsAdaptiveThinking(model);

  const res = await claude.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 4000,
    system,
    // web_search is a server-side tool; cast keeps us version-tolerant.
    tools: tools as unknown as Anthropic.Tool[] | undefined,
    ...(useThinking ? { thinking: { type: "adaptive" } } : {}),
    messages: [{ role: "user", content: opts.prompt }],
  });

  const u = res.usage as unknown as {
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  if (process.env.DEBUG_CLAUDE && u) {
    console.debug(
      `[claude] ${model} cache read=${u.cache_read_input_tokens ?? 0} write=${u.cache_creation_input_tokens ?? 0}`,
    );
  }

  return res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n")
    .trim();
}

/**
 * Pull the first JSON value out of a model response, tolerating markdown
 * fences and surrounding prose. Throws if nothing parseable is found.
 */
export function extractJson<T>(text: string): T {
  let s = text.trim();

  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();

  const firstObj = s.indexOf("{");
  const firstArr = s.indexOf("[");
  let start: number;
  if (firstArr === -1) start = firstObj;
  else if (firstObj === -1) start = firstArr;
  else start = Math.min(firstObj, firstArr);
  if (start === -1) throw new Error("No JSON found in model response.");

  const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (end === -1 || end < start) throw new Error("Malformed JSON in model response.");

  return JSON.parse(s.slice(start, end + 1)) as T;
}
