import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getJob, getWorkbookDownloadUrl, renameJob } from "@/lib/jobs.functions";
import { registerWorkbook } from "@/lib/upload.functions";
import { runInstruction, generateCommentary } from "@/lib/spreadsheet-agent.functions";
import { ReviewPanel } from "@/components/ReviewPanel";
import { PlanRunner } from "@/components/PlanRunner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, FileSpreadsheet, Loader2, Send, Sparkles, Upload } from "lucide-react";

type Snapshot = Awaited<ReturnType<typeof registerWorkbook>>["snapshot"];

export const Route = createFileRoute("/app/jobs/$jobId")({
  head: () => ({ meta: [{ title: "Spreadsheet job — Workbench" }] }),
  component: JobPage,
});

function JobPage() {
  const { jobId } = Route.useParams();
  const qc = useQueryClient();
  const get = useServerFn(getJob);
  const register = useServerFn(registerWorkbook);
  const run = useServerFn(runInstruction);
  const commentary = useServerFn(generateCommentary);
  const download = useServerFn(getWorkbookDownloadUrl);
  const rename = useServerFn(renameJob);

  const { data, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => get({ data: { id: jobId } }),
  });

  const [activeWorkbookId, setActiveWorkbookId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [uploading, setUploading] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [running, setRunning] = useState(false);
  const [titleEdit, setTitleEdit] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Once data loads, pick the most recent workbook as active
  useEffect(() => {
    if (!data) return;
    const latest = data.workbooks[data.workbooks.length - 1];
    if (latest && !activeWorkbookId) {
      setActiveWorkbookId(latest.id);
      setSnapshot({
        sheets:
          (latest.sheet_meta as { name: string; rows: number; cols: number }[] | null)?.map(
            (s) => ({
              name: s.name,
              rowCount: s.rows,
              colCount: s.cols,
              preview: [],
              formulas: {},
            }),
          ) ?? [],
      });
    }
  }, [data, activeWorkbookId]);

  useEffect(() => {
    composerRef.current?.focus();
  }, [jobId, running]);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      if (!/\.xlsx$/i.test(file.name)) {
        alert("Please upload an .xlsx file.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert("File is over 50MB — v1 limit.");
        return;
      }
      setUploading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user!.id;
        const path = `${uid}/${jobId}/source-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from("workbooks").upload(path, file, {
          contentType: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        if (error) throw error;
        const result = await register({
          data: { jobId, name: file.name, storagePath: path, sizeBytes: file.size },
        });
        setActiveWorkbookId(result.workbook.id);
        setSnapshot(result.snapshot);
        qc.invalidateQueries({ queryKey: ["job", jobId] });
      } catch (e) {
        alert(`Upload failed: ${(e as Error).message}`);
      } finally {
        setUploading(false);
      }
    },
    [jobId, register, qc],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    multiple: false,
  });

  async function send() {
    if (!instruction.trim() || !activeWorkbookId || running) return;
    const text = instruction.trim();
    setInstruction("");
    setRunning(true);
    try {
      const res = await run({
        data: { jobId, workbookId: activeWorkbookId, instruction: text },
      });
      setActiveWorkbookId(res.outputWorkbook.id);
      setSnapshot(res.snapshot);
      qc.invalidateQueries({ queryKey: ["job", jobId] });
    } catch (e) {
      alert(`Run failed: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  }

  async function writeCommentary() {
    if (!activeWorkbookId || running) return;
    setRunning(true);
    try {
      await commentary({ data: { jobId, workbookId: activeWorkbookId } });
      qc.invalidateQueries({ queryKey: ["job", jobId] });
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function doDownload(id: string) {
    const { url, name } = await download({ data: { workbookId: id } });
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sourceWb = data.workbooks.find((w) => w.kind === "source");
  const latestOutput = [...data.workbooks].reverse().find((w) => w.kind === "output");

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-5 py-3">
        <Link to="/app" className="rounded-md p-1 hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {titleEdit ? (
          <input
            autoFocus
            defaultValue={data.job.title}
            onBlur={async (e) => {
              await rename({ data: { id: jobId, title: e.target.value || "Untitled" } });
              qc.invalidateQueries({ queryKey: ["job", jobId] });
              qc.invalidateQueries({ queryKey: ["jobs"] });
              setTitleEdit(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          />
        ) : (
          <button onClick={() => setTitleEdit(true)} className="text-sm font-medium hover:underline">
            {data.job.title}
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {latestOutput ? (
            <button
              onClick={() => doDownload(latestOutput.id)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              <Download className="h-3.5 w-3.5" /> Download latest
            </button>
          ) : null}
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_1fr]">
        {/* LEFT: chat + composer */}
        <div className="flex flex-col border-r border-border">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {!sourceWb ? (
              <div
                {...getRootProps()}
                className={`flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">
                  {uploading ? "Uploading…" : "Drop an .xlsx file here, or click to browse"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Up to 50MB</p>
              </div>
            ) : null}

            {data.messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl border border-border p-4 ${
                  m.role === "user" ? "bg-card" : "bg-accent/30"
                }`}
              >
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {m.role}
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content ?? ""}</ReactMarkdown>
                </div>
                {m.step_log ? <StepLog log={m.step_log as StepLogShape} /> : null}
              </div>
            ))}
            {running ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Working…
              </div>
            ) : null}

            <ReviewPanel jobId={jobId} />

            <PlanRunner
              jobId={jobId}
              workbookId={activeWorkbookId}
              workbooks={data.workbooks.map((w) => ({ id: w.id, name: w.name, kind: w.kind }))}
              onDone={() => qc.invalidateQueries({ queryKey: ["job", jobId] })}
            />
          </div>


          <div className="border-t border-border bg-card p-3">
            <div className="flex gap-2">
              <textarea
                ref={composerRef}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
                }}
                placeholder={
                  sourceWb
                    ? "e.g. Copy Raw!A1:H500 to a new Working sheet, VLOOKUP region from Lookups col B, then sum by region into Master"
                    : "Upload a workbook to get started"
                }
                disabled={!sourceWb || running}
                rows={3}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={!sourceWb || running || !instruction.trim()}
                className="rounded-md bg-primary px-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {latestOutput ? (
              <button
                onClick={writeCommentary}
                disabled={running}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="h-3 w-3" /> Write commentary on latest output
              </button>
            ) : null}
          </div>
        </div>

        {/* RIGHT: workbook preview */}
        <div className="overflow-y-auto bg-muted/20 p-5">
          <h2 className="mb-3 text-sm font-semibold">Workbook</h2>
          {snapshot && snapshot.sheets.length > 0 ? (
            <div className="space-y-4">
              {snapshot.sheets.map((s) => (
                <SheetPreview key={s.name} sheet={s} />
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Preview appears here
            </div>
          )}
          {data.workbooks.length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Files
              </h3>
              <ul className="space-y-1">
                {data.workbooks.map((w) => (
                  <li key={w.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm">
                    <span className="truncate">
                      <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs">{w.kind}</span>
                      {w.name}
                    </span>
                    <button
                      onClick={() => doDownload(w.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SheetPreview({
  sheet,
}: {
  sheet: { name: string; rowCount: number; colCount: number; preview: (string | number | boolean | null)[][] };
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 text-sm">
        <span className="font-medium">{sheet.name}</span>
        <span className="text-xs text-muted-foreground">
          {sheet.rowCount} × {sheet.colCount}
        </span>
      </div>
      {sheet.preview.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <tbody>
              {sheet.preview.slice(0, 20).map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  {row.map((cell, j) => (
                    <td key={j} className="border-r border-border/50 px-2 py-1">
                      {cell == null ? "" : String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-4 text-xs text-muted-foreground">Run an instruction to populate.</p>
      )}
    </div>
  );
}

type StepLogShape = {
  steps?: { tool: string; args: unknown; result: unknown }[];
  errors?: { sheet: string; cell: string; error: string }[];
  kind?: string;
};

function StepLog({ log }: { log: StepLogShape }) {
  if (!log.steps && !log.errors) return null;
  return (
    <details className="mt-3 rounded-md border border-border/50 bg-background/50 p-2 text-xs">
      <summary className="cursor-pointer text-muted-foreground">
        Steps ({log.steps?.length ?? 0}){log.errors?.length ? ` · ${log.errors.length} formula errors` : ""}
      </summary>
      <ol className="mt-2 space-y-1 pl-4">
        {log.steps?.map((s, i) => (
          <li key={i}>
            <span className="font-mono text-primary">{s.tool}</span>
            <span className="text-muted-foreground"> {JSON.stringify(s.args)}</span>
          </li>
        ))}
      </ol>
      {log.errors?.length ? (
        <div className="mt-2">
          <div className="font-medium text-destructive">Errors:</div>
          <ul className="pl-4">
            {log.errors.map((e, i) => (
              <li key={i}>
                {e.sheet}!{e.cell}: {e.error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </details>
  );
}
