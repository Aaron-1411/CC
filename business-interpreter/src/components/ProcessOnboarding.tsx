import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  listProcessThread,
  postProcessMessage,
  askClarifyingQuestions,
  refineSopFromThread,
} from "@/lib/process-chat.functions";
import {
  registerDemonstration,
  listDemonstrations,
  processDemonstration,
  applyDemonstrationToProcess,
  deleteDemonstration,
} from "@/lib/demonstrations.functions";
import { Send, Sparkles, Upload, Wand2, Trash2, CheckCircle2 } from "lucide-react";

export function ProcessOnboarding({
  processId,
  onSopUpdated,
}: {
  processId: string;
  onSopUpdated?: (sop: string) => void;
}) {
  const listThread = useServerFn(listProcessThread);
  const post = useServerFn(postProcessMessage);
  const ask = useServerFn(askClarifyingQuestions);
  const refine = useServerFn(refineSopFromThread);
  const listDemos = useServerFn(listDemonstrations);
  const registerDemo = useServerFn(registerDemonstration);
  const processDemo = useServerFn(processDemonstration);
  const applyDemo = useServerFn(applyDemonstrationToProcess);
  const removeDemo = useServerFn(deleteDemonstration);

  const thread = useQuery({
    queryKey: ["process-thread", processId],
    queryFn: () => listThread({ data: { processId } }),
  });
  const demos = useQuery({
    queryKey: ["process-demos", processId],
    queryFn: () => listDemos({ data: { processId } }),
    refetchInterval: (q) => {
      const items = q.state.data?.demos ?? [];
      return items.some((d: any) => d.status === "transcribing" || d.status === "outlining")
        ? 2000
        : false;
    },
  });

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send() {
    if (!msg.trim()) return;
    const text = msg;
    setMsg("");
    await post({ data: { processId, content: text } });
    thread.refetch();
  }

  async function onAsk() {
    setBusy("ask");
    try {
      await ask({ data: { processId } });
      thread.refetch();
    } finally {
      setBusy(null);
    }
  }

  async function onRefine() {
    setBusy("refine");
    try {
      const r = await refine({ data: { processId } });
      onSopUpdated?.(r.sop_text);
      thread.refetch();
    } finally {
      setBusy(null);
    }
  }

  async function onUpload() {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    setBusy("upload");
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const path = `${u.user.id}/demos/${processId}/${Date.now()}_${f.name}`;
      const up = await supabase.storage.from("workbooks").upload(path, f, { upsert: false });
      if (up.error) throw up.error;
      const r = await registerDemo({
        data: { processId, storagePath: path, mimeType: f.type || "video/mp4" },
      });
      // fire-and-await transcription
      setBusy("transcribe");
      await processDemo({ data: { id: r.id } });
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
      demos.refetch();
    }
  }

  async function onApply(demoId: string) {
    setBusy("apply");
    try {
      await applyDemo({ data: { demoId, mode: "append" } });
      onSopUpdated?.("");
    } finally {
      setBusy(null);
      demos.refetch();
    }
  }

  const messages = thread.data?.messages ?? [];
  const items = demos.data?.demos ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div>
            <div className="text-sm font-semibold">Onboarding chat</div>
            <div className="text-xs text-muted-foreground">
              Agent asks clarifying questions. Answer in this thread, then refine the SOP.
            </div>
          </div>
          <div className="flex gap-2">
            <button
              disabled={!!busy}
              onClick={onAsk}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {busy === "ask" ? "Thinking…" : "Ask questions"}
            </button>
            <button
              disabled={!!busy}
              onClick={onRefine}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
            >
              <Wand2 className="h-3.5 w-3.5" />
              {busy === "refine" ? "Updating…" : "Refine SOP from answers"}
            </button>
          </div>
        </div>
        <div className="max-h-[40vh] space-y-2 overflow-y-auto p-3">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No messages yet. Click "Ask questions" to have the agent identify ambiguities in your SOP.
            </p>
          )}
          {messages.map((m: any) => (
            <div
              key={m.id}
              className={`rounded-md px-3 py-2 text-sm ${
                m.role === "ai" ? "bg-muted/50" : "bg-primary/10"
              }`}
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                <span>{m.role}</span>
                {m.kind === "question" && <span className="rounded bg-amber-500/20 px-1 text-amber-500">Q</span>}
                {m.resolved && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-border p-2">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Answer the agent's questions…"
            className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          />
          <button
            onClick={send}
            className="rounded-md bg-primary px-2.5 py-1.5 text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div>
            <div className="text-sm font-semibold">Demonstrations</div>
            <div className="text-xs text-muted-foreground">
              Upload a screen recording. The agent transcribes it and outlines the steps you can append to the process.
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
            <Upload className="h-3.5 w-3.5" />
            {busy === "upload" || busy === "transcribe" ? "Processing…" : "Upload recording"}
            <input
              ref={fileRef}
              type="file"
              accept="video/*,audio/*"
              className="hidden"
              onChange={onUpload}
              disabled={!!busy}
            />
          </label>
        </div>
        <ul className="divide-y divide-border">
          {items.length === 0 && (
            <li className="p-4 text-xs text-muted-foreground">No demonstrations yet.</li>
          )}
          {items.map((d: any) => (
            <li key={d.id} className="space-y-2 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-medium">{d.mime_type ?? "recording"}</span>
                  <span className="ml-2 text-muted-foreground">{d.status}</span>
                  {d.error && <span className="ml-2 text-red-500">{d.error}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {d.outline && (
                    <button
                      disabled={!!busy}
                      onClick={() => onApply(d.id)}
                      className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20"
                    >
                      Append {d.outline?.steps?.length ?? 0} steps
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      await removeDemo({ data: { id: d.id } });
                      demos.refetch();
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {d.transcript && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Transcript</summary>
                  <pre className="mt-1 whitespace-pre-wrap rounded bg-muted/40 p-2">{d.transcript}</pre>
                </details>
              )}
              {d.outline?.steps && (
                <details className="text-xs" open>
                  <summary className="cursor-pointer text-muted-foreground">
                    Outlined steps ({d.outline.steps.length})
                  </summary>
                  <ol className="mt-1 space-y-1">
                    {d.outline.steps.map((s: any, i: number) => (
                      <li key={i} className="rounded bg-muted/30 px-2 py-1">
                        <span className="text-[10px] uppercase text-muted-foreground">{s.kind}</span>{" "}
                        <span className="font-medium">{s.title}</span>
                        {s.description && <div className="text-muted-foreground">{s.description}</div>}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
