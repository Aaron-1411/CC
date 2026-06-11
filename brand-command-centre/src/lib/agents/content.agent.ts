import { runCompletion, extractJson } from "@/lib/claude";
import { brandContextBlock } from "./context-block";
import {
  cmsTargetFor,
  gapsBlock,
  relevantGaps,
  slugify,
  JSON_ONLY,
} from "./shared";
import type {
  AgentFn,
  AgentInput,
  AgentOutput,
  ContentPayload,
} from "@/types/agents";

interface ContentResult {
  posts: Array<{
    title: string;
    slug?: string;
    body: string;
    metaTitle: string;
    metaDescription: string;
    targetKeyword: string;
    secondaryKeywords?: string[];
    searchIntent?: string;
    estimatedWordCount?: number;
    rationale?: string;
  }>;
}

export const runContentAgent: AgentFn = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const { brandContext: ctx } = input;
  const gaps = relevantGaps(ctx, [2, 5, 9]);
  const cmsTarget = cmsTargetFor(ctx.brand.cmsType);

  const system = `ROLE
You are a senior SEO content strategist (ex-agency, 10+ years ranking commercial sites). You think in search intent, topical authority, and SERP gaps — not word-count padding. You write genuinely useful, E-E-A-T-grade editorial that earns links and converts, never thin AI filler.

OBJECTIVE
Produce ONE blog post (occasionally two if there is a clear, distinct second opportunity) that:
1. Targets a keyword with real commercial or high-intent informational demand that this brand can realistically rank for (favour long-tail, lower-difficulty terms over head terms).
2. Fills a genuine gap — NEVER overlaps a topic already published (see the published URLs in brand context). If everything obvious is covered, find the adjacent uncontested angle.
3. Matches search intent precisely: if the SERP wants a comparison, write a comparison; if it wants a how-to, write a how-to.
4. Is structured for both readers and crawlers: a compelling H1 (the title), a hook intro that states the answer early, scannable H2/H3 sections, at least one list or table where useful, and a short FAQ block targeting "People Also Ask" questions.
5. Ends with a natural, non-pushy call-to-action back to the brand's relevant product/category.

CRAFT RULES
- Write the body in clean Markdown (## for H2, ### for H3, - for bullets, **bold** sparingly).
- Open with the takeaway in the first 1–2 sentences (answer-first), then earn the rest.
- Use the brand's tone of voice. Be specific and concrete; cite real, verifiable facts only.
- metaTitle ≤ 60 characters, front-loads the primary keyword, reads like a click-worthy result.
- metaDescription ≤ 155 characters, benefit-led, includes the keyword once, ends with a soft CTA.
- 1,100–1,700 words of substance. Depth over length — cut anything generic.
- Use web search to confirm the keyword is real, gauge what currently ranks, and ground any stats or claims. Do not invent statistics.

PILLAR GAPS THIS POST SHOULD ATTACK:
${gapsBlock(gaps)}

OUTPUT SCHEMA
{
  "posts": [
    {
      "title": "string (also the H1)",
      "slug": "kebab-case-url-slug",
      "body": "full Markdown article",
      "metaTitle": "string ≤60 chars",
      "metaDescription": "string ≤155 chars",
      "targetKeyword": "primary keyword",
      "secondaryKeywords": ["supporting terms actually used in the body"],
      "searchIntent": "informational | commercial | transactional",
      "estimatedWordCount": 1400,
      "rationale": "one sentence: why this topic, why now, why we can rank"
    }
  ]
}

${JSON_ONLY}`;

  const prompt = `Brand: ${ctx.brand.name} (${ctx.brand.url}), industry: ${
    ctx.brand.industry ?? "unspecified"
  }, CMS: ${ctx.brand.cmsType ?? "manual"}.
Plan and write this week's highest-leverage blog post. Avoid every topic already covered by our published URLs. Prefer a keyword we can realistically win in the next 90 days. Return ONLY the JSON object.`;

  const raw = await runCompletion({
    cacheableSystem: brandContextBlock(ctx),
    system,
    prompt,
    maxTokens: 8000,
    webSearch: true,
    maxSearches: 5,
  });

  const result = extractJson<ContentResult>(raw);
  const posts = (result.posts ?? []).filter((p) => p.title && p.body);

  return {
    inboxItems: posts.map((p) => {
      const payload: ContentPayload = {
        title: p.title,
        slug: p.slug?.trim() || slugify(p.title),
        body: p.body,
        metaTitle: p.metaTitle || p.title.slice(0, 60),
        metaDescription: p.metaDescription || "",
        targetKeyword: p.targetKeyword || "",
        estimatedWordCount:
          p.estimatedWordCount ?? p.body.split(/\s+/).filter(Boolean).length,
        cmsTarget,
      };
      return {
        type: "BLOG_POST" as const,
        title: p.title,
        description: p.rationale
          ? `SEO draft targeting "${payload.targetKeyword}". ${p.rationale}`
          : `SEO draft targeting "${payload.targetKeyword}".`,
        payload,
        pillarSource: 2,
        estimatedImpact: `Targets "${payload.targetKeyword}" (${p.searchIntent ?? "search"} intent) — closes an SEO/content gap.`,
      };
    }),
  };
};
