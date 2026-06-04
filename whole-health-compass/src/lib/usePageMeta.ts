import { useEffect } from "react";
import { clinicConfig } from "@/config/clinic";

/* ────────────────────────────────────────────────────────────────────────────
   PER-PAGE <title> + meta description.

   The app is a client-rendered SPA, so the document title/description otherwise
   stay fixed at the index.html defaults on every route. For the knowledge base
   to be genuinely shareable and search-result-friendly (the "search-friendly
   front door" we sell to clinics), each deep page sets its own title and
   description while mounted, then restores the site defaults on unmount.
   ──────────────────────────────────────────────────────────────────────────── */

const hasDom = typeof document !== "undefined";
const DEFAULT_TITLE = `${clinicConfig.name} — ${clinicConfig.tagline}`;
// Capture the index.html description once, before any page overrides it.
const DEFAULT_DESC = hasDom
  ? (document.querySelector('meta[name="description"]') as HTMLMetaElement | null)?.content ?? ""
  : "";

function setDescription(content: string) {
  if (!hasDom) return;
  let el = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", "description");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Set the page title (and optionally description) for as long as the calling
 *  component is mounted; restore the site defaults when it unmounts. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    if (!hasDom) return;
    document.title = title;
    if (description) setDescription(description);
    return () => {
      document.title = DEFAULT_TITLE;
      if (description) setDescription(DEFAULT_DESC);
    };
  }, [title, description]);
}
