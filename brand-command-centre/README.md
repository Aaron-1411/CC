# Brand Command Centre

A B2B marketing platform with two modes:

- **Audit** — paste a brand URL and get a 13-pillar gap analysis (foundations → retention), scored RAG, with a prioritised opportunity matrix. Each opportunity is tied to the agent that can act on it.
- **Execute** — seven specialist AI agents (Content, Social, Ads, Email, Reviews, Promo, Intel) draft work that lands in an approval inbox. You review, edit inline, and approve — or let a fully-autonomous agent publish directly.

Built with Next.js 16 (App Router) and Claude (Anthropic SDK), deployed to Cloudflare Pages on the edge runtime.

## Architecture

| Concern | Choice | Notes |
| --- | --- | --- |
| Runtime | Cloudflare Pages + `@cloudflare/next-on-pages` | Every route is `export const runtime = "edge"`. |
| Data | Cloudflare KV (`BCC_KV`) | `src/lib/db.ts` is a Prisma-shaped facade over KV — one JSON array per "table". |
| LLM | Claude via `@anthropic-ai/sdk` | `claude-opus-4-7` by default; prompt caching on the brand-context prefix. |
| Secrets | CF Pages env vars | `ANTHROPIC_API_KEY` (set in CI), optional `ANTHROPIC_MODEL`. |

There is no database server, no filesystem and no in-process scheduler — all three are incompatible with the edge runtime. Agents run on demand from the Agents tab (or the `/api/agents/run` route).

## Local development

```bash
bun install
bun dev          # http://localhost:3000 — KV is replaced by an in-memory map
```

Create a `.env` with `ANTHROPIC_API_KEY=...` to run the audit and agents locally.

## Build (Cloudflare edge output)

```bash
bunx @cloudflare/next-on-pages   # emits .vercel/output/static
```

## Deploy

Pushing to `master` triggers `.github/workflows/deploy.yml`, which ensures the
Pages project + KV namespace exist, wires the `BCC_KV` binding and
`ANTHROPIC_API_KEY`, builds with next-on-pages, and deploys to
`ecommerce-deep-dive-app.pages.dev`.
