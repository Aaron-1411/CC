import { db } from "@/lib/db";
import { runCompletion, extractJson } from "@/lib/claude";
import { getBrandContext, setAuditFindings } from "@/lib/brand-context";
import { PILLARS, getPillar } from "@/lib/pillars";
import { JSON_ONLY } from "@/lib/agents/shared";
import type {
  AuditResult,
  Effort,
  Impact,
  OpportunityItem,
  PillarResult,
  RAGStatus,
} from "@/types/analysis";
import type { AgentType } from "@/types/agents";

const RAG: RAGStatus[] = ["GREEN", "AMBER", "RED"];
const LEVELS: Impact[] = ["HIGH", "MEDIUM", "LOW"];

function rubricBlock(): string {
  return PILLARS.map(
    (p) =>
      `Pillar ${p.id} — ${p.name} [${p.category}] (key: ${p.key})
  Measures: ${p.description}
  GREEN looks like: ${p.whatGoodLooksLike}`,
  ).join("\n");
}

interface RawPillar {
  id: number;
  status?: string;
  score?: number;
  summary?: string;
  findings?: string[];
  opportunity?: string;
}
interface RawOpportunity {
  title: string;
  pillarId: number;
  impact?: string;
  effort?: string;
  action: string;
  recommendedAgent?: string;
}
interface RawAudit {
  pillars: RawPillar[];
  opportunityMatrix?: RawOpportunity[];
}

function norm<T extends string>(v: string | undefined, allowed: T[], fallback: T): T {
  const up = (v ?? "").toUpperCase();
  return (allowed as string[]).includes(up) ? (up as T) : fallback;
}

function statusFromScore(score: number): RAGStatus {
  if (score >= 70) return "GREEN";
  if (score >= 40) return "AMBER";
  return "RED";
}

/** Run the 13-pillar gap analysis for a brand and persist the result. */
export async function runAudit(brandId: string): Promise<AuditResult> {
  const ctx = await getBrandContext(brandId);
  const { brand } = ctx;

  const audit = await db.audit.create({
    data: { brandId, status: "RUNNING", pillars: [] },
  });

  try {
    const system = `ROLE
You are a senior brand-growth auditor who has diagnosed hundreds of ecommerce and B2B brands. You are rigorous, specific, and honest — you cite what you actually observe on the site and in search, never generic platitudes. You grade like an expert consultant who has to justify every score.

TASK
Audit ${brand.name} (${brand.url}) against the 13-pillar rubric below. For EACH pillar give:
- score: 0–100, calibrated (most real brands sit 30–75; reserve 85+ for genuinely best-in-class, <30 for absent/broken).
- status: GREEN (≥70, strong), AMBER (40–69, has gaps), RED (<40, major gap or missing).
- summary: one sharp sentence stating the verdict.
- findings: 2–4 concrete, specific observations (what you actually saw — pages, copy, presence/absence of a feature).
- opportunity: the single highest-leverage improvement for this pillar, stated as an action.

Then produce an opportunityMatrix: the 5–8 highest-priority actions across all pillars, each scored for impact (HIGH/MEDIUM/LOW) and effort (HIGH/MEDIUM/LOW), with a plain-English next step and the recommended agent.

RECOMMENDED AGENTS map to: CONTENT, SOCIAL, ADS, EMAIL, REVIEWS, PROMO, INTEL.

RUBRIC
${rubricBlock()}

METHOD
- Use web search to actually look at the brand's website, search presence, social profiles, and reviews. Ground every finding in something real. If you cannot verify a pillar, score conservatively and say so in the summary.
- Be specific to THIS brand. No boilerplate that could apply to anyone.

OUTPUT SCHEMA
{
  "pillars": [
    { "id": 1, "status": "GREEN|AMBER|RED", "score": 0-100, "summary": "...", "findings": ["..."], "opportunity": "..." }
    // all 13, in id order
  ],
  "opportunityMatrix": [
    { "title": "...", "pillarId": 2, "impact": "HIGH|MEDIUM|LOW", "effort": "HIGH|MEDIUM|LOW", "action": "...", "recommendedAgent": "CONTENT" }
  ]
}

${JSON_ONLY}`;

    const prompt = `Audit ${brand.name} (${brand.url}). Industry: ${
      brand.industry ?? "unspecified"
    }. CMS: ${brand.cmsType ?? "unknown"}. Score all 13 pillars and build the opportunity matrix. Return ONLY the JSON object.`;

    const raw = await runCompletion({
      system,
      prompt,
      maxTokens: 8000,
      webSearch: true,
      maxSearches: 8,
      thinking: true,
    });

    const parsed = extractJson<RawAudit>(raw);

    // Normalise into full PillarResult[] for every pillar (model-supplied or default).
    const byId = new Map<number, RawPillar>(
      (parsed.pillars ?? []).map((p) => [p.id, p]),
    );

    const pillars: PillarResult[] = PILLARS.map((def) => {
      const r = byId.get(def.id);
      const score = clampScore(r?.score);
      const status = r?.status
        ? norm<RAGStatus>(r.status, RAG, statusFromScore(score))
        : statusFromScore(score);
      return {
        id: def.id,
        key: def.key,
        name: def.name,
        status,
        score,
        summary: r?.summary?.trim() || "Not enough signal to assess — treated conservatively.",
        findings: (r?.findings ?? []).filter(Boolean).slice(0, 6),
        opportunity: r?.opportunity?.trim() || def.whatGoodLooksLike,
        recommendedAgents: def.recommendedAgents,
      };
    });

    const opportunityMatrix: OpportunityItem[] = (parsed.opportunityMatrix ?? [])
      .filter((o) => o.title && o.action)
      .map((o) => {
        const pillar = getPillar(o.pillarId);
        const rec = norm<AgentType | "">(
          o.recommendedAgent,
          ["CONTENT", "SOCIAL", "ADS", "EMAIL", "REVIEWS", "PROMO", "INTEL", ""],
          (pillar?.recommendedAgents[0] as AgentType) ?? "",
        );
        return {
          title: o.title,
          pillarId: o.pillarId,
          impact: norm<Impact>(o.impact, LEVELS, "MEDIUM"),
          effort: norm<Effort>(o.effort, LEVELS, "MEDIUM"),
          action: o.action,
          recommendedAgent: rec || undefined,
        };
      });

    await db.audit.update({
      where: { id: audit.id },
      data: {
        status: "COMPLETE",
        pillars: pillars as unknown as object,
        opportunityMatrix: opportunityMatrix as unknown as object,
        completedAt: new Date(),
      },
    });

    await setAuditFindings(brandId, pillars);

    return { pillars, opportunityMatrix };
  } catch (err) {
    await db.audit.update({
      where: { id: audit.id },
      data: { status: "FAILED", completedAt: new Date() },
    });
    throw err;
  }
}

function clampScore(n: number | undefined): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 35;
  return Math.min(100, Math.max(0, Math.round(n)));
}
