import { db } from "./db";
import type {
  ActivePromoRecord,
  ApprovedAsset,
  BrandContextData,
  CompetitorRecord,
  PostedContentRecord,
} from "@/types/agents";
import type { PillarResult } from "@/types/analysis";

// Defaults used when first creating a BrandContext row (SQLite can't store
// JSON column defaults, so we supply them here).
export function emptyContextData() {
  return {
    auditFindings: [],
    competitors: [],
    publishedUrls: [],
    postedContent: [],
    activePromos: [],
    approvedAssets: [],
  };
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Ensure a BrandContext row exists for the brand, then return it deserialised. */
export async function getBrandContext(brandId: string): Promise<BrandContextData> {
  const brand = await db.brand.findUnique({
    where: { id: brandId },
    include: { brandContext: true },
  });
  if (!brand) throw new Error(`Brand ${brandId} not found.`);

  let ctx = brand.brandContext;
  if (!ctx) {
    ctx = await db.brandContext.create({
      data: { brandId, ...emptyContextData() },
    });
  }

  return {
    brand: {
      id: brand.id,
      name: brand.name,
      url: brand.url,
      industry: brand.industry,
      toneOfVoice: brand.toneOfVoice,
      primaryColour: brand.primaryColour,
      cmsType: brand.cmsType,
    },
    auditFindings: asArray<PillarResult>(ctx.auditFindings),
    competitors: asArray<CompetitorRecord>(ctx.competitors),
    publishedUrls: asArray<string>(ctx.publishedUrls),
    postedContent: asArray<PostedContentRecord>(ctx.postedContent),
    activePromos: asArray<ActivePromoRecord>(ctx.activePromos),
    approvedAssets: asArray<ApprovedAsset>(ctx.approvedAssets),
  };
}

const LIST_CAP = 200;

/**
 * Merge partial updates into BrandContext WITHOUT clobbering unrelated fields.
 * - publishedUrls: union (dedup strings)
 * - postedContent / activePromos / approvedAssets: append (capped)
 * - competitors: replace with the provided latest snapshot
 */
export async function mergeContextUpdates(
  brandId: string,
  updates: Partial<
    Pick<
      BrandContextData,
      | "competitors"
      | "publishedUrls"
      | "postedContent"
      | "activePromos"
      | "approvedAssets"
    >
  >,
): Promise<void> {
  const current = await getBrandContext(brandId);
  const data: Record<string, unknown> = {};

  if (updates.competitors !== undefined) {
    data.competitors = updates.competitors;
  }
  if (updates.publishedUrls !== undefined) {
    data.publishedUrls = Array.from(
      new Set([...current.publishedUrls, ...updates.publishedUrls]),
    ).slice(-LIST_CAP);
  }
  if (updates.postedContent !== undefined) {
    data.postedContent = [...current.postedContent, ...updates.postedContent].slice(-LIST_CAP);
  }
  if (updates.activePromos !== undefined) {
    data.activePromos = [...current.activePromos, ...updates.activePromos].slice(-LIST_CAP);
  }
  if (updates.approvedAssets !== undefined) {
    data.approvedAssets = [...current.approvedAssets, ...updates.approvedAssets].slice(-LIST_CAP);
  }

  if (Object.keys(data).length === 0) return;
  await db.brandContext.update({ where: { brandId }, data });
}

/** Replace the cached audit findings (called after an audit completes). */
export async function setAuditFindings(
  brandId: string,
  findings: PillarResult[],
): Promise<void> {
  await getBrandContext(brandId); // ensure row exists
  await db.brandContext.update({
    where: { brandId },
    data: { auditFindings: findings as unknown as object },
  });
}
