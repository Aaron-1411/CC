import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PostcodeBar } from "@/components/postcode-widget";

// primary=true items get full text weight in the desktop nav (visible by default)
// secondary items are muted — still discoverable but not competing for attention
const NAV_GROUPS: Array<{
  label: string;
  primary?: boolean;
  items: Array<{ to: string; label: string }>;
}> = [
  {
    label: "Explore",
    primary: true,
    items: [
      { to: "/issues", label: "Issues" },
      { to: "/parties", label: "Parties" },
      { to: "/news", label: "Coverage" },
      { to: "/take-action", label: "Take Action" },
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
    label: "Economy",
    items: [
      { to: "/economy", label: "Indicators" },
      { to: "/spending", label: "Spending" },
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
      { to: "/acoba", label: "Revolving Door" },
    ],
  },
  {
    label: "Services",
    items: [
      { to: "/nhs", label: "NHS" },
      { to: "/sewage", label: "Sewage" },
      { to: "/stop-search", label: "Policing" },
      { to: "/sanctions", label: "Sanctions" },
      { to: "/foi", label: "FOI" },
    ],
  },
  {
    label: "Investigate",
    items: [
      { to: "/committees", label: "Committees" },
      { to: "/crossref", label: "Cross-ref" },
      { to: "/projects", label: "Projects" },
      { to: "/briefing", label: "Briefing" },
      { to: "/methodology", label: "Method" },
    ],
  },
  {
    label: "My Area",
    items: [{ to: "/my-area", label: "My Area" }],
  },
];

export function SiteShell() {
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [loc.pathname]);

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

          {/* Desktop nav — grouped with dividers, primary group full weight */}
          <nav className="hidden sm:flex items-center gap-0 overflow-x-auto scrollbar-none flex-1 min-w-0">
            {NAV_GROUPS.map((group, gi) => (
              <div key={group.label} className="flex items-center shrink-0">
                {gi > 0 && <div className="w-px h-4 bg-border mx-1.5 shrink-0" />}
                {group.items.map((n) => {
                  const active =
                    loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
                  const isMyArea = n.to === "/my-area";
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={cn(
                        "px-2 py-3 text-[11px] label-mono uppercase tracking-wider transition-colors whitespace-nowrap border-b-2",
                        active
                          ? "border-amber text-amber"
                          : group.primary
                            ? "border-transparent text-foreground hover:text-amber"
                            : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                      title={isMyArea ? "Your constituency data" : undefined}
                    >
                      {isMyArea ? (
                        <span className="flex items-center gap-1">
                          <svg
                            width="10"
                            height="12"
                            viewBox="0 0 10 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M5 1C3.067 1 1.5 2.567 1.5 4.5c0 2.5 3.5 6.5 3.5 6.5s3.5-4 3.5-6.5C8.5 2.567 6.933 1 5 1z" />
                            <circle cx="5" cy="4.5" r="1" />
                          </svg>
                          {n.label}
                        </span>
                      ) : (
                        n.label
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Postcode bar + guide link (desktop only) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <PostcodeBar />
            <Link
              to="/about"
              className="px-2 py-3 text-[11px] label-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent whitespace-nowrap"
              title="How to use transparenC"
            >
              Guide
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden p-2 -mr-1 text-muted-foreground hover:text-foreground transition-colors self-center"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="17" y2="6" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="14" x2="17" y2="14" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu — grouped */}
        {menuOpen && (
          <div className="sm:hidden border-t border-border bg-surface">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="px-3 py-2 border-b border-border last:border-b-0">
                <div
                  className={cn(
                    "label-mono text-[10px] uppercase tracking-[0.15em] px-1 mb-1.5",
                    group.primary ? "text-foreground/70" : "text-muted-foreground/60",
                  )}
                >
                  {group.label}
                </div>
                <div className="grid grid-cols-3 gap-px">
                  {group.items.map((n) => {
                    const active =
                      loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        className={cn(
                          "px-2 py-2 rounded text-[11px] label-mono uppercase tracking-wider transition-colors",
                          active
                            ? "bg-amber/10 text-amber"
                            : group.primary
                              ? "text-foreground/80 hover:text-foreground hover:bg-surface-2"
                              : "text-muted-foreground hover:text-foreground hover:bg-surface-2",
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-xs text-muted-foreground space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="label-mono uppercase tracking-wider">
              transparenC — built on open public data
            </p>
            <Link
              to="/about"
              className="label-mono text-[10px] uppercase tracking-wider hover:text-amber transition-colors"
            >
              How to use this site →
            </Link>
          </div>
          <p>
            Sources: Parliament APIs, Contracts Finder, Electoral Commission, IPSA, data.police.uk,
            Environment Agency, NHS England, DWP, ONS, GOV.UK. Most content under the{" "}
            <a
              href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
              className="underline hover:text-amber"
              target="_blank"
              rel="noreferrer"
            >
              Open Government Licence v3.0
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
