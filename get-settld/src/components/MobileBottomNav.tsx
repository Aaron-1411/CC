import { NavLink, useLocation } from "react-router-dom";
import { MapPinned, Bookmark, Zap, MoreHorizontal } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { trackTool } from "@/lib/audit";

const items = [
  { to: "/areas", label: "Areas", icon: MapPinned },
  { to: "/shortlist", label: "Saved", icon: Bookmark },
  { to: "/decide", label: "Decide", icon: Zap },
];

export default function MobileBottomNav() {
  const { setOpenMobile } = useSidebar();
  const { search } = useLocation();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={{ pathname: it.to, search }}
              onClick={() => trackTool(`nav.${it.to.replace(/^\/+/, "") || "home"}`, { source: "mobile-bottom-nav" })}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] uppercase tracking-wider ${
                  isActive ? "text-brand" : "text-muted-foreground"
                }`
              }
            >
              <it.icon className="h-5 w-5" aria-hidden />
              <span>{it.label}</span>
            </NavLink>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => {
              trackTool("nav.more-sheet", { source: "mobile-bottom-nav" });
              setOpenMobile(true);
            }}
            className="w-full flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] uppercase tracking-wider text-muted-foreground"
            aria-label="Open all tools"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
