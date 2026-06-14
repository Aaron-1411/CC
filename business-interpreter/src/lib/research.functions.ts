import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ResearchInput = z.object({
  jobId: z.string().uuid(),
  subjectName: z.string().min(1).max(200),
  subjectUrl: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  maxCompetitors: z.number().int().min(1).max(8).default(5),
});

type Bucket =
  | "pricing"
  | "terms"
  | "features"
  | "docs"
  | "about"
  | "customers";

const BUCKET_PATTERNS: Record<Bucket, RegExp[]> = {
  pricing: [/pric/i, /plans?/i, /cost/i, /buy/i, /subscribe/i],
  terms: [/terms/i, /legal/i, /msa/i, /sla/i, /contract/i, /refund/i, /cancel/i, /privacy/i],
  features: [/feature/i, /product/i, /platform/i, /solutions?/i, /capabilit/i, /how-it-works/i],
  docs: [/docs?/i, /help/i, /support/i, /knowledge/i, /guides?/i, /api/i],
  about: [/about/i, /company/i, /team/i, /story/i],
  customers: [/customer/i, /case-stud/i, /testimonial/i, /clients?/i, /stories/i],
};

const PER_BUCKET_LIMIT: Record<Bucket, number> = {
  pricing: 3,
  terms: 3,
  features: 4,
  docs: 4,
  about: 1,
  customers: 2,
};

function classify(url: string): Bucket | null {
  for (const b of Object.keys(BUCKET_PATTERNS) as Bucket[]) {
    if (BUCKET_PATTERNS[b].some((re) => re.test(url))) return b;
  }
  return null;
}

export const runResearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { getLovableModel } = await import("./ai-gateway.server");
    const { firecrawlSearch, firecrawlScrape, firecrawlMap, pMapLimit } = await import("./firecrawl.server");
    const { generateText, Output } = await import("ai");
    const {
      CompetitorProfileSchema,
      PricingProfileSchema,
      TermsProfileSchema,
      CapabilityProfileSchema,
      PositioningProfileSchema,
    } = await import("./research/schema");

    type Profile = z.infer<typeof CompetitorProfileSchema>;

    await supabase.from("messages").insert({
      user_id: userId,
      job_id: data.jobId,
      role: "user",
      content: `Deep competitor research for ${data.subjectName}${data.subjectUrl ? ` (${data.subjectUrl})` : ""}.`,
    });

    // 1. Subject summary
    let subjectSummary = data.description ?? "";
    if (data.subjectUrl) {
      try {
        const r = await firecrawlScrape(data.subjectUrl, ["markdown", "summary"]);
        const doc = r.data ?? r;
        subjectSummary = (doc.summary as string | undefined)
          ?? (doc.markdown as string | undefined)?.slice(0, 4000)
          ?? subjectSummary;
      } catch (e) {
        subjectSummary = `(Could not scrape subject site: ${(e as Error).message})\n${subjectSummary}`;
      }
    }

    // 2. Discover competitors via search
    const searchQuery = `top competitors and alternatives to ${data.subjectName} ${data.description ? `(${data.description.slice(0, 80)})` : ""} pricing comparison`;
    const s = await firecrawlSearch(searchQuery, data.maxCompetitors * 3);
    const webResults = (s.data?.web ?? s.web ?? s.data ?? []) as Array<{ url: string; title?: string; description?: string }>;
    const subjectHost = data.subjectUrl ? new URL(data.subjectUrl).hostname.replace(/^www\./, "") : "";
    const seen = new Set<string>();
    const COMMON = new Set(["g2.com", "capterra.com", "trustpilot.com", "reddit.com", "youtube.com", "medium.com"]);
    const targets: { url: string; host: string; title?: string }[] = [];
    for (const r of webResults) {
      try {
        const host = new URL(r.url).hostname.replace(/^www\./, "");
        const root = host.split(".").slice(-2).join(".");
        if (host.includes(subjectHost)) continue;
        if (COMMON.has(root)) continue;
        if (seen.has(root)) continue;
        seen.add(root);
        targets.push({ url: `https://${host}`, host, title: r.title });
        if (targets.length >= data.maxCompetitors) break;
      } catch { /* skip */ }
    }

    const model = getLovableModel("google/gemini-3-flash-preview");

    // 3. Per competitor: map → bucketed scrape → reviews search → 4-axis extraction
    const profiles: Profile[] = [];

    for (const t of targets) {
      try {
        const profile = await profileCompetitor(t, {
          subjectName: data.subjectName,
          subjectSummary,
          model,
          firecrawlMap,
          firecrawlScrape,
          firecrawlSearch,
          pMapLimit,
          generateText,
          Output,
          schemas: {
            PricingProfileSchema,
            TermsProfileSchema,
            CapabilityProfileSchema,
            PositioningProfileSchema,
          },
        });
        profiles.push(profile);
      } catch (e) {
        profiles.push({
          name: t.title ?? t.host,
          url: t.url,
          positioning_summary: `Could not profile: ${(e as Error).message}`,
          source_urls: [t.url],
          overall_confidence: "low",
        } as Profile);
      }
    }

    // 4. Persist report
    const { data: report, error } = await supabase
      .from("research_reports")
      .insert({
        user_id: userId,
        job_id: data.jobId,
        subject_name: data.subjectName,
        subject_url: data.subjectUrl,
        subject_summary: subjectSummary,
        competitors: profiles,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const lowConf = profiles.filter((p) => p.overall_confidence === "low").length;
    await supabase.from("messages").insert({
      user_id: userId,
      job_id: data.jobId,
      role: "assistant",
      content: `Deep-profiled **${profiles.length} competitor${profiles.length === 1 ? "" : "s"}** across pricing, contract terms, capabilities, and positioning.${lowConf ? ` ${lowConf} entries are low-confidence — see source links.` : ""}`,
      step_log: { kind: "research", report_id: report.id, competitor_count: profiles.length },
    });

    await supabase.from("jobs").update({ updated_at: new Date().toISOString() }).eq("id", data.jobId);

    return { report };
  });

type ScrapedDoc = { url: string; bucket: Bucket | "review"; markdown: string };

async function profileCompetitor(
  t: { url: string; host: string; title?: string },
  ctx: {
    subjectName: string;
    subjectSummary: string;
    model: unknown;
    firecrawlMap: (url: string, opts?: Record<string, unknown>) => Promise<any>;
    firecrawlScrape: (url: string, formats?: Array<string | Record<string, unknown>>) => Promise<any>;
    firecrawlSearch: (q: string, limit?: number) => Promise<any>;
    pMapLimit: <T, R>(items: T[], limit: number, fn: (x: T, i: number) => Promise<R>) => Promise<R[]>;
    generateText: any;
    Output: any;
    schemas: {
      PricingProfileSchema: z.ZodTypeAny;
      TermsProfileSchema: z.ZodTypeAny;
      CapabilityProfileSchema: z.ZodTypeAny;
      PositioningProfileSchema: z.ZodTypeAny;
    };
  },
): Promise<z.infer<typeof import("./research/schema").CompetitorProfileSchema>> {
  // 1. Map site URLs and bucket them
  let urls: string[] = [];
  try {
    const m = await ctx.firecrawlMap(t.url, { limit: 200 });
    urls = (m.links ?? m.data?.links ?? []) as string[];
  } catch { /* fall through */ }
  if (urls.length === 0) urls = [t.url];

  const buckets: Record<Bucket, string[]> = {
    pricing: [], terms: [], features: [], docs: [], about: [], customers: [],
  };
  for (const u of urls) {
    const b = classify(u);
    if (b && buckets[b].length < PER_BUCKET_LIMIT[b]) buckets[b].push(u);
  }
  // Always include the home page as "features" fallback
  if (buckets.features.length === 0) buckets.features.push(t.url);

  const toScrape = (Object.keys(buckets) as Bucket[])
    .flatMap((b) => buckets[b].map((u) => ({ url: u, bucket: b })));

  const scraped: ScrapedDoc[] = (await ctx.pMapLimit(toScrape, 3, async (item) => {
    try {
      const r = await ctx.firecrawlScrape(item.url, ["markdown"]);
      const doc = r.data ?? r;
      return {
        url: item.url,
        bucket: item.bucket,
        markdown: ((doc.markdown as string | undefined) ?? "").slice(0, 6000),
      };
    } catch {
      return { url: item.url, bucket: item.bucket, markdown: "" };
    }
  })).filter((d) => d.markdown.length > 0);

  // 2. Reviews — 2 top results from G2/Trustpilot/Capterra
  try {
    const rs = await ctx.firecrawlSearch(
      `${t.host} reviews (site:g2.com OR site:trustpilot.com OR site:capterra.com)`,
      4,
    );
    const reviewUrls = ((rs.data?.web ?? rs.web ?? rs.data ?? []) as Array<{ url: string }>)
      .map((x) => x.url).slice(0, 2);
    const reviewScraped = await ctx.pMapLimit(reviewUrls, 2, async (u) => {
      try {
        const r = await ctx.firecrawlScrape(u, ["markdown"]);
        const doc = r.data ?? r;
        return { url: u, bucket: "review" as const, markdown: ((doc.markdown as string | undefined) ?? "").slice(0, 4000) };
      } catch {
        return { url: u, bucket: "review" as const, markdown: "" };
      }
    });
    scraped.push(...reviewScraped.filter((d) => d.markdown.length > 0));
  } catch { /* reviews optional */ }

  // 3. Per-axis structured extraction (split to keep schema small for Gemini)
  const bucketContext = (allowed: Array<Bucket | "review">) =>
    scraped
      .filter((d) => allowed.includes(d.bucket))
      .map((d) => `### Source: ${d.url} (${d.bucket})\n${d.markdown}`)
      .join("\n\n")
      .slice(0, 18000);

  const subjectPreamble = `Subject: ${ctx.subjectName}\nSubject summary: ${ctx.subjectSummary.slice(0, 1500)}\n\nCompetitor: ${t.host}\n\n`;

  async function extract<S extends z.ZodTypeAny>(schema: S, axis: string, allowed: Array<Bucket | "review">) {
    const docs = bucketContext(allowed);
    if (!docs) return undefined;
    try {
      const { experimental_output } = await ctx.generateText({
        model: ctx.model,
        experimental_output: ctx.Output.object({ schema }),
        system:
          `Extract competitive intelligence for the "${axis}" axis. Be conservative — use "low" confidence and leave fields empty when not clearly evidenced. Always cite source_url and quote evidence when possible.`,
        prompt: subjectPreamble + docs,
      });
      return experimental_output as z.infer<S>;
    } catch {
      return undefined;
    }
  }

  type Schemas = typeof import("./research/schema");
  const [pricing, terms, capabilities, positioning] = await Promise.all([
    extract(ctx.schemas.PricingProfileSchema, "pricing & plans", ["pricing", "features"]) as Promise<z.infer<Schemas["PricingProfileSchema"]> | undefined>,
    extract(ctx.schemas.TermsProfileSchema, "contract & commercial terms", ["terms", "pricing"]) as Promise<z.infer<Schemas["TermsProfileSchema"]> | undefined>,
    extract(ctx.schemas.CapabilityProfileSchema, "product capability matrix", ["features", "docs", "review"]) as Promise<z.infer<Schemas["CapabilityProfileSchema"]> | undefined>,
    extract(ctx.schemas.PositioningProfileSchema, "positioning & GTM", ["features", "about", "customers", "review"]) as Promise<z.infer<Schemas["PositioningProfileSchema"]> | undefined>,
  ]);

  // Overall confidence heuristic: high if pricing.tiers + terms + capabilities all populated
  const populated = [pricing?.tiers?.length, terms?.min_contract_length?.value, capabilities?.features?.length, positioning?.tagline].filter(Boolean).length;
  const overall_confidence: "high" | "medium" | "low" = populated >= 3 ? "high" : populated >= 2 ? "medium" : "low";

  return {
    name: t.title ?? t.host,
    url: t.url,
    positioning_summary: positioning?.tagline ?? null,
    pricing,
    terms,
    capabilities,
    positioning,
    source_urls: [t.url, ...scraped.map((d) => d.url)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 30),
    overall_confidence,
  };
}

export const getReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: report, error } = await context.supabase
      .from("research_reports")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return report;
  });
