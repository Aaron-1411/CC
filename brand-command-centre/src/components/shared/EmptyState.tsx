import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  actionHref,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel)] px-6 py-14 text-center">
      {icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--panel-2)] text-[var(--ink-3)]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--ink-2)]">{body}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center rounded-lg bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
