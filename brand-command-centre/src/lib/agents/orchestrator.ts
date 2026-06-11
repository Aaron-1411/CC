import { db } from "@/lib/db";
import { getBrandContext, mergeContextUpdates } from "@/lib/brand-context";
import { publishItem } from "@/lib/integrations";
import { getOrCreateAgentConfig } from "./config";
import { getAgentFn } from "./registry";
import {
  ALWAYS_APPROVAL_ITEM_TYPES,
  type AgentDraft,
  type AgentRunRequest,
  type InboxItemType,
  type ReviewPayload,
} from "@/types/agents";

export class ConflictError extends Error {}

/** Item types that can be auto-published when an agent is fully autonomous. */
const AUTO_PUBLISHABLE: InboxItemType[] = [
  "BLOG_POST",
  "SOCIAL_POST",
  "REVIEW_RESPONSE",
];

export function requiresApproval(draft: AgentDraft): boolean {
  if (ALWAYS_APPROVAL_ITEM_TYPES.includes(draft.type)) return true;
  if (draft.type === "REVIEW_RESPONSE") {
    return Boolean((draft.payload as ReviewPayload).flagged);
  }
  return false;
}

/**
 * Stable content fingerprint for idempotent inbox writes. A non-cryptographic
 * hash is sufficient for dedup and avoids any Node-only crypto dependency, so it
 * runs on the Cloudflare edge runtime as-is. (FNV-1a 32-bit, hex-encoded.)
 */
function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function dedupeKey(agentType: string, draft: AgentDraft): string {
  const seed = `${draft.type}|${draft.title}|${JSON.stringify(draft.payload)}`;
  // Two rounds over different salts widen the space to make collisions negligible.
  const hash = fnv1a(seed) + fnv1a("salt:" + seed);
  return `${agentType}:${hash}`;
}

export interface RunSummary {
  runId: string;
  status: "COMPLETE" | "FAILED" | "SKIPPED";
  itemsCreated: number;
  itemsPublished: number;
  error?: string;
}

export class AgentOrchestrator {
  async runAgent(req: AgentRunRequest): Promise<RunSummary> {
    const { brandId, agentType, trigger, pillarId } = req;

    const brand = await db.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new Error(`Brand ${brandId} not found.`);

    const run = await db.agentRun.create({
      data: { brandId, agentType, trigger, pillarId, status: "RUNNING" },
    });

    try {
      const context = await getBrandContext(brandId);
      const config = await getOrCreateAgentConfig(brandId, agentType);

      await this.checkConflicts(req, context);

      const agent = getAgentFn(agentType);
      const output = await agent({
        brandContext: context,
        auditFindings: context.auditFindings,
        config,
      });

      let created = 0;
      let published = 0;

      for (const draft of output.inboxItems) {
        const key = dedupeKey(agentType, draft);

        // Idempotent insert: skip if an identical item already exists.
        const existing = await db.inboxItem.findUnique({
          where: { brandId_dedupeKey: { brandId, dedupeKey: key } },
        });
        if (existing) continue;

        const item = await db.inboxItem.create({
          data: {
            brandId,
            agentType,
            type: draft.type,
            title: draft.title,
            description: draft.description,
            payload: draft.payload as unknown as object,
            estimatedImpact: draft.estimatedImpact,
            pillarSource: draft.pillarSource ?? pillarId ?? null,
            dedupeKey: key,
            status: "PENDING",
          },
        });
        created++;

        const autoPublish =
          config.autonomyLevel === "FULLY_AUTONOMOUS" &&
          !requiresApproval(draft) &&
          AUTO_PUBLISHABLE.includes(draft.type);

        if (autoPublish) {
          const result = await publishItem(draft.type, draft.payload, brand);
          const pub = await db.publishedItem.create({
            data: {
              brandId,
              agentType,
              type: draft.type,
              title: draft.title,
              payload: draft.payload as unknown as object,
              externalId: result.externalId,
              externalUrl: result.externalUrl,
            },
          });
          await db.inboxItem.update({
            where: { id: item.id },
            data: {
              status: "PUBLISHED",
              reviewedAt: new Date(),
              reviewedBy: "auto",
              reviewNote: result.note,
              publishedItemId: pub.id,
            },
          });
          published++;
        }
      }

      if (output.contextUpdates) {
        await mergeContextUpdates(brandId, output.contextUpdates);
      }

      const nextRunAt =
        output.nextRunSuggestion ?? null; // cron-based nextRun computed by scheduler
      await db.agentConfig.update({
        where: { brandId_agentType: { brandId, agentType } },
        data: {
          lastRunAt: new Date(),
          ...(nextRunAt ? { nextRunAt } : {}),
          runCount: { increment: 1 },
        },
      });

      await db.agentRun.update({
        where: { id: run.id },
        data: { status: "COMPLETE", itemCount: created, finishedAt: new Date() },
      });

      return {
        runId: run.id,
        status: "COMPLETE",
        itemsCreated: created,
        itemsPublished: published,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const skipped = err instanceof ConflictError;
      await db.agentRun.update({
        where: { id: run.id },
        data: {
          status: skipped ? "SKIPPED" : "FAILED",
          error: message,
          finishedAt: new Date(),
        },
      });
      return {
        runId: run.id,
        status: skipped ? "SKIPPED" : "FAILED",
        itemsCreated: 0,
        itemsPublished: 0,
        error: message,
      };
    }
  }

  private async checkConflicts(
    req: AgentRunRequest,
    context: Awaited<ReturnType<typeof getBrandContext>>,
  ): Promise<void> {
    // Never run a second promotion while one is active.
    if (req.agentType === "PROMO" && context.activePromos.length > 0) {
      throw new ConflictError(
        "An active promotion is already running — the promo agent was skipped to avoid overlap.",
      );
    }
  }
}

export const orchestrator = new AgentOrchestrator();
