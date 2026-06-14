import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Loader2, MessageSquare, ShieldCheck, XCircle } from "lucide-react";
import {
  recordApproval,
  editCellAndRevalidate,
  draftCommentary,
  updateCommentary,
  getJobReview,
} from "@/lib/review.functions";

type Cell = { sheet: string; cell: string };
type Reconciliation = {
  summary: Cell;
  summary_value: number | string | null;
  recomputed_value: number | string | null;
  delta: number | null;
  delta_pct: number | null;
  classification: "match" | "rounding" | "mismatch" | "non-numeric";
  formula?: string;
};
type LineageNode = {
  ref: Cell;
  formula?: string;
  value: number | string | boolean | null;
  children: LineageNode[];
  source?: string;
};
type Anomaly = {
  kind: string;
  severity: "info" | "warn" | "fail";
  ref?: Cell;
  message: string;
};
type Scorecard = {
  pass: number; warn: number; fail: number;
  status: "pass" | "warn" | "fail";
  summary_cells_checked: number;
  formulas_checked: number;
};
type ValidationReport = {
  id: string;
  workbook_id: string;
  status: string;
  scorecard: Scorecard;
  reconciliation: Reconciliation[];
  lineage: LineageNode[];
  anomalies: Anomaly[];
  formula_errors: { sheet: string; cell: string; error: string; formula?: string }[];
};
type CommentaryDraft = {
  id: string;
  validation_report_id: string;
  workbook_id: string;
  status: string;
  body_markdown: string;
  citations: { label: string; value: string; sheet: string; cell: string }[];
};

export function ReviewPanel({ jobId }: { jobId: string }) {
  const qc = useQueryClient();
  const fetchReview = useServerFn(getJobReview);
  const approve = useServerFn(recordApproval);
  const editCell = useServerFn(editCellAndRevalidate);
  const draft = useServerFn(draftCommentary);
  const updateC = useServerFn(updateCommentary);

  const { data, isLoading } = useQuery({
    queryKey: ["review", jobId],
    queryFn: () => fetchReview({ data: { jobId } }),
    refetchInterval: 4000,
  });

  if (isLoading || !data) return null;

  const latestVR = data.validationReports[0] as unknown as ValidationReport | undefined;
  const latestCD = data.commentaryDrafts.find((c) => (c as { validation_report_id: string }).validation_report_id === latestVR?.id) as unknown as CommentaryDraft | undefined;

  if (!latestVR) return null;

  const status = latestVR.status;
  const sc = latestVR.scorecard;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4" /> Gate 1 · Validation review
        </h3>
        <StatusBadge status={sc.status} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="Pass" value={sc.pass} tone="ok" />
        <Stat label="Warn" value={sc.warn} tone="warn" />
        <Stat label="Fail" value={sc.fail} tone="fail" />
      </div>

      {latestVR.reconciliation.length > 0 ? (
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Reconciliation</div>
          <ReconciliationTable
            rows={latestVR.reconciliation}
            lineage={latestVR.lineage}
            onEdit={async (sheet, cell, value, isFormula) => {
              await editCell({ data: { jobId, workbookId: latestVR.workbook_id, validationReportId: latestVR.id, sheet, cell, newValue: value, isFormula } });
              qc.invalidateQueries({ queryKey: ["review", jobId] });
              qc.invalidateQueries({ queryKey: ["job", jobId] });
            }}
          />
        </div>
      ) : null}

      {latestVR.anomalies.length > 0 ? (
        <details className="text-xs">
          <summary className="cursor-pointer font-medium text-muted-foreground">
            Anomalies ({latestVR.anomalies.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {latestVR.anomalies.slice(0, 30).map((a, i) => (
              <li key={i} className="flex gap-2">
                <SeverityDot s={a.severity} />
                <span className="text-muted-foreground">
                  {a.ref ? <code className="rounded bg-muted px-1">{a.ref.sheet}!{a.ref.cell}</code> : null} {a.message}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {status === "pending" || status === "changes_requested" ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <button
            onClick={async () => {
              await approve({ data: { jobId, gate: "validation", targetId: latestVR.id, decision: "approve" } });
              await draft({ data: { jobId, workbookId: latestVR.workbook_id, validationReportId: latestVR.id } });
              qc.invalidateQueries({ queryKey: ["review", jobId] });
            }}
            className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
          >
            Approve & draft commentary
          </button>
          <ChangesButton onSubmit={async (note) => {
            await approve({ data: { jobId, gate: "validation", targetId: latestVR.id, decision: "changes", note } });
            qc.invalidateQueries({ queryKey: ["review", jobId] });
          }} />
          <button
            onClick={async () => {
              await approve({ data: { jobId, gate: "validation", targetId: latestVR.id, decision: "reject" } });
              qc.invalidateQueries({ queryKey: ["review", jobId] });
            }}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
          >
            Reject
          </button>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">Validation {status.replace("_", " ")}.</div>
      )}

      {latestCD ? (
        <CommentaryReview
          draft={latestCD}
          onSave={async (body) => {
            await updateC({ data: { id: latestCD.id, body_markdown: body } });
            qc.invalidateQueries({ queryKey: ["review", jobId] });
          }}
          onApprove={async () => {
            await approve({ data: { jobId, gate: "commentary", targetId: latestCD.id, decision: "approve" } });
            qc.invalidateQueries({ queryKey: ["review", jobId] });
          }}
          onChanges={async (note) => {
            await approve({ data: { jobId, gate: "commentary", targetId: latestCD.id, decision: "changes", note } });
            qc.invalidateQueries({ queryKey: ["review", jobId] });
          }}
          onReject={async () => {
            await approve({ data: { jobId, gate: "commentary", targetId: latestCD.id, decision: "reject" } });
            qc.invalidateQueries({ queryKey: ["review", jobId] });
          }}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "ok" | "warn" | "fail" }) {
  const cls = tone === "ok" ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : tone === "warn" ? "border-amber-500/40 text-amber-600 dark:text-amber-400" : "border-red-500/40 text-red-600 dark:text-red-400";
  return (
    <div className={`rounded-md border bg-background p-2 ${cls}`}>
      <div className="text-lg font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: "pass" | "warn" | "fail" }) {
  const map = {
    pass: { Icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Pass" },
    warn: { Icon: AlertTriangle, cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Review" },
    fail: { Icon: XCircle, cls: "bg-red-500/10 text-red-600 dark:text-red-400", label: "Fail" },
  } as const;
  const { Icon, cls, label } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cls}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function SeverityDot({ s }: { s: "info" | "warn" | "fail" }) {
  const cls = s === "fail" ? "bg-red-500" : s === "warn" ? "bg-amber-500" : "bg-blue-500";
  return <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${cls}`} />;
}

function ReconciliationTable({
  rows, lineage, onEdit,
}: {
  rows: Reconciliation[];
  lineage: LineageNode[];
  onEdit: (sheet: string, cell: string, value: string | number, isFormula: boolean) => Promise<void>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="overflow-hidden rounded-md border border-border text-xs">
      <table className="min-w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-2 py-1 text-left font-medium">Cell</th>
            <th className="px-2 py-1 text-right font-medium">Summary</th>
            <th className="px-2 py-1 text-right font-medium">Recomputed</th>
            <th className="px-2 py-1 text-right font-medium">Δ</th>
            <th className="px-2 py-1 text-left font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const key = `${r.summary.sheet}!${r.summary.cell}`;
            const isOpen = open === key;
            const node = lineage.find((n) => n.ref.sheet === r.summary.sheet && n.ref.cell === r.summary.cell);
            const cls = r.classification === "mismatch" ? "text-red-600 dark:text-red-400" : r.classification === "rounding" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";
            return (
              <>
                <tr key={key} className="border-t border-border">
                  <td className="px-2 py-1 font-mono">
                    <button onClick={() => setOpen(isOpen ? null : key)} className="inline-flex items-center gap-1 hover:underline">
                      {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      {key}
                    </button>
                  </td>
                  <td className="px-2 py-1 text-right">
                    <EditableValue
                      value={r.summary_value}
                      onSave={(v) => onEdit(r.summary.sheet, r.summary.cell, v, typeof v === "string" && v.startsWith("="))}
                    />
                  </td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{r.recomputed_value ?? "—"}</td>
                  <td className={`px-2 py-1 text-right ${cls}`}>
                    {r.delta == null ? "—" : r.delta_pct == null ? r.delta : `${r.delta.toFixed(2)} (${(r.delta_pct * 100).toFixed(1)}%)`}
                  </td>
                  <td className="px-2 py-1 text-muted-foreground">{r.classification}</td>
                </tr>
                {isOpen && node ? (
                  <tr className="border-t border-border bg-muted/20">
                    <td colSpan={5} className="px-2 py-2">
                      <div className="text-[11px] text-muted-foreground">Formula: <code>{r.formula ?? ""}</code></div>
                      <LineageTree node={node} depth={0} />
                    </td>
                  </tr>
                ) : null}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LineageTree({ node, depth }: { node: LineageNode; depth: number }) {
  return (
    <div style={{ marginLeft: depth * 12 }} className="text-[11px]">
      <span className="font-mono">{node.ref.sheet}!{node.ref.cell}</span>
      {node.formula ? <span className="ml-2 text-muted-foreground">= {node.formula}</span> : null}
      <span className="ml-2 text-foreground">{node.value == null ? "" : String(node.value)}</span>
      {node.children.map((c, i) => (
        <LineageTree key={i} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

function EditableValue({
  value, onSave,
}: {
  value: number | string | null;
  onSave: (v: string | number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value == null ? "" : String(value));
  const [busy, setBusy] = useState(false);
  if (!editing) {
    return (
      <button onClick={() => { setDraft(value == null ? "" : String(value)); setEditing(true); }} className="rounded px-1 hover:bg-accent">
        {value ?? "—"}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-24 rounded border border-input bg-background px-1 text-right"
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            setBusy(true);
            const v = /^-?\d+(\.\d+)?$/.test(draft) ? Number(draft) : draft;
            await onSave(v);
            setBusy(false);
            setEditing(false);
          } else if (e.key === "Escape") setEditing(false);
        }}
      />
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
    </span>
  );
}

function ChangesButton({ onSubmit }: { onSubmit: (note: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">
        Request changes
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What needs fixing?"
        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
      />
      <button
        onClick={async () => { await onSubmit(note); setOpen(false); setNote(""); }}
        className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
      >
        Send
      </button>
    </div>
  );
}

function CommentaryReview({
  draft, onSave, onApprove, onChanges, onReject,
}: {
  draft: CommentaryDraft;
  onSave: (body: string) => Promise<void>;
  onApprove: () => Promise<void>;
  onChanges: (note: string) => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const [body, setBody] = useState(draft.body_markdown);
  const [editing, setEditing] = useState(false);
  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4" /> Gate 2 · Commentary review
        </h4>
        <span className="text-xs text-muted-foreground">{draft.status.replace("_", " ")}</span>
      </div>
      {editing ? (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full rounded-md border border-input bg-background p-2 text-sm font-mono"
        />
      ) : (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
      )}
      {draft.citations.length > 0 ? (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">Citations ({draft.citations.length})</summary>
          <ul className="mt-1">
            {draft.citations.map((c, i) => (
              <li key={i}>
                <code className="rounded bg-muted px-1">{c.sheet}!{c.cell}</code> {c.label}: {c.value}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {draft.status === "draft" || draft.status === "changes_requested" ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {editing ? (
            <button
              onClick={async () => { await onSave(body); setEditing(false); }}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              Save edits
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">
              Edit
            </button>
          )}
          <button onClick={onApprove} className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90">
            Approve & finalize
          </button>
          <ChangesButton onSubmit={onChanges} />
          <button onClick={onReject} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">
            Reject
          </button>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">Commentary {draft.status.replace("_", " ")}.</div>
      )}
    </div>
  );
}
