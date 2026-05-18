import { supabase } from "@/integrations/supabase/client";

/**
 * Append-only audit log writer. Calls a SECURITY DEFINER function so the
 * client cannot tamper with rows or impersonate another user. Failures are
 * swallowed (audit must never break the user-facing flow) but logged to the
 * console for diagnostics.
 */
export async function logAction(
  action: string,
  opts: { targetType?: string; targetId?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    const { error } = await supabase.rpc("log_action", {
      p_action: action,
      p_target_type: opts.targetType ?? null,
      p_target_id: opts.targetId ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_metadata: (opts.metadata ?? {}) as any,
    });
    if (error) console.warn("[audit]", action, error.message);
  } catch (e) {
    console.warn("[audit]", action, e);
  }
}

/**
 * Track a tool view/use. Action is namespaced as `tool.<slug>` so the admin
 * dashboard's usage analytics can group on it. Throttled in-session to one
 * write per tool per 60s to avoid noisy duplicates from re-renders.
 */
const recent = new Map<string, number>();
export function trackTool(slug: string, metadata: Record<string, unknown> = {}) {
  const key = `tool.${slug}`;
  const now = Date.now();
  const last = recent.get(key) ?? 0;
  if (now - last < 60_000) return;
  recent.set(key, now);
  void logAction(key, { metadata: { ...metadata, ts: now } });
}
