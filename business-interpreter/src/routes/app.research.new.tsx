import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createJob } from "@/lib/jobs.functions";
import { runResearch } from "@/lib/research.functions";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/app" })}
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <h1 className="text-3xl font-semibold tracking-tight">New competitor research</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us about the business. We&apos;ll search the web, scrape competitor sites, and compile
        a structured comparison.
      </p>

      <form onSubmit={start} className="mt-8 space-y-5 rounded-xl border border-border bg-card p-6">
        <div className="space-y-1.5">
          <Label htmlFor="subjectName">Business name</Label>
          <Input
            id="subjectName"
            required
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="Acme Co."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subjectUrl">Website (optional)</Label>
          <Input
            id="subjectUrl"
            type="url"
            value={subjectUrl}
            onChange={(e) => setSubjectUrl(e.target.value)}
            placeholder="https://acme.example"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Services/products (optional — improves search)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Project management software for small construction firms"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxCompetitors">Competitors to research: {maxCompetitors}</Label>
          <input
            id="maxCompetitors"
            type="range"
            min={1}
            max={8}
            value={maxCompetitors}
            onChange={(e) => setMaxCompetitors(parseInt(e.target.value, 10))}
            className="mt-1 w-full accent-primary"
          />
        </div>
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy || !subjectName} className="w-full">
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Researching…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Run research
            </>
          )}
        </Button>
        {busy ? (
          <p className="text-center text-xs text-muted-foreground">
            This takes 30s–2min — scraping each competitor takes a moment.
          </p>
        ) : null}
      </form>
    </div>
  );
}
