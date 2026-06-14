import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  getRun,
  advanceRun,
  resolveStep,
  recordCorrection,
  type ProcessStep,
  type StepResult,
} from "@/lib/processes.functions";
import { CheckCircle2, XCircle, Clock, AlertCircle, Play, SkipForward, MessageSquarePlus } from "lucide-react";

export const Route = createFileRoute("/app/runs/$id")({
  component: RunPage,
});

function RunPage() {
  const { id } = Route.useParams();
  const get = useServerFn(getRun);
  const advance = useServerFn(advanceRun);
  const resolve = useServerFn(resolveStep);
  const correct = useServerFn(recordCorrection);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["run", id],
    queryFn: () => get({ data: { id } }),
  });

  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [note, setNote] = useState("");
  const [correctionNote, setCorrectionNote] = useState("");
  const [correctionFor, setCorrectionFor] = useState<number | null>(null);

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const run = data.run as any;
  const steps = (run.steps_snapshot as ProcessStep[]) ?? [];
  const results = (run.step_results as StepResult[]) ?? [];
  const cursor: number = run.current_step;
  const currentStep = steps[cursor];

  async function runAdvance() {
    setBusy(true);
    try {
      await advance({ data: { runId: id } });
      refetch();
    } finally {
      setBusy(false);
    }
  }

  async function onDecision(decision: "approve" | "reject" | "skip") {
    setBusy(true);
    try {
      await resolve({
        data: {
          runId: id,
          decision,
          userInput: input || undefined,
          note: note || undefined,
        },
      });
      setInput("");
      setNote("");
      if (decision !== "reject") await advance({ data: { runId: id } });
      refetch();
    } finally {
      setBusy(false);
    }
  }

  async function saveCorrection(idx: number) {
    if (!correctionNote.trim()) return;
    setBusy(true);
    try {
      await correct({
        data: {
          processId: run.process_id,
          runId: id,
          stepIndex: idx,
          original: steps[idx] as unknown,
          corrected: { note: correctionNote },
          note: correctionNote,
        },
      });
      setCorrectionNote("");
      setCorrectionFor(null);
      refetch();
    } finally {
      setBusy(false);
    }
  }

  const statusBadge: Record<string, string> = {
    running: "bg-blue-500/20 text-blue-500",
    paused: "bg-amber-500/20 text-amber-500",
    awaiting_gate: "bg-amber-500/20 text-amber-500",
    completed: "bg-emerald-500/20 text-emerald-500",
    failed: "bg-red-500/20 text-red-500",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-1">
        <Link
          to="/app/processes/$id"
          params={{ id: run.process_id }}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← {run.processes?.name}
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Run · step {Math.min(cursor + 1, steps.length)} of {steps.length}
          </h1>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadge[run.status]}`}>
            {run.status}
          </span>
        </div>
      </header>

      <ol className="space-y-2">
        {steps.map((s, i) => {
          const r = results[i];
          const isCurrent = i === cursor && run.status !== "completed" && run.status !== "failed";
          return (
            <li
              key={s.id}
              className={`rounded-md border bg-card p-3 ${isCurrent ? "border-primary" : "border-border"}`}
            >
              <div className="flex items-start gap-3">
                <StepIcon status={r?.status} isCurrent={isCurrent} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{i + 1}.</span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {s.kind}
                    </span>
                    <span className="font-medium">{s.title}</span>
                  </div>
                  {s.description && (
                    <div className="text-xs text-muted-foreground">{s.description}</div>
                  )}
                  {s.criteria && s.criteria.length > 0 && (
                    <ul className="ml-3 list-disc text-xs text-muted-foreground">
                      {s.criteria.map((c, k) => (
                        <li key={k}>{c}</li>
                      ))}
                    </ul>
                  )}

                  {r?.output && (
                    <div className="mt-1 rounded bg-muted/40 p-2 text-xs">{r.output}</div>
                  )}
                  {r?.issues && r.issues.length > 0 && (
                    <ul className="mt-1 ml-3 list-disc text-xs text-red-500">
                      {r.issues.map((iss, k) => (
                        <li key={k}>{iss}</li>
                      ))}
                    </ul>
                  )}
                  {r?.user_input && (
                    <div className="mt-1 text-xs">
                      <span className="text-muted-foreground">Input:</span> {r.user_input}
                    </div>
                  )}
                  {r?.note && (
                    <div className="mt-1 text-xs">
                      <span className="text-muted-foreground">Note:</span> {r.note}
                    </div>
                  )}

                  {isCurrent && (run.status === "awaiting_gate" || run.status === "paused") && (
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      {s.kind === "input" && (
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={s.inputLabel ?? "Your input"}
                          className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                        />
                      )}
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional note for audit trail"
                        className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
                        rows={2}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={busy}
                          onClick={() => onDecision("approve")}
                          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => onDecision("skip")}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
                        >
                          <SkipForward className="h-3.5 w-3.5" /> Skip
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => onDecision("reject")}
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {r && (
                    <div className="mt-2">
                      {correctionFor === i ? (
                        <div className="space-y-1">
                          <textarea
                            value={correctionNote}
                            onChange={(e) => setCorrectionNote(e.target.value)}
                            placeholder="What was wrong / how should it be done?"
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveCorrection(i)}
                              className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground"
                            >
                              Save correction
                            </button>
                            <button
                              onClick={() => setCorrectionFor(null)}
                              className="text-xs text-muted-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCorrectionFor(i)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <MessageSquarePlus className="h-3 w-3" /> Record correction
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {run.status === "running" && (
        <button
          onClick={runAdvance}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Play className="h-4 w-4" /> {busy ? "Running…" : "Run next steps"}
        </button>
      )}
      {run.status === "completed" && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-500">
          Process completed.
        </div>
      )}
      {run.status === "failed" && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
          Failed: {run.error ?? "unknown"}
        </div>
      )}
    </div>
  );
}

function StepIcon({ status, isCurrent }: { status?: string; isCurrent: boolean }) {
  if (status === "passed") return <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />;
  if (status === "failed") return <AlertCircle className="mt-0.5 h-4 w-4 text-red-500" />;
  if (status === "skipped") return <SkipForward className="mt-0.5 h-4 w-4 text-muted-foreground" />;
  if (status === "awaiting" || isCurrent) return <Clock className="mt-0.5 h-4 w-4 text-amber-500" />;
  return <Clock className="mt-0.5 h-4 w-4 text-muted-foreground/50" />;
}
