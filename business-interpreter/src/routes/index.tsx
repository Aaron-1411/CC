import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, FileSpreadsheet, Search, Sparkles, Workflow } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workbench — Spreadsheet automation & competitor research" },
      {
        name: "description",
        content:
          "Upload spreadsheets, run plain-English transformations with live formulas, write commentary, and compile deep competitor research in one workbench.",
      },
      { property: "og:title", content: "Workbench" },
      {
        property: "og:description",
        content:
          "Spreadsheet automation, formula execution, written commentary, and competitor research — driven by plain-English instructions.",
      },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/app" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            <span className="font-semibold">Workbench</span>
          </div>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <section className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Instructable reporting & research
          </span>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight">
            Tell it what to do.
            <br />
            <span className="text-muted-foreground">Get the workbook back done.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Drop in an Excel export. Type instructions like &ldquo;copy Raw A1:H500 to Working,
            VLOOKUP region from Lookups, summarize totals into Master.&rdquo; Watch every step run
            with live formulas, then download the result.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start working <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-24 grid gap-6 md:grid-cols-2">
          <FeatureCard
            icon={<FileSpreadsheet className="h-5 w-5" />}
            title="Spreadsheet automation"
            body="Upload .xlsx, drive it with plain English: copy ranges, write formulas, fill down across sheets, build a master summary, generate commentary. Every step is logged and reproducible."
          />
          <FeatureCard
            icon={<Search className="h-5 w-5" />}
            title="Deep competitor research"
            body="Point it at your business. It scrapes competitor sites for pricing, plans, incentives, and positioning, and gives you a structured comparison with sources and confidence scores."
          />
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Workbench
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
