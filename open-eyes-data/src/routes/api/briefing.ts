import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { callLovableAI } from "@/lib/ai-gateway";
import { envelope, errorResponse, jsonResponse } from "@/lib/proxy";

const SYSTEM = `You are a non-partisan UK government accountability analyst writing for transparenC.
Produce concise, factual briefings on UK politics, government performance, public spending and accountability.
Rules:
- Always name specific ministers, departments, and policies.
- Cite real figures with units (£, %, dates) and the year/period.
- Be neutral: present evidence, criticism and government response.
- If recent data is uncertain, say so explicitly — never invent figures.
- Output valid markdown with: a one-line headline, a 3-4 sentence summary, then "## Key facts" (bullets), "## Who is responsible" (bullets), "## What to watch".
- Keep under 450 words.`;

export const Route = createFileRoute("/api/briefing")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { topic } = (await request.json()) as { topic?: string };
          if (!topic || topic.trim().length < 2)
            return errorResponse("topic is required", 400);
          const { content } = await callLovableAI({
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: `Briefing topic: ${topic.trim()}` },
            ],
          });
          return jsonResponse(
            envelope(
              { topic: topic.trim(), markdown: content },
              "Lovable AI Gateway (Gemini)",
              "https://ai.gateway.lovable.dev",
              "AI-generated; verify against primary sources",
            ),
          );
        } catch (e) {
          return errorResponse((e as Error).message);
        }
      },
    },
  },
});