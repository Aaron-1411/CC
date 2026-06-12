import { NavLink } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
    isActive ? "text-amber-300" : "text-slate-500"
  }`;

export function BottomNav() {
  const { user } = useAuth();

  // Logged out: the wheel is home ("just spin"); posting routes through sign-in.
  // Logged in: the social feed is home, with the wheel a tap away.
  const items = user
    ? [
        { to: "/", end: true, icon: "🍽️", label: "Feed" },
        { to: "/discover", end: false, icon: "🎡", label: "Spin" },
        { to: "/compose", end: false, icon: "➕", label: "Post" },
        { to: `/u/${user.handle}`, end: false, icon: "🙂", label: "You" },
      ]
    : [
        { to: "/", end: true, icon: "🎡", label: "Spin" },
        { to: "/feed", end: false, icon: "🍽️", label: "Feed" },
        { to: "/login?next=/compose", end: false, icon: "➕", label: "Post" },
        { to: "/login", end: false, icon: "👤", label: "Sign in" },
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b0f17]/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch">
        {items.map((it) => (
          <NavLink key={it.label} to={it.to} end={it.end} className={tab}>
            <span className="text-lg leading-none">{it.icon}</span>
            {it.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
