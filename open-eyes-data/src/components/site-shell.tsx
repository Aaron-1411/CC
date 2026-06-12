import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { PostcodeBar } from "@/components/postcode-widget";

type NavItem = { to: string; label: string };

// Primary nav — always visible on desktop. Kept to five so the bar never
// overflows and the most important journeys are one click away.
const PRIMARY_NAV: NavItem[] = [
  { to: "/issues", label: "Issues" },
  { to: "/parties", label: "Parties" },
  { to: "/learn", label: "Learn" },
  { to: "/take-action", label: "Take Action" },
  { to: "/my-area", label: "My Area" },
];

// Everything else lives behind a single "More" menu (desktop) / grouped list
// (mobile) — discoverable without crowding the bar.
const MORE_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Democracy",
    items: [
      { to: "/parliament", label: "Parliament" },
      { to: "/petitions", label: "Petitions" },
      { to: "/votes", label: "Votes" },
      { to: "/committees", label: "Committees" },
      { to: "/news", label: "Coverage" },
    ],
  },
  {
    label: "Economy & money",
    items: [
      { to: "/economy", label: "Indicators" },
      { to: "/spending", label: "Spending" },
      { to: "/contracts", label: "Contracts" },
      { to: "/donations", label: "Donations" },
      { to: "/expenses", label: "Expenses" },
      { to: "/meetings", label: "Ministers" },
      { to: "/lobbying", label: "Lobbying" },
      { to: "/acoba", label: "Revolving Door" },
    ],
  },
  {
    label: "Public services",
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
      { to: "/crossref", label: "Cross-reference" },
      { to: "/projects", label: "Major projects" },
      { to: "/briefing", label: "AI briefing" },
      { to: "/methodology", label: "Methodology" },
    ],
  },
];

const MyAreaLabel = ({ label }: { label: string }) => (
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
    {label}
  </span>
);

export function SiteShell() {
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close menus on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [loc.pathname]);

  // Close the "More" dropdown on outside click / Escape.
  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const isActive = (to: string) =>
    loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));

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

          {/* Desktop nav — five primary items + a single "More" menu */}
          <nav className="hidden sm:flex items-center gap-0 flex-1 min-w-0">
            {PRIMARY_NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "px-2.5 py-3 text-[11px] label-mono uppercase tracking-wider transition-colors whitespace-nowrap border-b-2",
                  isActive(n.to)
                    ? "border-amber text-amber"
                    : "border-transparent text-foreground hover:text-amber",
                )}
                title={n.to === "/my-area" ? "Your constituency data" : undefined}
              >
                {n.to === "/my-area" ? <MyAreaLabel label={n.label} /> : n.label}
              </Link>
            ))}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                className={cn(
                  "px-2.5 py-3 text-[11px] label-mono uppercase tracking-wider transition-colors whitespace-nowrap border-b-2 inline-flex items-center gap-1",
                  moreOpen
                    ? "border-amber text-amber"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                More
                <svg
                  className={cn("transition-transform", moreOpen && "rotate-180")}
                  width="9"
                  height="9"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M3 4.5l3 3 3-3" />
                </svg>
              </button>
              {moreOpen && (
                <div className="absolute right-0 top-full mt-px w-[34rem] max-w-[90vw] rounded-b-lg border border-border border-t-0 bg-surface shadow-xl p-4 grid grid-cols-2 gap-x-6 gap-y-4 z-50">
                  {MORE_GROUPS.map((group) => (
                    <div key={group.label}>
                      <div className="label-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">
                        {group.label}
                      </div>
                      <div className="flex flex-col">
                        {group.items.map((n) => (
                          <Link
                            key={n.to}
                            to={n.to}
                            className={cn(
                              "py-1 text-[12px] transition-colors",
                              isActive(n.to)
                                ? "text-amber"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {n.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="col-span-2 border-t border-border pt-2">
                    <Link
                      to="/tools"
                      className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
                    >
                      Browse all tools →
                    </Link>
                  </div>
                </div>
              )}
            </div>
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
            aria-expanded={menuOpen}
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

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-border bg-surface">
            {/* Primary */}
            <div className="px-3 py-2 border-b border-border">
              <div className="grid grid-cols-2 gap-px">
                {PRIMARY_NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "px-2 py-2 rounded text-[12px] label-mono uppercase tracking-wider transition-colors",
                      isActive(n.to)
                        ? "bg-amber/10 text-amber"
                        : "text-foreground/80 hover:text-foreground hover:bg-surface-2",
                    )}
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
            </div>
            {/* Grouped */}
            {MORE_GROUPS.map((group) => (
              <div key={group.label} className="px-3 py-2 border-b border-border last:border-b-0">
                <div className="label-mono text-[10px] uppercase tracking-[0.15em] px-1 mb-1.5 text-muted-foreground/60">
                  {group.label}
                </div>
                <div className="grid grid-cols-3 gap-px">
                  {group.items.map((n) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={cn(
                        "px-2 py-2 rounded text-[11px] label-mono uppercase tracking-wider transition-colors",
                        isActive(n.to)
                          ? "bg-amber/10 text-amber"
                          : "text-muted-foreground hover:text-foreground hover:bg-surface-2",
                      )}
                    >
                      {n.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="px-3 py-2">
              <Link
                to="/tools"
                className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
              >
                Browse all tools →
              </Link>
            </div>
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
            <div className="flex flex-wrap gap-4">
              <Link
                to="/tools"
                className="label-mono text-[10px] uppercase tracking-wider hover:text-amber transition-colors"
              >
                All tools
              </Link>
              <Link
                to="/about"
                className="label-mono text-[10px] uppercase tracking-wider hover:text-amber transition-colors"
              >
                How to use this site →
              </Link>
            </div>
          </div>
          <p>
            Sources: Parliament APIs, Contracts Finder, Electoral Commission, IPSA, data.police.uk,
            Environment Agency, NHS England, DWP, ONS, GOV.UK. Built on open public data under the{" "}
            <a
              href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
              className="underline hover:text-amber"
              target="_blank"
              rel="noreferrer"
            >
              Open Government Licence v3.0
            </a>{" "}
            and the{" "}
            <a
              href="https://www.parliament.uk/site-information/copyright-parliament/open-parliament-licence/"
              className="underline hover:text-amber"
              target="_blank"
              rel="noreferrer"
            >
              Open Parliament Licence
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
