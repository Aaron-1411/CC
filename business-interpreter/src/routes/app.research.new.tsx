import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createJob } from "@/lib/jobs.functions";
import { runResearch } from "@/lib/research.functions";
import { ArrowLeft, Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/app/research/new")({
  head: () => ({ meta: [{ title: "New research — Workbench" }] }),
  component: NewResearch,
});

function NewResearch() {
  const navigate = useNavigate();
  const create = useServerFn(createJob);
  const run = useServerFn(runResearch);
  const [subjectName, setSubjectName] = useState("");
  const [subjectUrl, setSubjectUrl] = useState("");
  const [description, setDescription] = useState("");
  const [maxCompetitors, setMaxCompetitors] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const job = await create({
        data: { type: "research", title: `Competitors — ${subjectName}` },
      });
      await run({
        data: {
          jobId: job.id,
          subjectName,
          subjectUrl: subjectUrl || undefined,
          description: description || undefined,
          maxCompetitors,
        },
      });
      navigate({ to: "/app/research/$jobId", params: { jobId: job.id } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <button
        onClick={() => navigate({ to: "/app" })}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-3xl font-semibold tracking-tight">New competitor research</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us about the business. We&apos;ll search the web, scrape competitor sites, and compile
        a structured comparison.
      </p>

      <form onSubmit={start} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
        <div>
          <label className="text-sm font-medium">Business name</label>
          <input
            required
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="Acme Co."
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Website (optional)</label>
          <input
            type="url"
            value={subjectUrl}
            onChange={(e) => setSubjectUrl(e.target.value)}
            placeholder="https://acme.example"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            Services/products (optional — improves search)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Project management software for small construction firms"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Competitors to research: {maxCompetitors}</label>
          <input
            type="range"
            min={1}
            max={8}
            value={maxCompetitors}
            onChange={(e) => setMaxCompetitors(parseInt(e.target.value, 10))}
            className="mt-1 w-full"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || !subjectName}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Researching…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Run research
            </>
          )}
        </button>
        {busy ? (
          <p className="text-center text-xs text-muted-foreground">
            This takes 30s–2min — scraping each competitor takes a moment.
          </p>
        ) : null}
      </form>
    </div>
  );
}
