import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { planTransformation, executePlanOnWorkbook } from "@/lib/spreadsheet-plan.functions";
import { createFixture } from "@/lib/fixtures.functions";
import { listProcesses } from "@/lib/processes.functions";
import { Wand2, Play, Save, ChevronDown, ChevronRight } from "lucide-react";

type Workbook = { id: string; name: string; kind: string };

export function PlanRunner({
  jobId,
  workbookId,
  workbooks,
  onDone,
}: {
  jobId: string;
  workbookId: string | null;
  workbooks: Workbook[];
  onDone: () => void;
}) {
  const plan = useServerFn(planTransformation);
  const execute = useServerFn(executePlanOnWorkbook);
  const save = useServerFn(createFixture);
  const listProc = useServerFn(listProcesses);

  const { data: procData } = useQuery({
    queryKey: ["processes-tool-excel"],
    queryFn: () => listProc(),
  });

  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [lastOutputWbId, setLastOutputWbId] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [processId, setProcessId] = useState<string>("");
  const [expectedWbId, setExpectedWbId] = useState<string>("");
  const [name, setName] = useState("");

  const excelProcs = (procData?.processes ?? []).filter((p: any) => p.tool === "excel");

  async function onPlan() {
    if (!workbookId || !instruction.trim()) return;
    setBusy("plan");
    try {
      const r = (await plan({
        data: { jobId, workbookId, instruction },
      })) as { plan: unknown };
      setDraft(JSON.stringify(r.plan, null, 2));
    } finally {
      setBusy(null);
    }
  }

  async function onExecute() {
    if (!workbookId || !draft.trim()) return;
    setBusy("exec");
    try {
      const parsed = JSON.parse(draft);
      const r = (await execute({
        data: { jobId, workbookId, plan: parsed, label: "planned" },
      })) as { outputWorkbook: { id: string } | null; ok: boolean; validationStatus: string };
      setLastOutputWbId(r.outputWorkbook?.id ?? null);
      setLastStatus(`${r.ok ? "ok" : "failed"} · validation=${r.validationStatus}`);
      onDone();
    } catch (e) {
      setLastStatus(`error: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function onSaveFixture() {
    if (!workbookId || !processId || !expectedWbId || !draft.trim() || !name.trim()) return;
    setBusy("save");
    try {
      const parsed = JSON.parse(draft);
      await save({
        data: {
          processId,
          name,
          inputWorkbookId: workbookId,
          expectedWorkbookId: expectedWbId,
          plan: parsed,
          tolerance: 0.0001,
        },
      });
      setName("");
      setLastStatus("fixture saved");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Wand2 className="h-4 w-4 text-primary" />
        Plan-first run (deterministic executor)
      </button>
      {open && (
        <div className="space-y-3 border-t border-border p-3 text-sm">
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Describe the transformation. The agent emits a typed plan; the executor runs it deterministically."
            rows={3}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={onPlan}
              disabled={!workbookId || !instruction.trim() || !!busy}
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary disabled:opacity-50"
            >
              <Wand2 className="h-3 w-3" /> {busy === "plan" ? "Planning…" : "1. Generate plan"}
            </button>
            <button
              onClick={onExecute}
              disabled={!workbookId || !draft.trim() || !!busy}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              <Play className="h-3 w-3" /> {busy === "exec" ? "Executing…" : "2. Execute plan"}
            </button>
          </div>
          {draft && (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={10}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs"
            />
          )}
          {lastStatus && (
            <div className="rounded bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
              {lastStatus}
            </div>
          )}
          {lastOutputWbId && (
            <div className="space-y-2 rounded-md border border-border/60 p-2">
              <div className="text-xs font-medium">Save as golden-file fixture</div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={processId}
                  onChange={(e) => setProcessId(e.target.value)}
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                >
                  <option value="">— pick process —</option>
                  {excelProcs.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={expectedWbId}
                  onChange={(e) => setExpectedWbId(e.target.value)}
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                >
                  <option value="">— expected output —</option>
                  {workbooks.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fixture name"
                className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
              />
              <button
                onClick={onSaveFixture}
                disabled={!processId || !expectedWbId || !name.trim() || !!busy}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
              >
                <Save className="h-3 w-3" /> {busy === "save" ? "Saving…" : "Save fixture"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
