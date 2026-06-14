import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getProcess,
  updateProcess,
  parseSopToSteps,
  startRun,
  type ProcessStep,
} from "@/lib/processes.functions";
import { Sparkles, Play, Save, Trash2, Plus } from "lucide-react";
import { ProcessOnboarding } from "@/components/ProcessOnboarding";
import { FixturesPanel } from "@/components/FixturesPanel";

export const Route = createFileRoute("/app/processes/$id")({
  component: ProcessEditor,
});

function ProcessEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const get = useServerFn(getProcess);
  const update = useServerFn(updateProcess);
  const parse = useServerFn(parseSopToSteps);
  const start = useServerFn(startRun);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["process", id],
    queryFn: () => get({ data: { id } }),
  });

  const [sop, setSop] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.process) {
      setSop(data.process.sop_text ?? "");
      setName(data.process.name);
      setSubject(data.process.subject ?? "");
      setSteps((data.process.steps as unknown as ProcessStep[]) ?? []);
    }
  }, [data?.process]);

  async function onParse() {
    setParsing(true);
    try {
      await update({ data: { id, sop_text: sop, name, subject: subject || null } });
      const r = await parse({ data: { id, sop_text: sop } });
      setSteps(r.steps);
      refetch();
    } finally {
      setParsing(false);
    }
  }

  async function onSave(bump = false) {
    setSaving(true);
    try {
      await update({
        data: { id, name, subject: subject || null, sop_text: sop, steps, bumpVersion: bump },
      });
      refetch();
    } finally {
      setSaving(false);
    }
  }

  async function onStart() {
    await onSave();
    const r = await start({ data: { processId: id } });
    navigate({ to: "/app/runs/$id", params: { id: r.runId } });
  }

  function updateStep(idx: number, patch: Partial<ProcessStep>) {
    setSteps((arr) => arr.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function removeStep(idx: number) {
    setSteps((arr) => arr.filter((_, i) => i !== idx));
  }
  function addStep() {
    setSteps((arr) => [
      ...arr,
      { id: `s${Date.now()}`, kind: "manual", title: "New step" },
    ]);
  }

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Link to="/app/processes" className="text-xs text-muted-foreground hover:underline">
            ← All processes
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xl font-semibold"
            />
            <span className="text-xs text-muted-foreground">
              {data.process.tool} · v{data.process.version}
            </span>
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (product / report)"
            className="rounded-md border border-border bg-background px-2 py-1 text-sm text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Save
          </button>
          <button
            onClick={() => onSave(true)}
            disabled={saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            Save as v{data.process.version + 1}
          </button>
          <button
            onClick={onStart}
            disabled={steps.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Play className="h-4 w-4" /> Start run
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Free-form SOP</h2>
            <button
              onClick={onParse}
              disabled={parsing || !sop.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {parsing ? "Parsing…" : "Parse into steps"}
            </button>
          </div>
          <textarea
            value={sop}
            onChange={(e) => setSop(e.target.value)}
            placeholder={`Describe the full process in plain English. Mention:\n- inputs (files, periods, subjects)\n- transformations or sub-analyses\n- checks you always do\n- approvals and sign-offs\n- final outputs`}
            className="h-[60vh] w-full rounded-md border border-border bg-background p-3 font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            The agent will respect prior corrections ({data.corrections.length} on file) when parsing.
          </p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Structured steps</h2>
            <button
              onClick={addStep}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          <ol className="space-y-2">
            {steps.length === 0 && (
              <li className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
                No steps yet — write the SOP and click "Parse into steps".
              </li>
            )}
            {steps.map((s, i) => (
              <li key={s.id} className="rounded-md border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-1 items-center gap-2">
                    <span className="text-xs text-muted-foreground">{i + 1}.</span>
                    <select
                      value={s.kind}
                      onChange={(e) =>
                        updateStep(i, { kind: e.target.value as ProcessStep["kind"] })
                      }
                      className="rounded border border-border bg-background px-1.5 py-0.5 text-xs"
                    >
                      <option value="manual">manual</option>
                      <option value="ai_check">ai_check</option>
                      <option value="gate">gate</option>
                      <option value="input">input</option>
                    </select>
                    <input
                      value={s.title}
                      onChange={(e) => updateStep(i, { title: e.target.value })}
                      className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removeStep(i)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <textarea
                  value={s.description ?? ""}
                  onChange={(e) => updateStep(i, { description: e.target.value })}
                  placeholder="Description"
                  className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-xs"
                  rows={2}
                />
                {s.kind === "ai_check" && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-muted-foreground">Criteria (one per line)</div>
                    <textarea
                      value={(s.criteria ?? []).join("\n")}
                      onChange={(e) =>
                        updateStep(i, {
                          criteria: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
                        })
                      }
                      className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                      rows={3}
                    />
                  </div>
                )}
                {s.kind === "input" && (
                  <input
                    value={s.inputLabel ?? ""}
                    onChange={(e) => updateStep(i, { inputLabel: e.target.value })}
                    placeholder="Input label (e.g. Reporting period)"
                    className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-xs"
                  />
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <ProcessOnboarding processId={id} onSopUpdated={() => refetch()} />

      <FixturesPanel processId={id} />



      {data.runs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Recent runs</h2>
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {data.runs.map((r) => (
              <li key={r.id}>
                <Link
                  to="/app/runs/$id"
                  params={{ id: r.id }}
                  className="flex items-center justify-between p-3 text-sm hover:bg-accent/40"
                >
                  <span>
                    Step {r.current_step + 1} · <span className="text-muted-foreground">{r.status}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
