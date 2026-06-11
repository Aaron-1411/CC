// Cloudflare Pages bindings available at request time via
// `getRequestContext().env` (see src/lib/db.ts and src/lib/cf-env.ts).
// String secrets are also mirrored onto `process.env` by next-on-pages.
interface CloudflareEnv {
  /** KV namespace backing the whole data layer (one JSON array per "table"). */
  BCC_KV: KVNamespace;
  /** Anthropic API key — powers the audit and all seven agents. */
  ANTHROPIC_API_KEY: string;
  /** Optional model override (defaults to claude-opus-4-7). */
  ANTHROPIC_MODEL?: string;
}
