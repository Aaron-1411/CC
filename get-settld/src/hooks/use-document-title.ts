import { useEffect } from "react";

const SUFFIX = "First-Time Buyer Toolkit";
const SITE_ORIGIN = "https://get-settld.lovable.app";

const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setCanonical = (href: string) => {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

/**
 * Set <title>, meta description, OG tags and canonical link per route.
 * Restores previous values on unmount so back-nav and SEO stay accurate.
 */
export function useDocumentTitle(title?: string, description?: string) {
  useEffect(() => {
    if (!title) return;
    const prevTitle = document.title;
    const prevCanonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
    const clean = title.length > 60 ? title.slice(0, 57) + "…" : title;
    const fullTitle = `${clean} — ${SUFFIX}`;
    document.title = fullTitle;

    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const canonical = `${SITE_ORIGIN}${path}`;
    setCanonical(canonical);
    setMeta("og:url", canonical, "property");

    const prevDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content;
    if (description) {
      const desc = description.length > 160 ? description.slice(0, 157) + "…" : description;
      setMeta("description", desc);
      setMeta("og:description", desc, "property");
      setMeta("twitter:description", desc);
    }
    setMeta("og:title", fullTitle, "property");
    setMeta("twitter:title", fullTitle);

    return () => {
      document.title = prevTitle;
      if (prevCanonical) setCanonical(prevCanonical);
      if (description && prevDesc) {
        setMeta("description", prevDesc);
        setMeta("og:description", prevDesc, "property");
        setMeta("twitter:description", prevDesc);
      }
    };
  }, [title, description]);
}
