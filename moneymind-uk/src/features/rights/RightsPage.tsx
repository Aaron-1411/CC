import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { clsx } from "clsx";
import { rights } from "../../content/rights";
import { PageContainer } from "../../components/PageContainer";
import { Card } from "../../components/Card";
import { Pill } from "../../components/Pill";

export function RightsPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  const categories = ["All", ...Array.from(new Set(rights.map((r) => r.category))).sort()];
  const q = query.trim().toLowerCase();
  const filtered = rights.filter((r) => {
    const matchCat = cat === "All" || r.category === cat;
    const matchQ = !q || r.title.toLowerCase().includes(q) || r.oneLineSummary.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <PageContainer className="py-10">
      <h1 className="text-3xl font-bold text-navy-900">Your Rights & Entitlements</h1>
      <p className="mt-2 max-w-2xl text-navy-500">
        A plain-English quick reference to things you're entitled to in the UK — at work, with money,
        benefits, housing and more. Every item links to the official gov.uk source.
      </p>

      {/* Search */}
      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your rights…"
          aria-label="Search your rights"
          className="w-full rounded-xl border border-navy-200 bg-white py-2.5 pl-10 pr-3 text-sm text-navy-900 outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        />
      </div>

      {/* Category filter */}
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              cat === c ? "bg-navy-900 text-white" : "bg-white text-navy-600 hover:bg-navy-100",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="mt-6 text-sm text-navy-400">{filtered.length} {filtered.length === 1 ? "entitlement" : "entitlements"}</p>
      {filtered.length === 0 ? (
        <Card className="mt-3 py-12 text-center text-navy-500">
          No matches — try a different search or category.
        </Card>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <Card key={r.title} className="flex flex-col gap-2" hover>
              <Pill variant="info" className="self-start">{r.category}</Pill>
              <h2 className="font-semibold leading-snug text-navy-900">{r.title}</h2>
              <p className="flex-1 text-sm leading-relaxed text-navy-500">{r.oneLineSummary}</p>
              <a
                href={r.govLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
              >
                {r.govLink.label} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
