import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listSheetAnalyses, createSheetAnalysis } from "@/lib/sheet-analyzer.functions";
import { Upload, FileSpreadsheet, Loader2, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/analyzer/")({
  component: AnalyzerIndex,
});

function AnalyzerIndex() {
  const list = useServerFn(listSheetAnalyses);
  const create = useServerFn(createSheetAnalysis);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: () => list(),
  });

  async function onPick() {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const path = `${u.user.id}/analyzer/${Date.now()}_${f.name}`;
      const up = await supabase.storage.from("workbooks").upload(path, f, { upsert: false });
      if (up.error) throw up.error;
      const r = await create({ data: { name: f.name, storagePath: path } });
      navigate({ to: "/app/analyzer/$id", params: { id: r.id } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
      refetch();
    }
  }

  const analyses = data?.analyses ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sheet analyzer</h1>
          <p className="text-sm text-muted-foreground">
            Upload a workbook. The agent maps every tab, traces data lineage, asks you context questions, and writes a plain-English explainer.
          </p>
        </div>
        <Button asChild disabled={busy}>
          <label className="cursor-pointer">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Upload .xlsx
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xlsm"
              className="hidden"
              onChange={onPick}
              disabled={busy}
            />
          </label>
        </Button>
      </header>

      {err && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </li>
            ))}
          </ul>
        ) : analyses.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Microscope className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-base font-semibold">No analyses yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Drop in a complex workbook and the agent will untangle how its tabs, formulas, and numbers fit together.
            </p>
            <Button onClick={() => fileRef.current?.click()} disabled={busy} className="mt-5">
              <Upload className="h-4 w-4" /> Upload .xlsx
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {analyses.map((a) => (
              <li key={a.id}>
                <Link
                  to="/app/analyzer/$id"
                  params={{ id: a.id }}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.status}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.updated_at).toLocaleString()}
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
