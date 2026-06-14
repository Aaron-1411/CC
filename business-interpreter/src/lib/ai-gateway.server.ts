import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Provider-agnostic AI gateway. Configure via env to point at any
// OpenAI-compatible endpoint (OpenRouter, Together, Groq, a self-hosted
// gateway, etc). Defaults to OpenRouter so model slugs keep the
// `provider/model` format the rest of the app already uses.
const DEFAULT_GATEWAY_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

function resolveModel(modelId?: string): string {
  const fallback = process.env.AI_DEFAULT_MODEL ?? DEFAULT_MODEL;
  if (!modelId) return fallback;
  // Legacy gateway-specific preview slug isn't portable; map it to the default.
  if (modelId.startsWith("google/gemini-3")) return fallback;
  return modelId;
}

export function createAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: process.env.AI_GATEWAY_NAME ?? "ai-gateway",
    baseURL: process.env.AI_GATEWAY_URL ?? DEFAULT_GATEWAY_URL,
    apiKey,
  });
}

export function getAiModel(modelId?: string) {
  const key = process.env.AI_GATEWAY_API_KEY;
  if (!key) throw new Error("AI_GATEWAY_API_KEY is not configured");
  return createAiGatewayProvider(key)(resolveModel(modelId));
}
