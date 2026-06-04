/* ────────────────────────────────────────────────────────────────────────────
   FIRST-PARTY, COOKIELESS ANALYTICS

   Sends small funnel events to our own /api/event endpoint. No third parties,
   no cookies, no PII. A per-session random id (sessionStorage, cleared when the
   tab closes — not a cookie) lets us stitch a single visit's steps together.

   Every call is best-effort and swallows all errors: analytics must NEVER break
   the page, and in local dev (no Functions running) the beacons simply 404 and
   are ignored.
   ──────────────────────────────────────────────────────────────────────────── */

import { clinicConfig } from "@/config/clinic";

const ENDPOINT = "/api/event";
const ANON_KEY = "whc_anon";

function anonId(): string {
  try {
    let id = sessionStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return "ephemeral";
  }
}

export type TrackProps = {
  concernId?: string;
  step?: string;
  meta?: Record<string, unknown>;
};

export function track(name: string, props: TrackProps = {}): void {
  try {
    const body = JSON.stringify({
      name,
      clinicId: clinicConfig.clinicId,
      anonId: anonId(),
      concernId: props.concernId,
      step: props.step,
      meta: props.meta,
      ts: Date.now(),
    });

    // sendBeacon survives page navigation (e.g. clicking a link right after).
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never throw */
  }
}

/** Fire an event only once per session (e.g. a page-view that shouldn't double
 *  count under React StrictMode's dev double-invoke). */
const fired = new Set<string>();
export function trackOnce(name: string, props: TrackProps = {}): void {
  if (fired.has(name)) return;
  fired.add(name);
  track(name, props);
}
