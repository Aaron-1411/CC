import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowRight,
  FileSpreadsheet,
  Search,
  Table2,
  Microscope,
  ShieldCheck,
  Workflow,
} from "lucide-react";
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
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Workflow className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight">Workbench</span>
          </span>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <section className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Numbers computed by code, not guessed by a model
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            The workbench for spreadsheets you can actually trust.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Reshape exports with 26 plain-English transforms, run live formulas, map any workbook,
            and compile sourced competitor research — every step logged, reproducible, and verifiable.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#capabilities"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              See what it does
            </a>
          </div>
        </section>

        <section id="capabilities" className="mt-24 grid gap-5 sm:grid-cols-2">
          <FeatureCard
            icon={<Table2 className="h-5 w-5" />}
            title="Plain-English reporting"
            body="Transpose, pivot, group, bin, rank, running totals and 20 more transforms — chained into a pipeline. The deterministic engine is exhaustively unit-tested, so the figures are exact every time."
          />
          <FeatureCard
            icon={<FileSpreadsheet className="h-5 w-5" />}
            title="Spreadsheet automation"
            body="Upload .xlsx and drive it in plain English: copy ranges, write formulas, fill down across sheets, build a master summary. Every step is logged and reproducible."
          />
          <FeatureCard
            icon={<Microscope className="h-5 w-5" />}
            title="Sheet analyzer"
            body="Hand it any workbook and it maps every tab, traces data lineage, asks the context questions it needs, and writes a plain-English explainer of how the model works."
          />
          <FeatureCard
            icon={<Search className="h-5 w-5" />}
            title="Deep competitor research"
            body="Point it at your business. It searches the web, scrapes competitor sites for pricing and positioning, and returns a structured comparison with sources and confidence scores."
          />
        </section>

        <section className="mt-24 rounded-2xl border border-border bg-card px-8 py-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Reusable processes, not one-off prompts
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Author a standard operating procedure once — say, your monthly board pack — and the agent
            runs it the same way every time, with review gates and AI checks at each step.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start working <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Workbench — spreadsheet automation & competitor research
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
    <div className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
