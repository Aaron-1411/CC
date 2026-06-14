import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createJob, listJobs, deleteJob } from "@/lib/jobs.functions";
import { FileSpreadsheet, Search, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Jobs — Workbench" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listJobs);
  const create = useServerFn(createJob);
  const del = useServerFn(deleteJob);
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: () => list() });

  async function newSpreadsheetJob() {
    const job = await create({ data: { type: "spreadsheet", title: "New spreadsheet job" } });
    qc.invalidateQueries({ queryKey: ["jobs"] });
    navigate({ to: "/app/jobs/$jobId", params: { jobId: job.id } });
  }

  async function remove(id: string) {
    if (!confirm("Delete this job and all its data?")) return;
    await del({ data: { id } });
    qc.invalidateQueries({ queryKey: ["jobs"] });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each job is one workbook or research run with its own chat history.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={newSpreadsheetJob}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New spreadsheet job
          </button>
          <Link
            to="/app/research/new"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <Search className="h-4 w-4" /> New research
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">
            No jobs yet — start a new one above.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {jobs.map((j) => (
              <li
                key={j.id}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-accent/30"
              >
                <Link
                  to={j.type === "research" ? "/app/research/$jobId" : "/app/jobs/$jobId"}
                  params={{ jobId: j.id }}
                  className="flex flex-1 items-center gap-3"
                >
                  {j.type === "research" ? (
                    <Search className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-medium">{j.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(j.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => remove(j.id)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
