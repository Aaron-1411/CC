import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const NAV_TOOLS = [
  { to: "/lease-audit", label: "Lease Audit" },
  { to: "/planning-radar", label: "Planning Radar" },
  { to: "/agent-rater", label: "Complaint Letters" },
] as const;

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
          <span className="font-display text-base font-extrabold tracking-tight">LeaseSense Pro</span>
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          {NAV_TOOLS.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${
                pathname === tool.to
                  ? "text-foreground"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {tool.label}
            </Link>
          ))}
        </div>

        <Link
          to="/for-firms"
          className={`inline-flex items-center rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
            pathname.startsWith("/for-firms")
              ? "bg-accent text-accent-foreground"
              : "bg-foreground text-background hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {pathname.startsWith("/for-firms") ? "← Tools" : "For firms"}
        </Link>
      </div>
    </nav>
  );
}
