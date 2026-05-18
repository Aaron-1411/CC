import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import ScenarioBar from "@/components/ScenarioBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Breadcrumbs from "@/components/Breadcrumbs";
import NextStepCTA from "@/components/NextStepCTA";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import HollyAssistant from "@/components/HollyAssistant";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { migrateLocalToRemote } from "@/lib/shortlist";
import { toast } from "@/hooks/use-toast";
import { LogOut, User as UserIcon } from "lucide-react";
import { trackTool } from "@/lib/audit";

export default function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const migratedRef = useRef<string | null>(null);

  // On first sign-in for a session, migrate any local shortlist into the account.
  useEffect(() => {
    if (!user || migratedRef.current === user.id) return;
    migratedRef.current = user.id;
    migrateLocalToRemote(user.id).then((n) => {
      if (n > 0) {
        toast({ title: "Synced to your account", description: `${n} saved propert${n === 1 ? "y" : "ies"} moved into your account.` });
      }
    });
  }, [user]);

  // Lightweight per-page usage telemetry. Throttled to once per tool per 60s
  // and only fires for signed-in users (anon visits aren't useful for the
  // admin's user-base growth analytics).
  useEffect(() => {
    if (!user) return;
    const slug = pathname.replace(/^\/+/, "").split("/")[0] || "home";
    if (["auth", "__admin", "admin"].includes(slug)) return;
    trackTool(slug);
  }, [pathname, user]);

  // Persistent scenario pill — show on every page except the marketing landing
  // and onboarding wizard. Users were getting confused which numbers carried over.
  const showScenarioBar = pathname !== "/" && !pathname.startsWith("/start/");

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "";

  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-brand focus:text-brand-foreground focus:px-3 focus:py-2 focus:rounded-md focus:shadow-card"
      >
        Skip to main content
      </a>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card/60 backdrop-blur px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="hidden sm:inline text-xs uppercase tracking-widest text-muted-foreground ml-2">
                A‑to‑Z First‑Time Buyer Toolkit
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link to="/calculator">Calculator</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link to="/guides">Guides</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/shortlist">Saved</Link>
              </Button>
              {loading ? null : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="font-mono text-xs">
                      <UserIcon className="h-3.5 w-3.5 mr-1.5" />
                      {initials}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground truncate max-w-[220px]">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/shortlist")}>Saved properties</DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => { await signOut(); navigate("/"); }}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                  onClick={() => navigate(`/auth?redirect=${encodeURIComponent(pathname)}`)}
                >
                  Sign in
                </Button>
              )}
            </div>
          </header>

          {showScenarioBar && <ScenarioBar />}
          <Breadcrumbs />

          <main id="main-content" className="flex-1 pb-20 md:pb-0" tabIndex={-1}>
            <Outlet />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
              <NextStepCTA />
            </div>
            <Footer />
          </main>
          <MobileBottomNav />
          <CookieBanner />
          <HollyAssistant />
        </div>
      </div>
    </SidebarProvider>
  );
}
