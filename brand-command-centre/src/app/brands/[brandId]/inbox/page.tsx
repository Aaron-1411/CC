import { getInboxItems } from "@/lib/queries";
import { InboxClient } from "@/components/inbox/InboxClient";
import type { InboxItemDTO } from "@/types/ui";
import type { AgentPayload, AgentType, InboxItemType, InboxStatus } from "@/types/agents";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function InboxPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const rows = await getInboxItems(brandId, { status: "PENDING" });

  const items: InboxItemDTO[] = rows.map((r) => ({
    id: r.id,
    brandId: r.brandId,
    agentType: r.agentType as AgentType,
    type: r.type as InboxItemType,
    title: r.title,
    description: r.description,
    payload: r.payload as unknown as AgentPayload,
    estimatedImpact: r.estimatedImpact,
    pillarSource: r.pillarSource,
    status: r.status as InboxStatus,
    edited: r.edited,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="h-full">
      <InboxClient initialItems={items} />
    </div>
  );
}
