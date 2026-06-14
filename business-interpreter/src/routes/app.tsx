import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Workflow, FileSpreadsheet, Search, ListChecks, Microscope } from "lucide-react";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
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
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <Link to="/app" className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Workflow className="h-5 w-5 text-primary" />
          <span className="font-semibold">Workbench</span>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          <NavLink to="/app" icon={<FileSpreadsheet className="h-4 w-4" />} label="Jobs" />
          <NavLink
            to="/app/research/new"
            icon={<Search className="h-4 w-4" />}
            label="New research"
          />
          <NavLink
            to="/app/processes"
            icon={<ListChecks className="h-4 w-4" />}
            label="Processes"
          />
          <NavLink
            to="/app/analyzer"
            icon={<Microscope className="h-4 w-4" />}
            label="Sheet analyzer"
          />
        </nav>
        <button
          onClick={signOut}
          className="flex items-center gap-2 border-t border-border px-5 py-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
      activeProps={{ className: "bg-accent text-accent-foreground" }}
    >
      {icon}
      {label}
    </Link>
  );
}
