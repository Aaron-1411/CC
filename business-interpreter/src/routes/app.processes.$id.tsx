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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-[60vh] w-full" />
          <Skeleton className="h-[60vh] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Link to="/app/processes" className="text-xs text-muted-foreground hover:underline">
            ← All processes
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-auto w-auto px-2 py-1 text-xl font-semibold"
            />
            <span className="text-xs text-muted-foreground">
              {data.process.tool} · v{data.process.version}
            </span>
          </div>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (product / report)"
            className="h-auto w-auto px-2 py-1 text-sm text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onSave(false)} disabled={saving}>
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button variant="outline" onClick={() => onSave(true)} disabled={saving}>
            Save as v{data.process.version + 1}
          </Button>
          <Button onClick={onStart} disabled={steps.length === 0}>
            <Play className="h-4 w-4" /> Start run
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Free-form SOP</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onParse}
              disabled={parsing || !sop.trim()}
              className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {parsing ? "Parsing…" : "Parse into steps"}
            </Button>
          </div>
          <Textarea
            value={sop}
            onChange={(e) => setSop(e.target.value)}
            placeholder={`Describe the full process in plain English. Mention:\n- inputs (files, periods, subjects)\n- transformations or sub-analyses\n- checks you always do\n- approvals and sign-offs\n- final outputs`}
            className="h-[60vh] p-3 font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            The agent will respect prior corrections ({data.corrections.length} on file) when parsing.
          </p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Structured steps</h2>
            <Button variant="outline" size="sm" onClick={addStep}>
              <Plus className="h-3 w-3" /> Add
            </Button>
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
                    <Select
                      value={s.kind}
                      onValueChange={(v) => updateStep(i, { kind: v as ProcessStep["kind"] })}
                    >
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">manual</SelectItem>
                        <SelectItem value="ai_check">ai_check</SelectItem>
                        <SelectItem value="gate">gate</SelectItem>
                        <SelectItem value="input">input</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={s.title}
                      onChange={(e) => updateStep(i, { title: e.target.value })}
                      className="h-8 flex-1"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(i)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label="Remove step"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Textarea
                  value={s.description ?? ""}
                  onChange={(e) => updateStep(i, { description: e.target.value })}
                  placeholder="Description"
                  className="mt-2 text-xs"
                  rows={2}
                />
                {s.kind === "ai_check" && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-muted-foreground">Criteria (one per line)</div>
                    <Textarea
                      value={(s.criteria ?? []).join("\n")}
                      onChange={(e) =>
                        updateStep(i, {
                          criteria: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
                        })
                      }
                      className="text-xs"
                      rows={3}
                    />
                  </div>
                )}
                {s.kind === "input" && (
                  <Input
                    value={s.inputLabel ?? ""}
                    onChange={(e) => updateStep(i, { inputLabel: e.target.value })}
                    placeholder="Input label (e.g. Reporting period)"
                    className="mt-2 h-8 text-xs"
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
