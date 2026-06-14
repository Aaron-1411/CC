import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listSheetAnalyses, createSheetAnalysis } from "@/lib/sheet-analyzer.functions";
import { Upload, FileSpreadsheet } from "lucide-react";

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

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sheet analyzer</h1>
          <p className="text-sm text-muted-foreground">
            Upload a workbook. The agent maps every tab, traces data lineage, asks you context questions, and writes a plain-English explainer.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Upload className="h-4 w-4" />
          {busy ? "Uploading…" : "Upload .xlsx"}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xlsm"
            className="hidden"
            onChange={onPick}
            disabled={busy}
          />
        </label>
      </header>

      {err && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
          {err}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : (data?.analyses ?? []).length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No analyses yet. Upload a workbook to get started.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data!.analyses.map((a) => (
              <li key={a.id}>
                <Link
                  to="/app/analyzer/$id"
                  params={{ id: a.id }}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-accent/40"
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
