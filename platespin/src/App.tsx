import { Route, Routes } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { BottomNav } from "@/features/social/BottomNav";
import { FeedPage } from "@/pages/FeedPage";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { ComposePage } from "@/pages/ComposePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { VenuePage } from "@/pages/VenuePage";
import { LoginPage } from "@/pages/LoginPage";

// The front door. Anyone can "just spin" without an account, so logged-out
// visitors land on the wheel; signed-in users get their social feed as home.
function Home() {
  const { user, loading } = useAuth();
  if (loading) return <p className="py-16 text-center text-sm text-slate-500">Loading…</p>;
  return user ? <FeedPage /> : <DiscoverPage />;
}

// v2 shell: a single mobile-width column with a fixed bottom tab bar. Each route
// renders its own header so pages stay self-contained.
export default function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-24 pt-6">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/compose" element={<ComposePage />} />
        <Route path="/u/:handle" element={<ProfilePage />} />
        <Route path="/venue" element={<VenuePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
