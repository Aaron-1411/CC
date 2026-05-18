import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Compass,
  Banknote,
  PiggyBank,
  Landmark,
  Home,
  Wallet,
  GraduationCap,
  Sparkles,
  ScrollText,
  User,
  FileText,
} from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/strategy", label: "Strategy", icon: Compass },
  { to: "/income", label: "Income", icon: Banknote },
  { to: "/pensions", label: "Pensions", icon: PiggyBank },
  { to: "/isas", label: "ISAs", icon: Landmark },
  { to: "/mortgage", label: "Mortgage", icon: Home },
  { to: "/savings", label: "Savings", icon: Wallet },
  { to: "/student-loan", label: "Student Loan", icon: GraduationCap },
  { to: "/portfolio", label: "Custom Portfolio", icon: Sparkles },
  { to: "/self-assessment", label: "Self Assessment", icon: FileText },
  { to: "/eligibility", label: "Eligibility", icon: ScrollText },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-5 pt-6 pb-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center text-sidebar-primary-foreground font-bold font-display">
            £
          </div>
          <div>
            <div className="font-display font-semibold tracking-tight">Sterling</div>
            <div className="text-[11px] text-sidebar-foreground/60 -mt-0.5">UK Wealth Tracker</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary font-semibold"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-[11px] text-sidebar-foreground/50 border-t border-sidebar-border">
        UK rules — 2025/26 tax year. Local data only.
      </div>
    </aside>
  );
}

export function MobileNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar text-sidebar-foreground border-t border-sidebar-border flex justify-around py-1.5">
      {items.slice(0, 6).map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
              active ? "text-sidebar-primary" : "text-sidebar-foreground/70"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
