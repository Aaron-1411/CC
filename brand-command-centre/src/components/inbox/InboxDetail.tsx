"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, X, Eye, Loader2, Zap } from "lucide-react";
import { Preview } from "./previews";
import { fieldsFor, type EditableField } from "./editorFields";
import { AGENT_META, type AgentPayload } from "@/types/agents";
import type { InboxItemDTO } from "@/types/ui";
import { itemTypeLabel, timeAgo, cn } from "@/lib/utils";

type Mode = "view" | "edit";
type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY = 1500; // ms after last keystroke

/** Build editable form values (lines arrays joined with newlines). */
function formFromPayload(
  payload: AgentPayload,
  fields: EditableField[],
): Record<string, string> {
  const rec = payload as unknown as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = rec[f.key];
    if (f.kind === "lines") {
      out[f.key] = Array.isArray(v) ? v.join("\n") : "";
    } else {
      out[f.key] = v == null ? "" : String(v);
    }
  }
  return out;
}

/** Merge form values back into a payload, splitting line-arrays. */
function payloadFromForm(
  base: AgentPayload,
  fields: EditableField[],
  values: Record<string, string>,
): AgentPayload {
  const next = { ...(base as unknown as Record<string, unknown>) };
  for (const f of fields) {
    const raw = values[f.key] ?? "";
    if (f.kind === "lines") {
      next[f.key] = raw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      next[f.key] = raw;
    }
  }
  return next as unknown as AgentPayload;
}

export function InboxDetail({
  item,
  onResolved,
}: {
  item: InboxItemDTO;
  /** Called after approve/reject so the parent can drop it from the list. */
  onResolved: (id: string) => void;
}) {
  const meta = AGENT_META[item.agentType];
  const fields = useMemo(() => fieldsFor(item.type), [item.type]);
  const editable = fields.length > 0;
  const isIntel = item.type === "INTEL_REPORT";

  const [mode, setMode] = useState<Mode>("view");
  const [form, setForm] = useState<Record<string, string>>(() =>
    formFromPayload(item.payload, fields),
  );
  const [payload, setPayload] = useState<AgentPayload>(item.payload);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  // ── Autosave (debounced PATCH) ──────────────────────────────────────
  const flushSave = useCallback(async () => {
    if (!dirty.current) return;
    const nextPayload = payloadFromForm(item.payload, fields, form);
    setPayload(nextPayload);
    setSaveState("saving");
    try {
      const body: Record<string, unknown> = { payload: nextPayload };
      // Keep the list label in sync when the title is edited inline.
      if (form.title !== undefined) body.title = form.title;
      const res = await fetch(`/api/inbox/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      dirty.current = false;
      setSaveState("saved");
      setSavedAt(new Date());
    } catch {
      setSaveState("error");
    }
  }, [item.id, item.payload, fields, form]);

  // Schedule a debounced save whenever the form changes in edit mode.
  useEffect(() => {
    if (mode !== "edit" || !dirty.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSave(), AUTOSAVE_DELAY);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [form, mode, flushSave]);

  // Flush any pending save when unmounting (e.g. selecting another item).
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (dirty.current) void flushSave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(key: string, value: string) {
    dirty.current = true;
    setSaveState("idle");
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ── Actions ─────────────────────────────────────────────────────────
  async function approve() {
    setBusy("approve");
    setError(null);
    try {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const edited = dirty.current || item.edited || mode === "edit";
      const nextPayload = payloadFromForm(item.payload, fields, form);
      const res = await fetch(`/api/inbox/${item.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edited ? { editedPayload: nextPayload } : {}),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      onResolved(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  async function reject() {
    setBusy("reject");
    setError(null);
    try {
      const res = await fetch(`/api/inbox/${item.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: rejectNote.trim() || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      onResolved(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  const approveLabel = isIntel ? "Mark as read" : "Approve & publish";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[var(--line)] px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-[var(--ink-3)]">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: meta.colour }}
          />
          <span className="font-medium text-[var(--ink-2)]">{meta.label}</span>
          <span>·</span>
          <span className="rounded-full bg-[var(--panel-2)] px-2 py-0.5 font-medium text-[var(--ink-2)]">
            {itemTypeLabel(item.type)}
          </span>
          <span>·</span>
          <span>{timeAgo(item.createdAt)}</span>
          {item.pillarSource ? (
            <>
              <span>·</span>
              <span>Pillar {item.pillarSource}</span>
            </>
          ) : null}
          {item.edited ? (
            <span className="ml-auto rounded-full bg-[var(--panel-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink-3)]">
              edited
            </span>
          ) : null}
        </div>

        <h1 className="mt-2 text-lg font-semibold leading-tight text-[var(--ink)]">
          {item.title}
        </h1>
        {item.description ? (
          <p className="mt-1 text-sm text-[var(--ink-2)]">{item.description}</p>
        ) : null}

        {item.estimatedImpact ? (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)]/8 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
            <Zap className="h-3.5 w-3.5" />
            {item.estimatedImpact}
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {mode === "edit" && editable ? (
          <FieldEditor
            fields={fields}
            values={form}
            onChange={setField}
            saveState={saveState}
            savedAt={savedAt}
          />
        ) : (
          <Preview type={item.type} payload={payload} />
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-[var(--line)] bg-[var(--panel)] px-5 py-3">
        {error ? (
          <p className="mb-2 text-xs text-[var(--bad)]">{error}</p>
        ) : null}

        {rejecting ? (
          <div className="space-y-2">
            <textarea
              autoFocus
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Optional: why are you rejecting this? (helps the agent learn)"
              rows={2}
              className="w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejecting(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink-2)] hover:bg-[var(--panel-2)]"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bad)] px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {busy === "reject" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Confirm reject
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRejecting(true)}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3.5 py-2 text-sm font-medium text-[var(--ink-2)] transition hover:bg-[var(--panel-2)] disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              Reject
            </button>

            {editable ? (
              <button
                onClick={() => setMode((m) => (m === "edit" ? "view" : "edit"))}
                disabled={busy !== null}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition disabled:opacity-60",
                  mode === "edit"
                    ? "border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--accent)]"
                    : "border-[var(--line)] text-[var(--ink-2)] hover:bg-[var(--panel-2)]",
                )}
              >
                {mode === "edit" ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                {mode === "edit" ? "Preview" : "Edit"}
              </button>
            ) : null}

            <button
              onClick={approve}
              disabled={busy !== null}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {busy === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {approveLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldEditor({
  fields,
  values,
  onChange,
  saveState,
  savedAt,
}: {
  fields: EditableField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  saveState: SaveState;
  savedAt: Date | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end text-xs text-[var(--ink-3)]">
        {saveState === "saving" ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </span>
        ) : saveState === "saved" && savedAt ? (
          <span className="inline-flex items-center gap-1.5 text-[var(--good)]">
            <Check className="h-3 w-3" /> Saved {timeAgo(savedAt)}
          </span>
        ) : saveState === "error" ? (
          <span className="text-[var(--bad)]">Couldn’t save — retrying on next edit</span>
        ) : (
          <span>Changes autosave</span>
        )}
      </div>

      {fields.map((f) => (
        <label key={f.key} className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
            {f.label}
          </span>
          {f.kind === "text" ? (
            <input
              value={values[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
          ) : (
            <textarea
              value={values[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
              rows={f.rows ?? 4}
              className="w-full resize-y rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
          )}
        </label>
      ))}
    </div>
  );
}
