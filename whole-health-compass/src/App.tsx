import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { clinicConfig } from "@/config/clinic";
import { applyClinicTheme } from "@/lib/theme";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Landing } from "@/pages/Landing";
import { Compass } from "@/pages/Compass";
import { About } from "@/pages/About";
import { Privacy } from "@/pages/Privacy";
import { ForClinics } from "@/pages/ForClinics";
import { Compliance } from "@/pages/Compliance";
import { Clinic } from "@/pages/Clinic";
import { Learn } from "@/pages/Learn";
import { LearnIssue } from "@/pages/LearnIssue";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const firstRun = useRef(true);
  useEffect(() => {
    // Hash-aware: an in-page anchor link (e.g. /compliance#registers from the
    // comparative lens) should land on that section, not the page top. The
    // target's scroll-mt-* clears the sticky header. Falls back to top-of-page
    // for ordinary route changes.
    let target: HTMLElement | null = null;
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
        target = el;
      }
    }
    if (!target) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      target = document.getElementById("main");
    }
    // Move keyboard/screen-reader focus into the new content on client
    // navigation, so it isn't stranded on a now-unmounted element at the top.
    // Skip the very first paint (a direct/crawler load) — don't yank focus there.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (target) {
      // Make non-interactive targets (section headings, <main>) programmatically
      // focusable. tabindex="-1" keeps them out of the Tab sequence; programmatic
      // .focus() uses :focus (not :focus-visible), so no outline flashes.
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  }, [pathname, hash]);
  return null;
}

// White-label default title, applied at module load (before React effects run)
// so it's correct on a direct or crawler load. Individual pages — e.g. the
// knowledge base — override it via usePageMeta and restore this on unmount.
// Setting it in a mount effect here would clobber a child page's title, because
// React runs child effects before the parent's.
if (typeof document !== "undefined") {
  document.title = `${clinicConfig.name} — ${clinicConfig.tagline}`;
}

export default function App() {
  useEffect(() => {
    applyClinicTheme({ primary: clinicConfig.primaryColor, accent: clinicConfig.accentColor });
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/compass" element={<Compass />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:id" element={<LearnIssue />} />
            <Route path="/for-clinics" element={<ForClinics />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/clinic" element={<Clinic />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </BrowserRouter>
  );
}
