import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/petitions", label: "Petitions" },
  { to: "/contracts", label: "Contracts" },
  { to: "/donations", label: "Donations" },
  { to: "/parliament", label: "Parliament" },
  { to: "/votes", label: "Votes" },
  { to: "/expenses", label: "Expenses" },
  { to: "/meetings", label: "Ministers" },
  { to: "/lobbying", label: "Lobbying" },
  { to: "/acoba", label: "Revolving Door" },
  { to: "/stop-search", label: "Stop & Search" },
  { to: "/nhs", label: "NHS" },
  { to: "/sewage", label: "Sewage" },
  { to: "/sanctions", label: "Sanctions" },
  { to: "/foi", label: "FOI" },
  { to: "/crossref", label: "Xref" },
  { to: "/parties", label: "Parties" },
  { to: "/news", label: "News" },
  { to: "/briefing", label: "Briefing" },
] as const;

export function SiteShell() {
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [loc.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface/60 backdrop-blur sticky top-0 z-40">
        {/* Top bar */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-baseline gap-2 shrink-0">
            <span className="font-display text-2xl font-black tracking-tight">
              transparen<span className="text-amber">C</span>
            </span>
            <span className="hidden sm:inline label-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              UK gov accountability
            </span>
          </Link>

          {/* Desktop nav — horizontal scroll (unchanged) */}
          <nav className="hidden sm:flex gap-0.5 overflow-x-auto scrollbar-none flex-1 justify-end">
            {NAV.map((n) => {
              const active = n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "px-2.5 py-1 text-[11px] rounded label-mono uppercase tracking-wider transition-colors whitespace-nowrap",
                    active ? "bg-amber/10 text-amber" : "text-muted-foreground hover:text-foreground hover:bg-surface-2",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="3" y1="6" x2="17" y2="6" /><line x1="3" y1="10" x2="17" y2="10" /><line x1="3" y1="14" x2="17" y2="14" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="sm:hidden border-t border-border bg-surface">
            <nav className="grid grid-cols-2 gap-px p-2">
              {NAV.map((n) => {
                const active = n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "px-3 py-2.5 rounded text-[11px] label-mono uppercase tracking-wider transition-colors",
                      active ? "bg-amber/10 text-amber" : "text-muted-foreground hover:text-foreground hover:bg-surface-2",
                    )}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-xs text-muted-foreground space-y-2">
          <p className="label-mono uppercase tracking-wider">
            transparenC — built on open public data
          </p>
          <p>
            Data sources: UK Parliament Petitions API, Parliament Bills API,
            Contracts Finder, Electoral Commission, IPSA, data.police.uk,
            Environment Agency, NHS England, DWP, WhatDoTheyKnow, GOV.UK.
            Most content licensed under the{" "}
            <a
              href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
              className="underline hover:text-amber"
              target="_blank"
              rel="noreferrer"
            >
              Open Government Licence v3.0
            </a>
            . AI briefings generated by Lovable AI; verify against primary sources.
          </p>
        </div>
      </footer>
    </div>
  );
}