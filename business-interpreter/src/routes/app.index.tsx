import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createJob, listJobs, deleteJob } from "@/lib/jobs.functions";
import { FileSpreadsheet, Search, Plus, Trash2, Table2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Jobs — Workbench" }] }),
  component: Dashboard,
});

type JobSummary = { id: string; type: string; title: string; updated_at: string };

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listJobs);
  const create = useServerFn(createJob);
  const del = useServerFn(deleteJob);
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: () => list() });

  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<JobSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function newSpreadsheetJob() {
    setCreating(true);
    try {
      const job = await create({ data: { type: "spreadsheet", title: "New spreadsheet job" } });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      navigate({ to: "/app/jobs/$jobId", params: { jobId: job.id } });
    } catch {
      toast.error("Couldn't create the job. Please try again.");
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await del({ data: { id: pendingDelete.id } });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success(`Deleted "${pendingDelete.title}".`);
      setPendingDelete(null);
    } catch {
      toast.error("Couldn't delete the job. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each job is one workbook or research run with its own chat history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={newSpreadsheetJob} disabled={creating}>
            <Plus className="h-4 w-4" /> {creating ? "Creating…" : "New spreadsheet job"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/research/new">
              <Search className="h-4 w-4" /> New research
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/reporting">
              <Table2 className="h-4 w-4" /> Reporting
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card">
        {isLoading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-4">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </li>
            ))}
          </ul>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileSpreadsheet className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-base font-semibold">No jobs yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Start a spreadsheet job to automate a workbook, or kick off a competitor research run.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button onClick={newSpreadsheetJob} disabled={creating}>
                <Plus className="h-4 w-4" /> {creating ? "Creating…" : "New spreadsheet job"}
              </Button>
              <Button asChild variant="outline">
                <Link to="/app/research/new">
                  <Search className="h-4 w-4" /> New research
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {jobs.map((j) => (
              <li
                key={j.id}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-accent/30"
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
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${j.title}`}
                  onClick={() => setPendingDelete(j)}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.title}" and all of its data and chat history will be permanently removed. This can't be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
