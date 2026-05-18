import { useEffect } from "react";
import { trackTool } from "@/lib/audit";

/**
 * Fire a single `tool.<slug>` audit event on mount (throttled to 60s/session
 * by trackTool) so the admin dashboard can analyse usage per tool.
 */
export function useTrackTool(slug: string, metadata: Record<string, unknown> = {}) {
  useEffect(() => {
    trackTool(slug, metadata);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
}
