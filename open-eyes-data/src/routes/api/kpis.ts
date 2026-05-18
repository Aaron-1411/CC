import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";
import { callLovableAI } from "@/lib/ai-gateway";

type Kpi = { label: string; value: string; period: string; source: string; trend?: "up" | "down" | "flat" };

const SYSTEM = `You are a UK public-data analyst. Return ONLY valid JSON matching:
{ "kpis": [{ "label": string, "value": string, "period": string, "source": string, "trend": "up"|"down"|"flat" }, ...] }
Provide the latest known figures for the requested UK indicators. Include units (£, %, ms). If a figure is uncertain say "approx" in value. Period e.g. "Sep 2025". Source = official body name (NHS England, ONS, OBR, etc).`;

export const Route = createFileRoute("/api/kpis")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await cached("kpis:headline", 30 * 60_000, async () => {
            const { content } = await callLovableAI({
              json: true,
              temperature: 0.1,
              messages: [
                { role: "system", content: SYSTEM },
                {
                  role: "user",
                  content:
                    "Return latest UK headline KPIs: NHS England elective waiting list size, public sector net debt as % of GDP, CPI inflation rate, annual housing completions, asylum applications backlog, and government contracts awarded this month (approx).",
                },
              ],
            });
            try {
              return JSON.parse(content) as { kpis: Kpi[] };
            } catch {
              return { kpis: [] as Kpi[] };
            }
          });
          return jsonResponse(
            envelope(
              data,
              "Lovable AI · synthesised from public sources",
              "https://ai.gateway.lovable.dev",
              "AI-synthesised; verify against ONS / NHS England / OBR",
            ),
          );
        } catch (e) {
          return errorResponse((e as Error).message);
        }
      },
    },
  },
});