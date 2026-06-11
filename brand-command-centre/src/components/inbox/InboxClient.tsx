"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Inbox as InboxIcon } from "lucide-react";
import { InboxDetail } from "./InboxDetail";
import { EmptyState } from "@/components/shared/EmptyState";
import { AGENT_META, AGENT_TYPES, type AgentType } from "@/types/agents";
import type { InboxItemDTO } from "@/types/ui";
import { cn, itemTypeLabel, timeAgo } from "@/lib/utils";

type Filter = "ALL" | AgentType;

export function InboxClient({ initialItems }: { initialItems: InboxItemDTO[] }) {
  const router = useRouter();
  const [items, setItems] = useState<InboxItemDTO[]>(initialItems);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "ALL" ? items : items.filter((i) => i.agentType === filter)),
    [items, filter],
  );

  // Auto-select the first item on desktop for an email-like default view.
  useEffect(() => {
    if (selectedId) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches && filtered.length) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const tabs: { key: Filter; label: string; colour: string | null }[] = [
    { key: "ALL", label: "All", colour: null },
    ...AGENT_TYPES.map((t) => ({
      key: t as Filter,
      label: AGENT_META[t].short,
      colour: AGENT_META[t].colour,
    })),
  ];

  function countFor(key: Filter) {
    return key === "ALL" ? items.length : items.filter((i) => i.agentType === key).length;
  }

  function selectFilter(key: Filter) {
    setFilter(key);
    const next = key === "ALL" ? items : items.filter((i) => i.agentType === key);
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      setSelectedId(next[0]?.id ?? null);
    } else {
      setSelectedId(null);
    }
  }

  function handleResolved(id: string) {
    const remaining = items.filter((i) => i.id !== id);
    setItems(remaining);
    // Select the next item in the current filter, if any.
    const inFilter =
      filter === "ALL" ? remaining : remaining.filter((i) => i.agentType === filter);
    setSelectedId(inFilter[0]?.id ?? null);
    // Refresh server components (sidebar badge, agent counts).
    router.refresh();
  }

  return (
    <div className="flex h-full min-h-0">
      {/* List column */}
      <div
        className={cn(
          "min-h-0 w-full flex-col border-r border-[var(--line)] bg-[var(--panel)] md:flex md:w-[360px] lg:w-[400px]",
          selected ? "hidden md:flex" : "flex",
        )}
      >
        {/* Filter tabs */}
        <div className="scroll-thin flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--line)] px-3 py-2.5">
          {tabs.map((t) => {
            const active = filter === t.key;
            const count = countFor(t.key);
            return (
              <button
                key={t.key}
                onClick={() => selectFilter(t.key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition",
                  active
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--ink-2)] hover:bg-[var(--panel-2)]",
                )}
              >
                {t.colour ? (
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: t.colour }}
                  />
                ) : null}
                {t.label}
                {count > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] font-semibold",
                      active ? "bg-white/20" : "bg-[var(--panel-2)] text-[var(--ink-3)]",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Item list */}
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<InboxIcon className="h-5 w-5" />}
                title="Inbox zero"
                body="Nothing waiting for your approval. Agents will drop drafts here as they run."
              />
            </div>
          ) : (
            <ul>
              {filtered.map((item) => {
                const meta = AGENT_META[item.agentType];
                const active = item.id === selectedId;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        "flex w-full flex-col gap-1 border-b border-[var(--line-2)] px-4 py-3 text-left transition",
                        active ? "bg-[var(--panel-2)]" : "hover:bg-[var(--panel-2)]",
                      )}
                    >
                      <div className="flex items-center gap-2 text-[11px] text-[var(--ink-3)]">
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ background: meta.colour }}
                        />
                        <span className="font-medium text-[var(--ink-2)]">
                          {itemTypeLabel(item.type)}
                        </span>
                        <span className="ml-auto">{timeAgo(item.createdAt)}</span>
                      </div>
                      <span className="line-clamp-1 text-sm font-semibold text-[var(--ink)]">
                        {item.title}
                      </span>
                      {item.description ? (
                        <span className="line-clamp-2 text-xs leading-relaxed text-[var(--ink-2)]">
                          {item.description}
                        </span>
                      ) : null}
                      {item.estimatedImpact || item.edited ? (
                        <span className="mt-0.5 flex items-center gap-2">
                          {item.estimatedImpact ? (
                            <span className="rounded-full bg-[var(--accent)]/8 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                              {item.estimatedImpact}
                            </span>
                          ) : null}
                          {item.edited ? (
                            <span className="rounded-full bg-[var(--panel-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink-3)]">
                              edited
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Detail column */}
      <div
        className={cn(
          "min-h-0 flex-1 flex-col bg-[var(--panel)] md:flex",
          selected ? "flex" : "hidden md:flex",
        )}
      >
        {selected ? (
          <>
            {/* Mobile back bar */}
            <button
              onClick={() => setSelectedId(null)}
              className="flex shrink-0 items-center gap-1.5 border-b border-[var(--line)] px-4 py-2.5 text-sm font-medium text-[var(--ink-2)] md:hidden"
            >
              <ArrowLeft className="h-4 w-4" /> Inbox
            </button>
            <div className="min-h-0 flex-1">
              <InboxDetail key={selected.id} item={selected} onResolved={handleResolved} />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--panel-2)] text-[var(--ink-3)]">
                <InboxIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-[var(--ink)]">Select an item to review</p>
              <p className="mt-1 text-sm text-[var(--ink-2)]">
                Approve, edit or reject drafts your agents have prepared.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
