import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Shared sticky top nav. Transparent at scroll-top, white w/ shadow when scrolled.
 * On `/for-firms` the right-side primary CTA flips to "Client tool →".
 */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onFirms = pathname.startsWith("/for-firms");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all ${
        scrolled
          ? "border-b border-border bg-background/95 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-base font-extrabold tracking-tight">
            LeaseSense Pro
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {onFirms ? (
            <Link
              to="/"
              className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-background hover:bg-accent"
            >
              Client tool →
            </Link>
          ) : (
            <>
              <Link
                to="/for-firms"
                className="hidden text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground sm:inline"
              >
                For firms
              </Link>
              <Link
                to="/"
                className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-background hover:bg-accent"
              >
                Try it free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
