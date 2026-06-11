import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export function TopBar({
  brandId,
  brandName,
  brandUrl,
  lastAuditAt,
}: {
  brandId: string;
  brandName: string;
  brandUrl: string;
  lastAuditAt: Date | null;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel)] px-4 md:px-6">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <span className="truncate text-sm font-semibold text-[var(--ink)]">{brandName}</span>
        <a
          href={brandUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="hidden items-center gap-1 truncate text-xs text-[var(--ink-3)] hover:text-[var(--ink-2)] sm:inline-flex"
        >
          {brandUrl.replace(/^https?:\/\//, "")}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-[var(--ink-3)] sm:inline">
          {lastAuditAt ? `Last audit ${timeAgo(lastAuditAt)}` : "No audit yet"}
        </span>
        <Link
          href={`/brands/${brandId}/audit`}
          className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--panel-2)]"
        >
          Run audit
        </Link>
      </div>
    </header>
  );
}
