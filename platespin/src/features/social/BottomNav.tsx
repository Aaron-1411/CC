import { NavLink } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
    isActive ? "text-amber-300" : "text-slate-500"
  }`;

export function BottomNav() {
  const { user } = useAuth();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b0f17]/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch">
        <NavLink to="/" end className={tab}>
          <span className="text-lg leading-none">🍽️</span>
          Feed
        </NavLink>
        <NavLink to="/discover" className={tab}>
          <span className="text-lg leading-none">🎡</span>
          Spin
        </NavLink>
        <NavLink to="/compose" className={tab}>
          <span className="text-lg leading-none">➕</span>
          Post
        </NavLink>
        <NavLink to={user ? `/u/${user.handle}` : "/login"} className={tab}>
          <span className="text-lg leading-none">{user ? "🙂" : "👤"}</span>
          {user ? "You" : "Sign in"}
        </NavLink>
      </div>
    </nav>
  );
}
