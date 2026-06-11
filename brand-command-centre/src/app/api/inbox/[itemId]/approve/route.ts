import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishItem } from "@/lib/integrations";
import { mergeContextUpdates } from "@/lib/brand-context";
import type { AgentPayload, InboxItemType } from "@/types/agents";

export const runtime = "edge";

const NO_PUBLISH: InboxItemType[] = ["INTEL_REPORT"];

export async function POST(
  req: Request,
  ctx: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    editedPayload?: AgentPayload;
  };

  const item = await db.inboxItem.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });
  if (item.status === "REJECTED") {
    return NextResponse.json({ error: "Item was rejected." }, { status: 409 });
  }

  const payload = (body.editedPayload ?? item.payload) as AgentPayload;
  const type = item.type as InboxItemType;
  const edited = body.editedPayload !== undefined || item.edited;

  // Intel reports are informational: "Mark as read".
  if (NO_PUBLISH.includes(type)) {
    const updated = await db.inboxItem.update({
      where: { id: itemId },
      data: {
        status: "APPROVED",
        edited,
        payload: payload as unknown as object,
        reviewedAt: new Date(),
        reviewedBy: "you",
        reviewNote: "Read",
      },
    });
    return NextResponse.json({ item: updated, published: null });
  }

  const brand = await db.brand.findUnique({ where: { id: item.brandId } });
  if (!brand) return NextResponse.json({ error: "Brand not found." }, { status: 404 });

  const result = await publishItem(type, payload, brand);

  const published = await db.publishedItem.create({
    data: {
      brandId: item.brandId,
      agentType: item.agentType,
      type,
      title: item.title,
      payload: payload as unknown as object,
      externalId: result.externalId,
      externalUrl: result.externalUrl,
    },
  });

  const updated = await db.inboxItem.update({
    where: { id: itemId },
    data: {
      status: "PUBLISHED",
      edited,
      payload: payload as unknown as object,
      reviewedAt: new Date(),
      reviewedBy: "you",
      reviewNote: result.note,
      publishedItemId: published.id,
    },
  });

  // Track approvals on the agent config; keep shared memory in sync.
  await db.agentConfig.updateMany({
    where: { brandId: item.brandId, agentType: item.agentType },
    data: { approvalCount: { increment: 1 } },
  });

  if (type === "BLOG_POST" && result.externalUrl) {
    await mergeContextUpdates(item.brandId, {
      publishedUrls: [result.externalUrl],
    });
  }

  return NextResponse.json({ item: updated, published, note: result.note });
}
