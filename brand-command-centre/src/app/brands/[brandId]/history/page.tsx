import { History as HistoryIcon, ExternalLink } from "lucide-react";
import { getHistory } from "@/lib/queries";
import { EmptyState } from "@/components/shared/EmptyState";
import { AGENT_META, type AgentType, type InboxItemType } from "@/types/agents";
import { itemTypeLabel, timeAgo } from "@/lib/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const items = await getHistory(brandId, 100);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-[var(--ink)]">
          <HistoryIcon className="h-5 w-5 text-[var(--accent)]" /> History
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-2)]">
          Everything your agents have published or actioned — approved by you or auto-published.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-5 w-5" />}
          title="Nothing published yet"
          body="When you approve an item in the inbox, or an autonomous agent publishes one, it lands here with a link and a status."
          actionLabel="Open inbox"
          actionHref={`/brands/${brandId}/inbox`}
        />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)]">
          {items.map((item) => {
            const meta = AGENT_META[item.agentType as AgentType];
            const url = item.externalUrl ?? undefined;
            const isWeb = url?.startsWith("http");
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 border-b border-[var(--line-2)] px-4 py-3 last:border-0"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                  style={{ background: meta?.colour ?? "var(--ink-3)" }}
                  title={meta?.label}
                >
                  {meta?.short.slice(0, 1) ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--ink)]">{item.title}</p>
                  <p className="text-[11px] text-[var(--ink-3)]">
                    {itemTypeLabel(item.type as InboxItemType)} · {meta?.label ?? item.agentType} ·{" "}
                    {timeAgo(item.publishedAt)}
                  </p>
                </div>
                {isWeb ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--line)] px-2 py-1 text-[11px] font-medium text-[var(--ink-2)] transition hover:bg-[var(--panel-2)] hover:text-[var(--ink)]"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="shrink-0 rounded-md bg-[var(--good-bg)] px-2 py-1 text-[11px] font-medium text-[var(--good)]">
                    Published
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
