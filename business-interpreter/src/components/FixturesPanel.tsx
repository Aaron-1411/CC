import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  listFixtures,
  runFixture,
  runAllFixturesForProcess,
  deleteFixture,
} from "@/lib/fixtures.functions";
import { Play, Trash2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
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

export function FixturesPanel({ processId }: { processId: string }) {
  const list = useServerFn(listFixtures);
  const runOne = useServerFn(runFixture);
  const runAll = useServerFn(runAllFixturesForProcess);
  const del = useServerFn(deleteFixture);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [allBusy, setAllBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["fixtures", processId],
    queryFn: () => list({ data: { processId } }),
  });

  async function onRun(id: string) {
    setBusyId(id);
    try {
      await runOne({ data: { id } });
      refetch();
    } finally {
      setBusyId(null);
    }
  }
  async function onRunAll() {
    setAllBusy(true);
    try {
      await runAll({ data: { processId } });
      refetch();
    } finally {
      setAllBusy(false);
    }
  }
  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await del({ data: { id: pendingDelete.id } });
      setPendingDelete(null);
      refetch();
    } finally {
      setDeleting(false);
    }
  }

  if (isLoading) return null;
  const fixtures = data?.fixtures ?? [];

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Golden-file regression fixtures</h2>
          <p className="text-xs text-muted-foreground">
            Each fixture re-runs the saved typed plan on the saved input and diffs against the
            approved output. Failures mean drift.
          </p>
        </div>
        {fixtures.length > 0 && (
          <button
            onClick={onRunAll}
            disabled={allBusy}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${allBusy ? "animate-spin" : ""}`} /> Run all
          </button>
        )}
      </div>
      {fixtures.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
          No fixtures yet. After approving an Excel run, save it as a fixture from the job page.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {fixtures.map((f: any) => {
            const status = f.last_run_status as string | null;
            const diff = f.last_run_diff as { diff_count?: number; cells_compared?: number } | null;
            return (
              <li key={f.id} className="p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={status} />
                      <span className="font-medium">{f.name}</span>
                      <span className="text-xs text-muted-foreground">
                        tol {Number(f.tolerance_numeric)}
                      </span>
                    </div>
                    {f.description && (
                      <div className="text-xs text-muted-foreground">{f.description}</div>
                    )}
                    {f.last_run_at && (
                      <div className="text-xs text-muted-foreground">
                        Last run {new Date(f.last_run_at).toLocaleString()} ·{" "}
                        {diff?.cells_compared ?? 0} cells · {diff?.diff_count ?? 0} diffs
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onRun(f.id)}
                      disabled={busyId === f.id}
                      className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                    >
                      <Play className="h-3 w-3" />
                      {busyId === f.id ? "Running…" : "Run"}
                    </button>
                    <button
                      onClick={() => setPendingDelete({ id: f.id, name: f.name })}
                      aria-label={`Delete fixture ${f.name}`}
                      className="rounded border border-border p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this fixture?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.name}" and its saved plan and golden-file diff will be permanently removed. This can't be undone.`
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
              {deleting ? "Deleting…" : "Delete fixture"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function StatusIcon({ status }: { status: string | null }) {
  if (status === "pass") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "fail") return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  if (status === "exec_error") return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
  return <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />;
}
