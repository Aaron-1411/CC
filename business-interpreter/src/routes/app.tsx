import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut,
  Workflow,
  FileSpreadsheet,
  Search,
  ListChecks,
  Microscope,
  Table2,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };

const NAV_ITEMS: NavItem[] = [
  { to: "/app", label: "Jobs", icon: FileSpreadsheet, exact: true },
  { to: "/app/research/new", label: "New research", icon: Search },
  { to: "/app/processes", label: "Processes", icon: ListChecks },
  { to: "/app/analyzer", label: "Sheet analyzer", icon: Microscope },
  { to: "/app/reporting", label: "Reporting", icon: Table2 },
];

function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Workflow className="h-4 w-4" />
      </span>
      <span className="font-semibold tracking-tight">Workbench</span>
    </span>
  );
}

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate({ to: "/auth" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <Link to="/app" className="border-b border-border px-5 py-4">
          <BrandMark />
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
        </nav>
        <button
          onClick={signOut}
          className="flex items-center gap-2 border-t border-border px-5 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <Link to="/app" onClick={() => setMobileOpen(false)}>
          <BrandMark />
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 max-w-[80%] flex-col border-r border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <BrandMark />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} item={item} onNavigate={() => setMobileOpen(false)} />
              ))}
            </nav>
            <button
              onClick={signOut}
              className="flex items-center gap-2 border-t border-border px-5 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </aside>
        </div>
      ) : null}

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeOptions={{ exact: item.exact ?? false }}
      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      activeProps={{
        className: "bg-accent font-medium text-accent-foreground",
      }}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}
