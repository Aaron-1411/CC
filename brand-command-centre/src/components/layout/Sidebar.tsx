"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Inbox,
  Zap,
  ClipboardList,
  History,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  badge?: number;
}

export function Sidebar({
  brandId,
  brandName,
  pendingCount,
}: {
  brandId: string;
  brandName: string;
  pendingCount: number;
}) {
  const pathname = usePathname();
  const base = `/brands/${brandId}`;

  const items: NavItem[] = [
    { href: base, label: "Home", icon: Home, exact: true },
    { href: `${base}/inbox`, label: "Inbox", icon: Inbox, badge: pendingCount },
    { href: `${base}/agents`, label: "Agents", icon: Zap },
    { href: `${base}/audit`, label: "Audit", icon: ClipboardList },
    { href: `${base}/history`, label: "History", icon: History },
    { href: `${base}/settings`, label: "Settings", icon: Settings },
  ];

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className="flex w-[64px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--panel)] md:w-60">
      {/* Brand header */}
      <Link
        href="/brands"
        className="flex items-center gap-2.5 border-b border-[var(--line)] px-3 py-3.5 md:px-4"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ink)] text-sm font-bold text-white">
          {brandName.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden min-w-0 flex-col md:flex">
          <span className="truncate text-sm font-semibold leading-tight text-[var(--ink)]">
            {brandName}
          </span>
          <span className="text-[11px] text-[var(--ink-3)]">Command Centre</span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2">
        {items.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition",
                active
                  ? "bg-[var(--panel-2)] text-[var(--ink)]"
                  : "text-[var(--ink-2)] hover:bg-[var(--panel-2)] hover:text-[var(--ink)]",
              )}
              title={item.label}
            >
              <Icon
                className={cn("h-[18px] w-[18px] shrink-0", active && "text-[var(--accent)]")}
                strokeWidth={2}
              />
              <span className="hidden md:inline">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span
                  className={cn(
                    "badge-pulse ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[11px] font-bold text-white",
                    "absolute right-1 top-1 md:static",
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--line)] p-2">
        <Link
          href="/onboarding"
          className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--ink-2)] transition hover:bg-[var(--panel-2)] hover:text-[var(--ink)]"
          title="Add brand"
        >
          <Plus className="h-[18px] w-[18px] shrink-0" />
          <span className="hidden md:inline">Add brand</span>
        </Link>
      </div>
    </aside>
  );
}
