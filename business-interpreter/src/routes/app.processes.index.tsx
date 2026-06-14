import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listProcesses, createProcess } from "@/lib/processes.functions";
import { Plus, FileSpreadsheet, Search } from "lucide-react";

export const Route = createFileRoute("/app/processes/")({
  component: ProcessesIndex,
});

function ProcessesIndex() {
  const list = useServerFn(listProcesses);
  const create = useServerFn(createProcess);
  const navigate = useNavigate();
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["processes"],
    queryFn: () => list(),
  });
  const [showNew, setShowNew] = useState(false);
  const [tool, setTool] = useState<"excel" | "research">("excel");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [creating, setCreating] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const r = await create({ data: { tool, name: name.trim(), subject: subject.trim() || undefined, sop_text: "" } });
      navigate({ to: "/app/processes/$id", params: { id: r.id } });
    } finally {
      setCreating(false);
      setShowNew(false);
      refetch();
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Processes</h1>
          <p className="text-sm text-muted-foreground">
            Reusable SOPs per tool and subject. Author once; the agent runs them with gates and AI checks.
          </p>
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New process
        </button>
      </header>

      {showNew && (
        <form onSubmit={onCreate} className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Tool</span>
              <select
                value={tool}
                onChange={(e) => setTool(e.target.value as "excel" | "research")}
                className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
              >
                <option value="excel">Excel agent</option>
                <option value="research">Competitor research</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Subject (product / report)</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Monthly Board Pack"
                className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Process name"
                className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
              />
            </label>
          </div>
          <button
            disabled={creating}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : (data?.processes ?? []).length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No processes yet. Create one above.</div>
        ) : (
          <ul className="divide-y divide-border">
            {data!.processes.map((p) => (
              <li key={p.id}>
                <Link
                  to="/app/processes/$id"
                  params={{ id: p.id }}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-accent/40"
                >
                  <div className="flex items-center gap-3">
                    {p.tool === "excel" ? (
                      <FileSpreadsheet className="h-4 w-4 text-primary" />
                    ) : (
                      <Search className="h-4 w-4 text-primary" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.tool} {p.subject ? `· ${p.subject}` : ""} · v{p.version}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.updated_at).toLocaleString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
