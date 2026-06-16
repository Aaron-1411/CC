import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listProcesses, createProcess } from "@/lib/processes.functions";
import { Plus, FileSpreadsheet, Search, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const processes = data?.processes ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Processes</h1>
          <p className="text-sm text-muted-foreground">
            Reusable SOPs per tool and subject. Author once; the agent runs them with gates and AI checks.
          </p>
        </div>
        <Button onClick={() => setShowNew((v) => !v)} variant={showNew ? "outline" : "default"}>
          <Plus className="h-4 w-4" /> New process
        </Button>
      </header>

      {showNew && (
        <form onSubmit={onCreate} className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="proc-tool">Tool</Label>
              <Select value={tool} onValueChange={(v) => setTool(v as "excel" | "research")}>
                <SelectTrigger id="proc-tool">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel agent</SelectItem>
                  <SelectItem value="research">Competitor research</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proc-subject">Subject (product / report)</Label>
              <Input
                id="proc-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Monthly Board Pack"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proc-name">Name</Label>
              <Input
                id="proc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Process name"
              />
            </div>
          </div>
          <Button type="submit" disabled={creating || !name.trim()}>
            {creating ? "Creating…" : "Create process"}
          </Button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </li>
            ))}
          </ul>
        ) : processes.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Workflow className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-base font-semibold">No processes yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Capture a repeatable workflow once — the agent reruns it with the same gates and checks every time.
            </p>
            {!showNew && (
              <Button onClick={() => setShowNew(true)} className="mt-5">
                <Plus className="h-4 w-4" /> New process
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {processes.map((p) => (
              <li key={p.id}>
                <Link
                  to="/app/processes/$id"
                  params={{ id: p.id }}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent/40"
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
