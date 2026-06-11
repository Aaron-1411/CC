import { runCompletion, extractJson } from "@/lib/claude";
import { brandContextBlock } from "./context-block";
import { gapsBlock, isoInDays, relevantGaps, JSON_ONLY } from "./shared";
import type {
  AgentFn,
  AgentInput,
  AgentOutput,
  SocialPayload,
} from "@/types/agents";

const PLATFORMS = ["instagram", "tiktok", "linkedin", "twitter_x", "pinterest"] as const;
type Platform = (typeof PLATFORMS)[number];

interface SocialResult {
  posts: Array<{
    platform: Platform;
    caption: string;
    hashtags?: string[];
    dayOffset?: number;
    hour?: number;
    imagePrompt?: string;
    contentSourceUrl?: string;
    angle?: string;
  }>;
}

export const runSocialAgent: AgentFn = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const { brandContext: ctx } = input;
  const gaps = relevantGaps(ctx, [8]);

  const system = `ROLE
You are a senior organic social manager who has grown brand channels from zero. You know each platform's culture cold and write thumb-stopping, native-feeling posts — never the same caption reformatted five ways. You understand hooks, pattern interrupts, and that the first line decides everything.

OBJECTIVE
Plan 3 posts across the next few days. Each must:
1. Be NATIVE to its platform — match the format, length, and culture (see platform rules). Don't post a LinkedIn essay to TikTok.
2. Lead with a scroll-stopping first line (the hook). No "We're excited to announce".
3. Have a clear job: promote a recent piece of brand content, educate, build community, or ride a relevant trend.
4. Never repeat a recent post (see "Recent social posts" in brand context) — vary angle, format and platform.
5. Include a vivid image/video brief so the asset can be produced.

PLATFORM RULES (respect the character ceilings — going over breaks the post):
- instagram (≤2200): story-led caption, line breaks for readability, 5–10 niche hashtags (not generic #love), strong first line before the "more" fold.
- tiktok (≤150): punchy on-screen-text-style hook; describe the video concept; 2–4 hashtags.
- linkedin (≤3000): professional insight or POV; short paragraphs; 1–3 hashtags; a question or takeaway to drive comments.
- twitter_x (≤280): one sharp idea; no hashtag spam (0–2); consider a hook that invites replies.
- pinterest (≤500): keyword-rich, search-friendly description; aspirational; 3–5 hashtags.

CRAFT RULES
- Use the brand's tone of voice but adapt register per platform.
- hashtags as an array WITHOUT the leading # (the UI adds it). Choose specific, reachable tags over mega-broad ones.
- imagePrompt: a concrete art-direction brief (subject, composition, mood, colour), not "a nice photo".
- If promoting existing content, set contentSourceUrl to one of the brand's published URLs.
- Use web search if you need to confirm a current trend or hashtag is real and relevant — never invent a trend.

PILLAR CONTEXT:
${gapsBlock(gaps)}

OUTPUT SCHEMA
{
  "posts": [
    {
      "platform": "instagram | tiktok | linkedin | twitter_x | pinterest",
      "caption": "the post copy (within the platform limit)",
      "hashtags": ["nohash", "tags"],
      "dayOffset": 1,
      "hour": 9,
      "imagePrompt": "art-direction brief",
      "contentSourceUrl": "optional brand URL being promoted",
      "angle": "one-line: the job this post does"
    }
  ]
}

${JSON_ONLY}`;

  const prompt = `Brand: ${ctx.brand.name} (${ctx.brand.url}), industry: ${
    ctx.brand.industry ?? "unspecified"
  }. Plan 3 native posts for the next few days across the most fitting platforms for this brand. Stagger them. Return ONLY the JSON object.`;

  const raw = await runCompletion({
    cacheableSystem: brandContextBlock(ctx),
    system,
    prompt,
    maxTokens: 4000,
    webSearch: true,
    maxSearches: 3,
  });

  const result = extractJson<SocialResult>(raw);
  const posts = (result.posts ?? []).filter(
    (p) => p.caption && PLATFORMS.includes(p.platform),
  );

  const inboxItems = posts.map((p, i) => {
    const scheduledFor = isoInDays(p.dayOffset ?? i + 1, p.hour ?? 9);
    const payload: SocialPayload = {
      platform: p.platform,
      caption: p.caption,
      hashtags: (p.hashtags ?? []).map((h) => h.replace(/^#/, "")),
      scheduledFor,
      imagePrompt: p.imagePrompt,
      contentSourceUrl: p.contentSourceUrl,
    };
    return {
      type: "SOCIAL_POST" as const,
      title: `${p.platform.replace("_", "/")} — ${p.angle ?? p.caption.slice(0, 48)}`,
      description: p.angle
        ? `Native ${p.platform} post. ${p.angle}`
        : `Native ${p.platform} post.`,
      payload,
      pillarSource: 8,
      estimatedImpact: "Keeps the organic social channel consistent and on-brand.",
    };
  });

  return { inboxItems };
};
