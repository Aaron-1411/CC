import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Grouped nav — separators give visual chunking without extra text
const NAV_GROUPS = [
  {
    label: "Explore",
    items: [
      { to: "/issues", label: "Issues" },
      { to: "/parties", label: "Parties" },
      { to: "/news", label: "News" },
    ],
  },
  {
    label: "Democracy",
    items: [
      { to: "/parliament", label: "Parliament" },
      { to: "/petitions", label: "Petitions" },
      { to: "/votes", label: "Votes" },
    ],
  },
  {
    label: "Money",
    items: [
      { to: "/contracts", label: "Contracts" },
      { to: "/donations", label: "Donations" },
      { to: "/expenses", label: "Expenses" },
      { to: "/meetings", label: "Ministers" },
      { to: "/lobbying", label: "Lobbying" },
      { to: "/acoba", label: "ACOBA" },
    ],
  },
  {
    label: "Services",
    items: [
      { to: "/nhs", label: "NHS data" },
      { to: "/sewage", label: "Sewage" },
      { to: "/stop-search", label: "Stop/Search" },
      { to: "/sanctions", label: "Sanctions" },
      { to: "/foi", label: "FOI" },
    ],
  },
  {
    label: "Investigate",
    items: [
      { to: "/crossref", label: "Xref" },
      { to: "/projects", label: "Projects" },
      { to: "/briefing", label: "Briefing" },
    ],
  },
];


export function SiteShell() {
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [loc.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface/60 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-0 flex items-stretch justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 py-3">
            <span className="font-display text-xl font-black tracking-tight">
              transparen<span className="text-amber">C</span>
            </span>
          </Link>

          {/* Desktop nav — grouped with dividers */}
          <nav className="hidden sm:flex items-center gap-0 overflow-x-auto scrollbar-none">
            {NAV_GROUPS.map((group, gi) => (
              <div key={group.label} className="flex items-center">
                {/* Group separator — skip before first group */}
                {gi > 0 && (
                  <div className="w-px h-4 bg-border mx-1.5 shrink-0" />
                )}
                {group.items.map((n) => {
                  const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={cn(
                        "px-2 py-3 text-[11px] label-mono uppercase tracking-wider transition-colors whitespace-nowrap border-b-2",
                        active
                          ? "border-amber text-amber"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {n.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden p-2 -mr-1 text-muted-foreground hover:text-foreground transition-colors self-center"
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

        {/* Mobile menu — grouped */}
        {menuOpen && (
          <div className="sm:hidden border-t border-border bg-surface">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="px-3 py-2 border-b border-border last:border-b-0">
                <div className="label-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 px-1 mb-1">
                  {group.label}
                </div>
                <div className="grid grid-cols-3 gap-px">
                  {group.items.map((n) => {
                    const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        className={cn(
                          "px-2 py-2 rounded text-[11px] label-mono uppercase tracking-wider transition-colors",
                          active ? "bg-amber/10 text-amber" : "text-muted-foreground hover:text-foreground hover:bg-surface-2",
                        )}
                      >
                        {n.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-xs text-muted-foreground space-y-2">
          <p className="label-mono uppercase tracking-wider">transparenC — built on open public data</p>
          <p>
            Sources: Parliament APIs, Contracts Finder, Electoral Commission, IPSA, data.police.uk,
            Environment Agency, NHS England, DWP, GOV.UK. Most content under the{" "}
            <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" className="underline hover:text-amber" target="_blank" rel="noreferrer">
              Open Government Licence v3.0
            </a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
