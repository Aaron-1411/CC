import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { PillarResult, OpportunityMatrix } from '@/types/analysis';
import { getPillarChecklist } from './pillars';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// gemini-2.0-flash: free tier, 15 RPM, 1M context, Google Search grounding
const MODEL = 'gemini-2.0-flash';

// Safety settings — turn off filters that block commercial audit content
const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

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

Use Google Search to research this brand live. Browse the site where relevant.
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
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    safetySettings: SAFETY,
    // Google Search grounding — live web data for every pillar call
    tools: [{ googleSearchRetrieval: {} }],
  });

  const result = await model.generateContent(
    buildPillarPrompt(pillarId, pillarName, url, supplementaryData)
  );

  const textContent = result.response.text();
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

  const model = genAI.getGenerativeModel({
    model: MODEL,
    safetySettings: SAFETY,
  });

  const result = await model.generateContent(
    `You are an ecommerce growth strategist. Given pillar findings, produce a prioritised opportunity matrix. Return ONLY valid JSON, no prose.

Brand: ${url}

Pillar summary:
${summary}

Return JSON:
{
  "highImpactEasy": ["action 1", "action 2"],
  "highImpactInvestment": ["action 1"],
  "lowerImpactEasy": ["action 1"],
  "longerTerm": ["action 1"]
}
Each action: one specific sentence with the mechanic and the commercial rationale. Maximum 5 items per quadrant.`
  );

  const text = result.response.text();
  return JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim());
}
