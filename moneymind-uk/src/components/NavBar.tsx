import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Flame, Menu, PoundSterling, X, Zap } from "lucide-react";
import { clsx } from "clsx";
import type { ProgressState } from "../lib/types";
import { currentRank } from "../lib/gamification";
import { PageContainer } from "./PageContainer";

interface NavBarProps {
  progress: ProgressState;
}

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const NAV_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/kids", label: "For Kids" },
  { to: "/rights", label: "Your Rights" },
  { to: "/help", label: "Find Help" },
  { to: "/about", label: "About" },
];

export function NavBar({ progress }: NavBarProps) {
  const [open, setOpen] = useState(false);
  const rank = currentRank(progress);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-navy-100">
      <PageContainer>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg">
            <span className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">M</span>
            MoneyMind
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  clsx(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                    isActive ? "bg-navy-900 text-white" : "text-navy-600 hover:bg-navy-100",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Money Found + rank + streak (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full"
              title="Money found through quests"
            >
              <PoundSterling className="h-3.5 w-3.5" aria-hidden />
              {gbp.format(progress.moneyFound)}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-navy-600 bg-navy-100 px-3 py-1.5 rounded-full" title={`${progress.xp} XP`}>
              <Zap className="h-3.5 w-3.5" aria-hidden />
              {rank}
            </div>
            {progress.streak.count > 0 && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                <Flame className="h-3.5 w-3.5" aria-hidden />
                {progress.streak.count}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl text-navy-600 hover:bg-navy-100 transition-colors duration-150 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </PageContainer>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-navy-100 bg-white pb-4">
          <PageContainer>
            <nav className="flex flex-col gap-1 pt-3">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                      isActive ? "bg-navy-900 text-white" : "text-navy-700 hover:bg-navy-100",
                    )
                  }
                >
                  {label}
                </NavLink>
              ))}
              <div className="flex flex-wrap items-center gap-3 mt-3 px-4">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <PoundSterling className="h-3.5 w-3.5" aria-hidden />
                  {gbp.format(progress.moneyFound)} found
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-navy-600 bg-navy-100 px-3 py-1.5 rounded-full">
                  <Zap className="h-3.5 w-3.5" aria-hidden />
                  {rank} · {progress.xp} XP
                </div>
                {progress.streak.count > 0 && (
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                    <Flame className="h-3.5 w-3.5" aria-hidden />
                    {progress.streak.count} day streak
                  </div>
                )}
              </div>
            </nav>
          </PageContainer>
        </div>
      )}
    </header>
  );
}
