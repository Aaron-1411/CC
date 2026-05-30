import OpenAI from 'openai';
import { PillarResult, OpportunityMatrix } from '@/types/analysis';
import { getPillarChecklist } from './pillars';

// xAI Grok — OpenAI-compatible endpoint
export const aiClient = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const MODEL = 'grok-3';

export const SYSTEM_PROMPT = `
You are an expert ecommerce growth analyst running a structured brand audit.
Your job is to analyse a specific pillar of an ecommerce brand and return structured
JSON findings — opinionated, commercial, and specific.

RULES:
- Every finding must be either directly observed (CONFIRMED), inferred from signals (INFERRED), or flagged as unknown/requiring a tool (UNKNOWN).
- Opportunities must be specific and revenue-focused. Never generic.
- If data is unavailable, say exactly what tool or action would close the gap.
- Do not explain what common things are (BNPL, Klaviyo, etc.) — assume expert audience.
- Calibrate to the brand's stage. A 1,000-follower brand needs different advice than a £10M brand.
- Be opinionated. "No review widget is a conversion drag" not "consider adding reviews".

Return ONLY valid JSON matching this exact schema:
{
  "status": "GREEN" | "AMBER" | "RED",
  "findings": [
    {
      "type": "CONFIRMED" | "INFERRED" | "UNKNOWN",
      "text": "Finding text — specific and commercial",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "dataGapFlag": "Need: [tool] (optional, only for UNKNOWN type)"
    }
  ],
  "opportunity": "Single sentence. Most important revenue lever in this pillar.",
  "dataGap": "What specific tool or manual action would close remaining unknowns (if any)"
}
`;

export function buildPillarPrompt(
  pillarId: number,
  pillarName: string,
  url: string,
  supplementaryData?: string
): string {
  return `
Analyse pillar ${pillarId.toString().padStart(2, '0')}: ${pillarName}

Brand URL: ${url}
${supplementaryData ? `\nSupplementary data provided by user:\n${supplementaryData}` : ''}

Use your live web search capability to research this brand. Browse the site where relevant.
For this pillar specifically, check:
${getPillarChecklist(pillarId)}

Return structured JSON only. No prose outside the JSON.
  `.trim();
}

export async function runPillarAnalysis(
  pillarId: number,
  pillarName: string,
  url: string,
  supplementaryData?: string
): Promise<PillarResult> {
  // xAI Grok: web search is enabled via search_parameters on the request body.
  // We cast to `any` for the extra xAI-specific field since the OpenAI SDK types
  // don't include it — it is passed through as-is to the API.
  const response = await (aiClient.chat.completions.create as Function)({
    model: MODEL,
    max_tokens: 2000,
    // Enable Grok live web search
    search_parameters: { mode: 'auto' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildPillarPrompt(pillarId, pillarName, url, supplementaryData) },
    ],
  }) as OpenAI.Chat.ChatCompletion;

  const textContent = response.choices[0]?.message?.content ?? '';

  // Strip markdown fences if present
  const clean = textContent.replace(/```json\n?|```\n?/g, '').trim();
  const parsed = JSON.parse(clean);

  return {
    id: pillarId,
    name: pillarName,
    status: parsed.status,
    findings: parsed.findings,
    opportunity: parsed.opportunity,
    dataGap: parsed.dataGap,
    completedAt: new Date(),
  };
}

export async function buildOpportunityMatrix(
  pillars: PillarResult[],
  url: string
): Promise<OpportunityMatrix> {
  const summary = pillars
    .map(p => `Pillar ${p.id} (${p.name}): ${p.status}. Opportunity: ${p.opportunity}`)
    .join('\n');

  const response = await aiClient.chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: 'system',
        content: 'You are an ecommerce growth strategist. Given pillar findings, produce a prioritised opportunity matrix. Return ONLY valid JSON, no prose.',
      },
      {
        role: 'user',
        content: `Brand: ${url}\n\nPillar summary:\n${summary}\n\nReturn JSON:
{
  "highImpactEasy": ["action 1", "action 2"],
  "highImpactInvestment": ["action 1"],
  "lowerImpactEasy": ["action 1"],
  "longerTerm": ["action 1"]
}
Each action: one specific sentence with the mechanic and the commercial rationale. Maximum 5 items per quadrant.`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? '';
  return JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim());
}
