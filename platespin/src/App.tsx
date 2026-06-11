import { Route, Routes } from "react-router-dom";
import { BottomNav } from "@/features/social/BottomNav";
import { FeedPage } from "@/pages/FeedPage";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { ComposePage } from "@/pages/ComposePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { VenuePage } from "@/pages/VenuePage";
import { LoginPage } from "@/pages/LoginPage";

// v2 shell: a single mobile-width column with a fixed bottom tab bar. Each route
// renders its own header so pages stay self-contained.
export default function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-24 pt-6">
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/compose" element={<ComposePage />} />
        <Route path="/u/:handle" element={<ProfilePage />} />
        <Route path="/venue" element={<VenuePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<FeedPage />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
