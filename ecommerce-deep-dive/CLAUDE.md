# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install                        # install deps
bun run dev                        # local dev server (localhost:3000)
bunx @cloudflare/next-on-pages     # build for Cloudflare Pages (outputs .vercel/output/static)
```

Env var required locally: `GEMINI_API_KEY` — set in `.env`.

## Architecture

Next.js 16 App Router, TypeScript, Tailwind CSS 4. Deployed to Cloudflare Pages via `@cloudflare/next-on-pages`.

**All API routes must have `export const runtime = 'edge'`** — required for Cloudflare Pages.

### Key files

- `src/lib/claude.ts` — Gemini AI integration. `runPillarAnalysis()` calls `gemini-2.0-flash` with `googleSearchRetrieval` grounding. `withRetry()` handles 429s with 15s/30s/45s backoff. `extractJSON()` strips markdown fences and finds first `{...}` block.
- `src/lib/pillars.ts` — 13 pillars + `PILLAR_ORDER` (priority sequence) + `getPillarChecklist()`.
- `src/lib/store.ts` — In-memory `Map`-based job store (resets on cold start).
- `src/lib/report.ts` — `.docx` export via `docx` package. Use `ShadingType.CLEAR`, `columnWidths` on Table + `width` on each `TableCell`, `insideHorizontal`/`insideVertical` (not `insideH`/`insideV`).
- `src/lib/deck.ts` — `.pptx` export via `pptxgenjs`. No `#` on hex colours. Use `makeShadow()` factory (fresh object per call).
- `src/app/api/analyse/route.ts` — POST, starts a background job, returns `{ jobId }`.
- `src/app/api/status/[jobId]/route.ts` — SSE stream of pillar results as they complete.
- `src/types/analysis.ts` — `PillarResult`, `AuditJob`, `OpportunityMatrix` types.

### Flow

1. User POSTs URL → `/api/analyse` → creates job in store, fires background async work.
2. Frontend polls `/api/status/[jobId]` via SSE — receives pillar results one-by-one as they complete.
3. All 13 pillars done → opportunity matrix built → job marked complete.
4. User downloads `.docx` or `.pptx` from `/api/download/[jobId]?type=word|pptx`.

### Gemini notes

- Model: `gemini-2.0-flash` (1,500 req/day free tier).
- `googleSearchRetrieval` is the correct tool name for 2.0-flash (not `googleSearch`).
- `buildOpportunityMatrix()` does NOT use search grounding.
