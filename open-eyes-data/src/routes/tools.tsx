import { createFileRoute, Link } from "@tanstack/react-router";
import { TOOL_SECTIONS, TOTAL_TOOLS } from "@/data/tools";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "All tools — transparenC" },
      {
        name: "description",
        content:
          "Every transparenC tool in one place: party pledges, contracts, MP expenses, NHS performance, petitions, lobbying, sewage data and more — all built on open public data.",
      },
      { property: "og:title", content: "All tools — transparenC" },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  return (
    <div className="max-w-5xl space-y-10">
      <section className="pt-2 space-y-3">
        <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">
          {TOTAL_TOOLS} tools
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black leading-tight">
          Everything on transparenC
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
          The full directory. New here? Start with{" "}
          <Link to="/issues" className="text-amber hover:underline">
            Issues
          </Link>{" "}
          or the{" "}
          <Link to="/learn" className="text-amber hover:underline">
            Learn
          </Link>{" "}
          guide. Otherwise, jump straight to any tool below.
        </p>
      </section>

      {TOOL_SECTIONS.map((section) => (
        <section key={section.label} className="space-y-3">
          <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {section.label}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {section.tools.map((tool) => (
              <Link
                key={tool.to}
                to={tool.to}
                className="group flex flex-col bg-surface border border-border rounded-lg px-4 py-3 hover:border-amber/40 hover:bg-surface-2 transition-colors"
              >
                <span className="font-display text-sm font-semibold group-hover:text-amber transition-colors leading-snug">
                  {tool.label}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {tool.copy}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
