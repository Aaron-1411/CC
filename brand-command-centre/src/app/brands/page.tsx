import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { getBrands, getPendingCount } from "@/lib/queries";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const brands = await getBrands();
  const pending = await Promise.all(brands.map((b) => getPendingCount(b.id)));

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Your brands</h1>
          <p className="mt-1 text-sm text-[var(--ink-2)]">
            Pick a brand to open its command centre.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add brand
        </Link>
      </div>

      {brands.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel)] px-6 py-14 text-center">
          <h3 className="text-sm font-semibold text-[var(--ink)]">No brands yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--ink-2)]">
            Add your first brand to run an audit and switch on the agents.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add brand
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {brands.map((b, i) => (
            <li key={b.id}>
              <Link
                href={`/brands/${b.id}`}
                className="group flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3.5 transition hover:border-[var(--ink-3)]"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ background: b.primaryColour ?? "var(--ink)" }}
                >
                  {b.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                    {b.name}
                  </span>
                  <span className="block truncate text-xs text-[var(--ink-3)]">
                    {b.url.replace(/^https?:\/\//, "")}
                  </span>
                </span>
                {pending[i] > 0 ? (
                  <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                    {pending[i]} pending
                  </span>
                ) : null}
                <ArrowRight className="h-4 w-4 text-[var(--ink-3)] transition group-hover:translate-x-0.5 group-hover:text-[var(--ink)]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
