// Lightweight client-side error sink. Swap the console call for a real
// provider (Sentry, etc) here without touching call sites.
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[error]", { route: window.location.pathname, ...context }, error);
}
