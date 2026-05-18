import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Bookmark, Sparkles } from "lucide-react";
import { trackTool } from "@/lib/audit";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { PILLARS } from "@/lib/pillars";

// Short, consistent group labels — surfaced in tests and screen readers.
const GROUP_LABELS: Record<string, string> = {
  verdict: "Verdict",
  affordability: "Affordability",
  area: "Area",
  property: "Property",
  risk: "Risk",
  plan: "Plan",
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname, search } = useLocation();
  // One toggle per pillar — consistent "Show advanced" behavior across every group.
  const [showAdvanced, setShowAdvanced] = useState<Record<string, boolean>>({});

  const track = (slug: string) => trackTool(`nav.${slug.replace(/^\/+/, "") || "home"}`, { source: "sidebar" });

  const isActive = (path: string) =>
    pathname === path || (path !== "/" && pathname.startsWith(path));

  const linkBase = "flex items-center gap-3 w-full transition-colors";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <NavLink
          to="/"
          className="flex items-center justify-center w-full"
          aria-label="settld home"
        >
          <img
            src="/logo-settld.png"
            alt="settld"
            className={
              collapsed
                ? "h-7 w-7 object-contain"
                : "h-9 sm:h-10 w-auto max-w-full object-contain"
            }
          />
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        {PILLARS.map((p) => {
          const adv = showAdvanced[p.id] ?? false;
          const subItems = p.more.filter((m) => adv || !m.advanced);
          const hiddenCount = p.more.length - subItems.length;
          const label = GROUP_LABELS[p.id] ?? p.title;

          return (
            <SidebarGroup key={p.id} aria-label={label}>
              <SidebarGroupLabel>{label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive(p.to)} tooltip={p.title}>
                      <NavLink to={{ pathname: p.to, search }} onClick={() => track(p.to)} className={linkBase} end>
                        <p.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{p.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {!collapsed && subItems.map((m) => (
                    <SidebarMenuItem key={m.to}>
                      <SidebarMenuButton asChild isActive={isActive(m.to)} size="sm">
                        <NavLink to={{ pathname: m.to, search }} onClick={() => track(m.to)} className={linkBase}>
                          <m.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate text-xs">{m.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  {!collapsed && hiddenCount > 0 && (
                    <SidebarMenuItem>
                      <button
                        type="button"
                        onClick={() => setShowAdvanced((s) => ({ ...s, [p.id]: true }))}
                        className="flex items-center gap-1.5 px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                        aria-label={`Show ${hiddenCount} advanced ${label} tools`}
                      >
                        <Sparkles className="h-3 w-3" /> Show {hiddenCount} advanced
                      </button>
                    </SidebarMenuItem>
                  )}
                  {!collapsed && adv && p.more.some((m) => m.advanced) && (
                    <SidebarMenuItem>
                      <button
                        type="button"
                        onClick={() => setShowAdvanced((s) => ({ ...s, [p.id]: false }))}
                        className="flex items-center gap-1.5 px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        Hide advanced
                      </button>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        <SidebarGroup aria-label="Saved">
          <SidebarGroupLabel>Saved</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/shortlist")} tooltip="Shortlist">
                  <NavLink to={{ pathname: "/shortlist", search }} onClick={() => track("/shortlist")} className={linkBase}>
                    <Bookmark className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">Shortlist</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
