import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { callAI } from "@/lib/ai-gateway";
import { envelope, errorResponse, jsonResponse, rateLimit, clientKey } from "@/lib/proxy";
import { ISSUES, ISSUE_KEYS } from "@/data/issues";
import { PARTIES, PLEDGES } from "@/data/parties";
import { getSource } from "@/contract/sources";
import { formatStatValue } from "@/contract/stats";

/**
 * Closed-book AI briefing (WS7). The model answers ONLY from the cached
 * official data already on transparenC — the issue headline stats (with their
 * sources) and the tracked party pledges — never the open web. Every answer
 * must cite the source + as-of date for each figure and end with a sources list.
 */

const SYSTEM = `You are the briefing tool for transparenC, a non-partisan UK government accountability site. You answer ONLY from the JSON context provided in this request.
Rules:
(1) Every figure you state must come from the context and must be immediately followed by its source name and asOf date in brackets, e.g. "171,000 (ONS Long-Term International Migration, Dec 2025)".
(2) If the context does not contain the data needed to answer, say exactly what is missing and point the user to the most relevant transparenC page — never estimate, never use outside knowledge for figures, names, or dates.
(3) Use plain English at a reading age of about 12.
(4) Apply identical tone to all parties and individuals: no adjectives implying praise or blame; let the figures speak.
(5) Do not speculate about motive, character, or future events.
(6) Output valid markdown: a one-line headline, a 2-3 sentence summary, then "## What the data shows" (bullets) and "## Sources" (a bullet list of the source names and URLs you used).
(7) End with: "AI-generated from cached official data — verify against the linked sources before sharing."
Keep under 400 words.`;

/** Assemble the cached official data the model is allowed to use. */
function buildContext() {
  const issues = ISSUE_KEYS.map((k) => {
    const def = ISSUES[k];
    const s = def.headlineStat;
    const src = getSource(s.sourceId);
    return {
      issue: def.title,
      question: def.question,
      headline: {
        value: formatStatValue(s),
        label: s.label,
        source: src.name,
        sourceUrl: s.sourceUrl,
        asOf: s.asOf,
      },
      context: def.keyFactContext,
    };
  });

  const pledges = Object.entries(PLEDGES).flatMap(([partyId, list]) =>
    list.map((p) => ({
      party: PARTIES.find((pt) => pt.id === partyId)?.name ?? partyId,
      issue: p.issue,
      promise: p.promise,
      status: p.status,
      detail: p.detail ?? null,
      source: p.sourceLabel ?? null,
      sourceUrl: p.sourceUrl ?? null,
    })),
  );

  return { issues, pledges };
}

export const Route = createFileRoute("/api/briefing")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Abuse/cost guard: this endpoint triggers a paid LLM call. Limit per IP.
          // (Per-isolate; a global KV/DO limiter is a documented launch-config task.)
          if (!rateLimit(`briefing:${clientKey(request)}`, 8, 60_000)) {
            return errorResponse("Too many briefings — please wait a minute and try again.", 429);
          }
          const { topic } = (await request.json()) as { topic?: string };
          if (!topic || topic.trim().length < 2) return errorResponse("topic is required", 400);

          const context = buildContext();
          const { content } = await callAI({
            messages: [
              { role: "system", content: SYSTEM },
              {
                role: "user",
                content: `CONTEXT (the only data you may use):\n${JSON.stringify(
                  context,
                )}\n\nUser question: ${topic.trim()}`,
              },
            ],
          });

          return jsonResponse(
            envelope(
              { topic: topic.trim(), markdown: content },
              "AI-generated from transparenC's cached official data (Anthropic Claude)",
              "https://www.anthropic.com",
              "AI-generated — verify against the linked sources before sharing",
            ),
          );
        } catch (e) {
          return errorResponse((e as Error).message);
        }
      },
    },
  },
});
